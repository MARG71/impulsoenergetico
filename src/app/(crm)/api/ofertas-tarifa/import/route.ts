// src/app/(crm)/api/ofertas-tarifa/import/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Normaliza nombres de columna */
function normKey(s: any) {
  return String(s || "")
    .replace(/\u00A0/g, " ")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^\w %/().-]/g, "")
    .replace(/\s*\(([^)]*)\)/g, " ($1)");
}
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
/** Convierte "0-2000" / "0 – 2.000" / "0 a 2000" a [0,2000]. Si no hay “hasta”, devuelve [desde, null] */
function parseRangeToInts(s: any): [number, number|null] | null {
  if (!s && s !== 0) return null;
  const txt = String(s).replace(/\./g, "").replace(",", ".").toLowerCase().trim();
  // separadores típicos: "-", "–", "a", "hasta"
  const parts = txt.split(/-|–|a|hasta/).map(t => t.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const desde = parseInt(parts[0], 10);
  const hasta = parts.length > 1 ? parseInt(parts[1], 10) : null;
  if (!Number.isFinite(desde)) return null;
  if (hasta !== null && !Number.isFinite(hasta)) return [desde, null];
  return [desde, hasta];
}

type Key = string;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const tipoGlobal = ((form.get("tipo") as string) || "LUZ").toUpperCase();
    const subtipoGlobal = (form.get("subtipo") as string | null) || null; // "2.0TD" | "3.0TD" | "6.1TD"
    const replace = form.get("replace") === "true";
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Falta el fichero Excel" }, { status: 400 });
    const filename = (file as any).name || "archivo.xlsx";
    if (!/\.(xlsx|xls)$/i.test(filename)) {
      return NextResponse.json({ error: "Formato no soportado. Sube un .xlsx o .xls" }, { status: 400 });
    }

    // Lee Excel
    const buf = Buffer.from(await file.arrayBuffer());
    let wb: XLSX.WorkBook;
    try { wb = XLSX.read(buf, { type: "buffer" }); }
    catch { return NextResponse.json({ error: "No se pudo leer el Excel." }, { status: 400 }); }

    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return NextResponse.json({ error: "El Excel no tiene hojas" }, { status: 400 });

    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });
    if (!rawRows.length) return NextResponse.json({ error: "El Excel está vacío" }, { status: 400 });

    // Normaliza keys
    const rows = rawRows.map((r) => {
      const n: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) n[normKey(k)] = v;
      return n;
    });

    // Si piden borrar el subtipo entero
    if (replace && subtipoGlobal) {
      await prisma.ofertaTarifa.deleteMany({
        where: { tipo: tipoGlobal as any, subtipo: subtipoGlobal },
      });
    }

    // Mapeo de cabeceras (ajustado a tu Excel)
    const LABELS = {
      // Claves básicas
      compania: ["compañia", "compania"],
      subtipo: ["tarifa", "subtipo"], // por si el Excel trae la tarifa explícita
      // ⚠️ NOMBRE = ANEXO DE PRECIOS (la clave que nos das)
      anexoNombre: ["nombre", "nombre anexo", "anexo", "anexo precio", "epigrafe", "epígrafe"],

      // Energía (€/kWh)
      p1: ["p.c.1 (€/kwh)", "pc1", "precio p1", "p1"],
      p2: ["p.c.2 (€/kwh)", "pc2", "precio p2", "p2"],
      p3: ["p.c.3 (€/kwh)", "pc3", "precio p3", "p3"],
      p4: ["p.c.4 (€/kwh)", "pc4", "precio p4", "p4"],
      p5: ["p.c.5 (€/kwh)", "pc5", "precio p5", "p5"],
      p6: ["p.c.6 (€/kwh)", "pc6", "precio p6", "p6"],

      // Columna F “POTENCIA” → guardamos literal en tramo.notas
      potenciaEtiqueta: ["potencia"],

      // Columna H “CONSUMO” → rango “x-y”
      consumoRango: ["consumo", "consumo rango", "rango consumo"],

      // Columna S “COMISION COMPARADOR”
      comisionComparador: ["comision comparador", "comisión comparador", "comision €/kwh comparador", "comisión €/kwh comparador"],
    };

    const summary = {
      rowsRead: rows.length,
      ofertasToque: 0,
      tramosInsertados: 0,
      tramosDuplicadosSaltados: 0,
      saltadosSinClave: 0,
      saltadosSinConsumo: 0,
    };

    // Sin agrupaciones: para cada fila, upsert de la OfertaTarifa (clave por compania+subtipo+NOMBRE) y create del tramo.
    for (const r of rows) {
      const tipo = (tipoGlobal || "LUZ").toUpperCase();
      const subtipo = (subtipoGlobal || String(pick(r, LABELS.subtipo, "2.0TD"))).toUpperCase();
      const compania = String(pick(r, LABELS.compania, "") ?? "").trim();
      const anexoNombre = String(pick(r, LABELS.anexoNombre, "") ?? "").trim();
      if (!compania || !anexoNombre) { summary.saltadosSinClave++; continue; }

      // Energía
      const p1 = toNum(pick(r, LABELS.p1));
      const p2 = toNum(pick(r, LABELS.p2));
      const p3 = toNum(pick(r, LABELS.p3));
      const p4 = toNum(pick(r, LABELS.p4));
      const p5 = toNum(pick(r, LABELS.p5));
      const p6 = toNum(pick(r, LABELS.p6));

      // Consumo (rango)
      const consumoTxt = pick(r, LABELS.consumoRango, null);
      const rango = parseRangeToInts(consumoTxt);
      if (!rango) { summary.saltadosSinConsumo++; continue; }
      const [desde, hasta] = rango;

      // Comisión por tramo = COMISION COMPARADOR
      const comTramo = toNum(pick(r, LABELS.comisionComparador));
      // Etiqueta de potencia (columna F) → guardamos literal en 'notas'
      const potenciaEtiqueta = pick(r, LABELS.potenciaEtiqueta, null);
      const notas = potenciaEtiqueta ? `POTENCIA: ${String(potenciaEtiqueta).trim()}` : null;

      // Upsert de la Tarifa (clave por tipo, subtipo, compañia, nombre, anexoPrecio)
      // Como “clave es el anexo de precios”, usaremos anexoPrecio = anexoNombre y también nombre = anexoNombre
      const existing = await prisma.ofertaTarifa.findFirst({
        where: {
          tipo: tipo as any,
          subtipo,
          compania,
          nombre: anexoNombre,
          anexoPrecio: anexoNombre,
        },
      });

      let oferta;
      if (existing) {
        oferta = await prisma.ofertaTarifa.update({
          where: { id: existing.id },
          data: {
            activa: true,
            // energía (si cambian en nuevas filas, las vamos refrescando)
            precioKwhP1: p1 ?? existing.precioKwhP1,
            precioKwhP2: p2 ?? existing.precioKwhP2,
            precioKwhP3: p3 ?? existing.precioKwhP3,
            precioKwhP4: p4 ?? existing.precioKwhP4,
            precioKwhP5: p5 ?? existing.precioKwhP5,
            precioKwhP6: p6 ?? existing.precioKwhP6,
            // comisión base sin usar (porque trabajamos por tramos)
            comisionKwhAdminBase: null,
          },
        });
      } else {
        oferta = await prisma.ofertaTarifa.create({
          data: {
            tipo: tipo as any,
            subtipo,
            compania,
            nombre: anexoNombre,
            anexoPrecio: anexoNombre,            // <- clave anexo
            descripcion: null,
            descripcionCorta: null,
            activa: true,
            destacada: false,
            // energía
            precioKwhP1: p1, precioKwhP2: p2, precioKwhP3: p3,
            precioKwhP4: p4, precioKwhP5: p5, precioKwhP6: p6,
            // comisión base (no se usa)
            comisionKwhAdminBase: null,
            payload: undefined,
          },
        });
      }
      summary.ofertasToque++;

      // Crear tramo para esta fila (sin borrar previos). Evitamos duplicados con UNIQUE + skipDuplicates.
      try {
        await prisma.ofertaTarifaTramo.create({
          data: {
            ofertaTarifaId: oferta.id,
            consumoDesdeKWh: desde,
            consumoHastaKWh: hasta,
            comisionKwhAdmin: comTramo,   // €/kWh del COMPARADOR (columna S)
            comisionFijaAdmin: null,
            activo: true,
            notas,
          },
        });
        summary.tramosInsertados++;
      } catch (e: any) {
        // Si choca UNIQUE (mismo [desde,hasta] ya creado en import anterior), lo contamos como duplicado y seguimos
        if (String(e?.code) === "P2002" || /Unique constraint/i.test(String(e?.message))) {
          summary.tramosDuplicadosSaltados++;
        } else {
          throw e;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Importación completada",
      summary,
    });
  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json({ error: err?.message || "Error interno importando Excel" }, { status: 500 });
  }
}
