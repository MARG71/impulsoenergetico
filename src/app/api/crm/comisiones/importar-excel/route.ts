export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole } from "@/lib/auth-server";
import * as XLSX from "xlsx";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeKey(k: string) {
  return String(k ?? "")
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[().]/g, "")
    .replace(/€/g, "eur");
}

function parseEuro(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;

  const s = String(v)
    .replace(/\u00a0/g, " ")
    .replace("€", "")
    .trim();

  if (!s || s === "-") return null;

  // "1.480,00" => 1480.00
  const cleaned = s
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.\-]/g, "");

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseRangeNums(text: any) {
  // Ej: "0 ≤ c ≤ 100.000"  | "100.001 ≤ c ≤ 9.999.999"
  const s = String(text ?? "")
    .replace(/\u00a0/g, " ")
    .trim();
  if (!s) return { min: null, max: null };

  const nums = s
    .split(/≤|>=|<=|<|>|=|\s+/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) =>
      Number(
        x
          .replace(/\./g, "")
          .replace(",", ".")
          .replace(/[^0-9.\-]/g, "")
      )
    )
    .filter((n) => Number.isFinite(n));

  if (nums.length >= 2) return { min: nums[0], max: nums[nums.length - 1] };
  if (nums.length === 1) return { min: nums[0], max: null };
  return { min: null, max: null };
}

async function ensureDefaultConfig(seccionId: number) {
  // si no existe config global, crea defaults razonables (editable luego)
  const existing = await prisma.configNivelComision.findFirst({
    where: { adminId: null, seccionId, subSeccionId: null },
  });
  if (existing) return;

  await prisma.configNivelComision.createMany({
    data: [
      { adminId: null, seccionId, subSeccionId: null, nivel: "C1", pctSobreBase: 80 as any },
      { adminId: null, seccionId, subSeccionId: null, nivel: "C2", pctSobreBase: 90 as any },
      { adminId: null, seccionId, subSeccionId: null, nivel: "C3", pctSobreBase: 100 as any },
      { adminId: null, seccionId, subSeccionId: null, nivel: "ESPECIAL", pctSobreBase: 110 as any },
    ] as any,
  });
}

async function getPctForNivel(seccionId: number, subSeccionId: number | null) {
  // Prioridad: subSeccionId exacto -> sección general
  const rows = await prisma.configNivelComision.findMany({
    where: {
      adminId: null,
      seccionId,
      OR: [{ subSeccionId }, { subSeccionId: null }],
      activa: true,
    },
  });

  const pick = (nivel: string) => {
    const exact = rows.find((r: any) => r.subSeccionId === subSeccionId && r.nivel === nivel);
    const general = rows.find((r: any) => r.subSeccionId === null && r.nivel === nivel);
    const v = (exact ?? general)?.pctSobreBase;
    return Number(v ?? 0);
  };

  return {
    C1: pick("C1"),
    C2: pick("C2"),
    C3: pick("C3"),
    ESPECIAL: pick("ESPECIAL"),
  };
}

