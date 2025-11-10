// src/app/(crm)/api/ofertas-tarifa/import/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// export const maxDuration = 60;

/** Normaliza nombres de columna (quita tildes, NBSPs, mayúsculas, signos, puntos) */
function normKey(s: any) {
  return String(s || "")
    .replace(/\u00A0/g, " ") // NBSP -> espacio
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sin acentos
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^\w %/().-]/g, "")
    .replace(/\s*\(([^)]*)\)/g, " ($1)");
}

/** Devuelve el primer campo existente del row que case con alguna etiqueta prevista */
function pick(r: Record<string, any>, labels: string[], def: any = null) {
  for (const lbl of labels) {
    const k = normKey(lbl);
    if (r[k] !== undefined && r[k] !== null && r[k] !== "") return r[k];
  }
  return def;
}

function toNum(v: any) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string") v = v.replace(",", ".").trim();
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type Key = string;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const tipoGlobal = ((form.get("tipo") as string) || "LUZ").toUpperCase();
    const subtipoGlobal = (form.get("subtipo") as string | null) || null; // "2.0TD"|"3.0TD"|"6.1TD"
    const replace = form.get("replace") === "true";
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Falta el fichero Excel" }, { status: 400 });

    const filename = (file as any).name || "archivo.xlsx";
    if (!/\.(xlsx|xls)$/i.test(filename)) {
      return NextResponse.json({ error: "Formato no soportado. Sube un .xlsx o .xls" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buf, { type: "buffer" });
    } catch (e: any) {
      console.error("XLSX.read error:", e);
      return NextResponse.json({ error: "No se pudo leer el Excel. Revisa el formato." }, { status: 400 });
    }

    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return NextResponse.json({ error: "El Excel no tiene hojas" }, { status: 400 });

    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });
    if (!rawRows.length) return NextResponse.json({ error: "El Excel está vacío" }, { status: 400 });

    // Normalizamos todas las keys del row
    const rows = rawRows.map((r) => {
      const n: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) n[normKey(k)] = v;
      return n;
    });

    // Reemplazar subtipo completo si lo piden
    if (replace && subtipoGlobal) {
      await prisma.ofertaTarifa.deleteMany({
        where: { tipo: tipoGlobal as any, subtipo: subtipoGlobal },
      });
    }

    // MAPEOS de tu Excel
    const LABELS = {
      tarifa: ["tarifa", "subtipo"],
      nombre: ["nombre", "nombre tarifa", "tarifa"],
      compania: ["compañia", "compania"],
      // precios energía
      p1: ["p.c.1 (€/kwh)", "pc1", "precio p1", "p1"],
      p2: ["p.c.2 (€/kwh)", "pc2", "precio p2", "p2"],
      p3: ["p.c.3 (€/kwh)", "pc3", "precio p3", "p3"],
      p4: ["p.c.4 (€/kwh)", "pc4", "precio p4", "p4"],
      p5: ["p.c.5 (€/kwh)", "pc5", "precio p5", "p5"],
      p6: ["p.c.6 (€/kwh)", "pc6", "precio p6", "p6"],
      // comisiones
      comBase: ["comision mia", "comisión mia", "comision €/kwh", "comisión €/kwh", "comision_kwh_admin_base"],
      comTramoKwh: ["co cons.", "comision_kwh_admin_tramo", "comision_kwh_admin", "comisión_kwh_admin_tramo"],
      comTramoFija: ["comision comparador", "comision_fija_admin", "comisión fija admin"],
      // consumo (tu Excel parece mensual)
      consumo: ["consumo", "consumo mensual", "consumo_desde_mensual"],
    };

    const group: Record<Key, { base: any; tramos: any[] }> = {};

    for (const r of rows) {
      const tipo = (tipoGlobal || "LUZ").toUpperCase();
      const subtipo = (subtipoGlobal || String(pick(r, LABELS.tarifa, "2.0TD"))).toUpperCase();

      const compania = String(pick(r, LABELS.compania, "N/D")).trim();
      const nombre = String(pick(r, LABELS.nombre, subtipo)).trim();

      const p1 = toNum(pick(r, LABELS.p1));
      const p2 = toNum(pick(r, LABELS.p2));
      const p3 = toNum(pick(r, LABELS.p3));
      const p4 = toNum(pick(r, LABELS.p4));
      const p5 = toNum(pick(r, LABELS.p5));
      const p6 = toNum(pick(r, LABELS.p6));

      const comisionKwhAdminBase = toNum(pick(r, LABELS.comBase));

      const key: Key = JSON.stringify([tipo, subtipo, compania, nombre, null]);

      if (!group[key]) {
        group[key] = {
          base: {
            tipo,
            subtipo,
            compania,
            anexoPrecio: null, // puede ser null
            nombre,
            descripcion: null,
            descripcionCorta: null,
            activa: true,
            destacada: false,
            precioKwhP1: p1,
            precioKwhP2: p2,
            precioKwhP3: p3,
            precioKwhP4: p4,
            precioKwhP5: p5,
            precioKwhP6: p6,
            comisionKwhAdminBase,
            payload: null,
          },
          tramos: [],
        };
      }

      // Tramo: consumo mensual → anual (×12); luego cerraremos [desde, hasta)
      const consumoMes = toNum(pick(r, LABELS.consumo));
      const comTramoKwh = toNum(pick(r, LABELS.comTramoKwh));
      const comTramoFija = toNum(pick(r, LABELS.comTramoFija));

      if (consumoMes !== null || comTramoKwh !== null || comTramoFija !== null) {
        const desdeAnual = consumoMes !== null ? Math.round(consumoMes * 12) : 0;
        group[key].tramos.push({
          consumoDesdeKWh: desdeAnual,
          consumoHastaKWh: null, // se rellenará al ordenar
          comisionKwhAdmin: comTramoKwh, // €/kWh
          comisionFijaAdmin: comTramoFija, // €
          activo: true,
          notas: null,
        });
      }
    }

    // Ordenar tramos y cerrar rangos [desde, hasta)
    for (const g of Object.values(group)) {
      g.tramos.sort((a, b) => (a.consumoDesdeKWh ?? 0) - (b.consumoDesdeKWh ?? 0));
      for (let i = 0; i < g.tramos.length; i++) {
        g.tramos[i].consumoHastaKWh =
          i < g.tramos.length - 1 ? g.tramos[i + 1].consumoDesdeKWh : null;
      }
    }

    // ==== Transacción funcional (evita el error de tipos) ====
    const upserts = await prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (const g of Object.values(group)) {
        const updateFields = {
          descripcion: g.base.descripcion,
          activa: true,
          precioKwhP1: g.base.precioKwhP1,
          precioKwhP2: g.base.precioKwhP2,
          precioKwhP3: g.base.precioKwhP3,
          precioKwhP4: g.base.precioKwhP4,
          precioKwhP5: g.base.precioKwhP5,
          precioKwhP6: g.base.precioKwhP6,
          comisionKwhAdminBase: g.base.comisionKwhAdminBase,
          payload: g.base.payload,
          tramos: { deleteMany: {} },
        };

        let row;
        if (g.base.anexoPrecio) {
          // anexoPrecio con valor → usar upsert sobre la clave compuesta
          row = await tx.ofertaTarifa.upsert({
            where: {
              // @@unique([tipo, subtipo, compania, nombre, anexoPrecio])
              // @ts-ignore
              tipo_subtipo_compania_nombre_anexoPrecio: {
                tipo: g.base.tipo,
                subtipo: g.base.subtipo,
                compania: g.base.compania,
                nombre: g.base.nombre,
                anexoPrecio: g.base.anexoPrecio,
              },
            },
            update: updateFields,
            create: { ...g.base },
          });
        } else {
          // anexoPrecio == null → buscar y actualizar o crear
          const existing = await tx.ofertaTarifa.findFirst({
            where: {
              tipo: g.base.tipo as any,
              subtipo: g.base.subtipo,
              compania: g.base.compania,
              nombre: g.base.nombre,
              anexoPrecio: null,
            },
          });

          if (existing) {
            row = await tx.ofertaTarifa.update({
              where: { id: existing.id },
              data: updateFields,
            });
          } else {
            row = await tx.ofertaTarifa.create({ data: { ...g.base } });
          }
        }

        results.push(row);
      }

      return results;
    });

    // Recrear tramos fuera (otra transacción para los creates)
    let tramos = 0;
    const creates: any[] = [];
    for (const up of upserts) {
      const key: Key = JSON.stringify([up.tipo, up.subtipo, up.compania, up.nombre, up.anexoPrecio]);
      const g = group[key];
      if (!g) continue;
      for (const t of g.tramos) {
        creates.push(
          prisma.ofertaTarifaTramo.create({
            data: { ...t, ofertaTarifaId: up.id },
          })
        );
        tramos++;
      }
    }
    if (creates.length) await prisma.$transaction(creates);

    return NextResponse.json({ ok: true, ofertas: upserts.length, tramos });
  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json({ error: err?.message || "Error interno importando Excel" }, { status: 500 });
  }
}