export async function POST(req: Request) {
  const session = await getSessionOrThrow();
  const role = String(sessionRole(session) ?? "").toUpperCase();
  if (role !== "SUPERADMIN") return jsonError("No autorizado", 403);

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("formData inválido", 400);

  const file = form.get("file") as File | null;
  const seccionNombre = String(form.get("seccion") ?? "LUZ").toUpperCase().trim();

  if (!file) return jsonError("Archivo requerido (file)", 400);

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });

  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });

  if (!raw.length) return jsonError("El Excel no tiene filas", 400);

  // Normaliza keys
  const rows = raw.map((r) => {
    const out: any = {};
    for (const [k, v] of Object.entries(r)) out[normalizeKey(k)] = v;
    return out;
  });

  // 1) Sección (global)
  const seccionSlug = slugify(seccionNombre);
  const seccion = await prisma.seccion.upsert({
    where: { slug: seccionSlug },
    update: { nombre: seccionNombre, activa: true },
    create: { nombre: seccionNombre, slug: seccionSlug, activa: true, adminId: null },
  });

  await ensureDefaultConfig(seccion.id);

  let createdTarifas = 0;
  let upsertedTramos = 0;
  let createdRules = 0;

  for (const r of rows) {
    const tarifa = String(r["tarifa"] ?? "").trim();            // 2.0TD
    const nombre = String(r["nombre"] ?? "").trim();            // nombre comercial
    const tipo = String(r["tipo"] ?? "").trim();                // PYME/RESI
    const compania = String(r["compañía"] ?? r["compania"] ?? "").trim(); // ACCIONA
    const validez = r["validez"];                               // fecha
    const comisionBaseEUR = parseEuro(r["comisión"] ?? r["comision"]);    // "480,00 €"

    if (!tarifa || !nombre || !compania) continue;

    // rangos
    const consumoTxt = r["consumo"];
    const potenciaTxt = r["potencia"];

    const consumo = parseRangeNums(consumoTxt);
    const potencia = parseRangeNums(potenciaTxt);

    // precios
    const pp1 = r["pp1 €/kw/año"] ?? r["pp1 eurkwaño"];
    const pp2 = r["pp2 €/kw/año"] ?? r["pp2 eurkwaño"];

    const pc1 = r["pc1 €/kwh"] ?? r["pc1 eurkwh"];
    const pc2 = r["pc2 €/kwh"] ?? r["pc2 eurkwh"];
    const pc3 = r["pc3 €/kwh"] ?? r["pc3 eurkwh"];

    // anexoPrecio: usamos la fecha de validez si viene
    const anexoPrecio =
        validez instanceof Date
            ? validez.toISOString().slice(0, 10)
            : String(validez ?? "").trim() || "";


    // 2) Catálogo: OfertaTarifa (LUZ por defecto, subtipo=tarifa)
    const tipoOferta = seccionNombre === "GAS" ? "GAS" : seccionNombre === "TELEFONIA" ? "TELEFONIA" : "LUZ";

    // Para evitar explosión en el unique, usamos nombre = nombre (del excel)
    const ofertaTarifa = await prisma.ofertaTarifa.upsert({
      where: {
        tipo_subtipo_compania_nombre_anexoPrecio: {
          tipo: tipoOferta as any,
          subtipo: tarifa,
          compania,
          nombre,
          anexoPrecio,
        },
      },
      update: {
        tipoCliente: tipo ? (tipo === "PYME" ? "PYME" : "RESIDENCIAL") as any : undefined,
        activa: true,
        destacada: false,
        precioPotenciaP1: pp1 ?? undefined,
        precioPotenciaP2: pp2 ?? undefined,
        precioKwhP1: pc1 ?? undefined,
        precioKwhP2: pc2 ?? undefined,
        precioKwhP3: pc3 ?? undefined,
      } as any,
      create: {
        tipo: tipoOferta as any,
        subtipo: tarifa,
        compania,
        nombre,
        anexoPrecio,
        activa: true,
        destacada: false,
        tipoCliente: tipo ? (tipo === "PYME" ? "PYME" : "RESIDENCIAL") as any : undefined,
        precioPotenciaP1: pp1 ?? null,
        precioPotenciaP2: pp2 ?? null,
        precioKwhP1: pc1 ?? null,
        precioKwhP2: pc2 ?? null,
        precioKwhP3: pc3 ?? null,
      } as any,
    });

    // 3) Tramo: OfertaTarifaTramo (si hay consumo)
    const consumoDesde = consumo.min ? Math.round(consumo.min) : 0;
    const consumoHasta = consumo.max ? Math.round(consumo.max) : null;

    const tramo = await prisma.ofertaTarifaTramo.upsert({
      where: {
        ofertaTarifaId_consumoDesdeKWh_consumoHastaKWh: {
          ofertaTarifaId: ofertaTarifa.id,
          consumoDesdeKWh: consumoDesde,
          consumoHastaKWh: consumoHasta,
        },
      },
      update: {
        activo: true,
        comisionFijaAdmin: comisionBaseEUR ?? undefined,
        pctAgente: null,
        pctLugar: null,
        pctCliente: null,
        notas: null,
      } as any,
      create: {
        ofertaTarifaId: ofertaTarifa.id,
        consumoDesdeKWh: consumoDesde,
        consumoHastaKWh: consumoHasta,
        activo: true,
        comisionFijaAdmin: comisionBaseEUR ?? null,
        notas: null,
      } as any,
    });

    // 4) Árbol Sección/SubSección para reglas (compañía -> tarifa -> anexo -> tramo)
    const subCompany = await prisma.subSeccion.upsert({
      where: { seccionId_slug: { seccionId: seccion.id, slug: slugify(compania) } },
      update: { nombre: compania, activa: true, parentId: null, adminId: null },
      create: { seccionId: seccion.id, nombre: compania, slug: slugify(compania), activa: true, parentId: null, adminId: null },
    });

    const subTarifa = await prisma.subSeccion.upsert({
      where: { seccionId_slug: { seccionId: seccion.id, slug: slugify(`${compania}-${tarifa}`) } },
      update: { nombre: tarifa, activa: true, parentId: subCompany.id, adminId: null },
      create: { seccionId: seccion.id, nombre: tarifa, slug: slugify(`${compania}-${tarifa}`), activa: true, parentId: subCompany.id, adminId: null },
    });

    const anexoLabel = anexoPrecio ? anexoPrecio : "sin-anexo";

    const subAnexo = await prisma.subSeccion.upsert({
      where: { seccionId_slug: { seccionId: seccion.id, slug: slugify(`${compania}-${tarifa}-${anexoLabel}`) } },
      update: { nombre: anexoLabel, activa: true, parentId: subTarifa.id, adminId: null },
      create: { seccionId: seccion.id, nombre: anexoLabel, slug: slugify(`${compania}-${tarifa}-${anexoLabel}`), activa: true, parentId: subTarifa.id, adminId: null },
    });

    const tramoSlug = slugify(`c-${consumoDesde}-${consumoHasta ?? "max"}-p-${potencia.min ?? 0}-${potencia.max ?? "max"}`);
    const subTramo = await prisma.subSeccion.upsert({
      where: { seccionId_slug: { seccionId: seccion.id, slug: tramoSlug } },
      update: {
        nombre: `Tramo ${consumoDesde}-${consumoHasta ?? "∞"} kWh`,
        activa: true,
        parentId: subAnexo.id,
        adminId: null,
      },
      create: {
        seccionId: seccion.id,
        nombre: `Tramo ${consumoDesde}-${consumoHasta ?? "∞"} kWh`,
        slug: tramoSlug,
        activa: true,
        parentId: subAnexo.id,
        adminId: null,
      },
    });

    // 5) Crear reglas por nivel (derivadas) usando % configurado
    if (comisionBaseEUR && comisionBaseEUR > 0) {
      const pct = await getPctForNivel(seccion.id, null); // por sección (general). Si luego quieres por compañía/tarifa, lo ampliamos.

      const niveles: Array<{ nivel: any; pct: number }> = [
        { nivel: "C1", pct: pct.C1 },
        { nivel: "C2", pct: pct.C2 },
        { nivel: "C3", pct: pct.C3 },
        { nivel: "ESPECIAL", pct: pct.ESPECIAL },
      ];

      for (const it of niveles) {
        const fijo = Math.round((comisionBaseEUR * (it.pct / 100) + Number.EPSILON) * 100) / 100;

        // Upsert por índice (no tienes unique, así que hacemos findFirst+update/create)
        const existing = await prisma.reglaComisionGlobal.findFirst({
          where: {
            adminId: null,
            seccionId: seccion.id,
            subSeccionId: subTramo.id,
            nivel: it.nivel,
            activa: true,
          } as any,
          orderBy: { id: "asc" },
        });

        if (existing) {
          await prisma.reglaComisionGlobal.update({
            where: { id: existing.id },
            data: { tipo: "FIJA", fijoEUR: fijo as any, porcentaje: null, activa: true },
          } as any);
        } else {
          await prisma.reglaComisionGlobal.create({
            data: {
              adminId: null,
              seccionId: seccion.id,
              subSeccionId: subTramo.id,
              nivel: it.nivel,
              tipo: "FIJA",
              fijoEUR: fijo as any,
              porcentaje: null,
              activa: true,
            } as any,
          });
          createdRules++;
        }
      }
    }

    createdTarifas++;
    upsertedTramos++;
  }

  return NextResponse.json({
    ok: true,
    seccion: { id: seccion.id, nombre: seccion.nombre },
    stats: { createdTarifas, upsertedTramos, createdRules },
  });
}
