// src/app/(crm)/api/ofertas-tarifa/import/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // ⏱️ ampliar ventana de ejecución en Vercel

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
function parseRangeToInts(s: any): [number, number | null] | null {
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

    // ---- Agrupar por anexo y acumular tramos (para insertar por lotes) ----
    type Base = {
      tipo: any; subtipo: string; compania: string; nombre: string; anexoPrecio: string;
      descripcion: null; descripcionCorta: null; activa: true; destacada: false;
      precioKwhP1: number | null; precioKwhP2: number | null; precioKwhP3: number | null;
      precioKwhP4: number | null; precioKwhP5: number | null; precioKwhP6: number | null;
      comisionKwhAdminBase: null;
    };
    type TramoIn = {
      consumoDesdeKWh: number;
      consumoHastaKWh: number | null;
      comisionKwhAdmin: number | null;
      comisionFijaAdmin: number | null;
      activo: boolean;
      notas: string | null;
    };

    const buckets = new Map<string, { base: Base; tramos: TramoIn[] }>();

    let saltadosSinClave = 0;
    let saltadosSinConsumo = 0;

    for (const r of rows) {
      const tipo = (tipoGlobal || "LUZ").toUpperCase() as any;
      const subtipo = (subtipoGlobal || String(pick(r, LABELS.subtipo, "2.0TD"))).toUpperCase();
      const compania = String(pick(r, LABELS.compania, "") ?? "").trim();
      const anexoNombre = String(pick(r, LABELS.anexoNombre, "") ?? "").trim();
      if (!compania || !anexoNombre) { saltadosSinClave++; continue; }

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
      if (!rango) { saltadosSinConsumo++; continue; }
      const [desde, hasta] = rango;

      // Comisión por tramo = COMISION COMPARADOR
      const comTramo = toNum(pick(r, LABELS.comisionComparador));

      // Etiqueta de potencia (columna F) → guardamos literal en 'notas'
      const potenciaEtiqueta = pick(r, LABELS.potenciaEtiqueta, null);
      const notas = potenciaEtiqueta ? `POTENCIA: ${String(potenciaEtiqueta).trim()}` : null;

      const key = `${tipo}|${subtipo}|${compania}|${anexoNombre}`;

      if (!buckets.has(key)) {
        buckets.set(key, {
          base: {
            tipo, subtipo, compania,
            nombre: anexoNombre,
            anexoPrecio: anexoNombre,       // clave por anexo
            descripcion: null,
            descripcionCorta: null,
            activa: true,
            destacada: false,
            precioKwhP1: p1, precioKwhP2: p2, precioKwhP3: p3,
            precioKwhP4: p4, precioKwhP5: p5, precioKwhP6: p6,
            comisionKwhAdminBase: null,
          },
          tramos: [],
        });
      }

      buckets.get(key)!.tramos.push({
        consumoDesdeKWh: desde,
        consumoHastaKWh: hasta,
        comisionKwhAdmin: comTramo,   // €/kWh del COMPARADOR (columna S)
        comisionFijaAdmin: null,
        activo: true,
        notas,
      });
    }

    // ---- Guardar por compañía (ordenado) y anexo ----
    const CHUNK = 500;
    let totalOfertas = 0;
    let totalTramos = 0;
    let duplicadosSaltados = 0;

    const ordered = Array.from(buckets.values()).sort((a, b) =>
      a.base.compania.localeCompare(b.base.compania, "es", { sensitivity: "base" })
    );

    for (const { base, tramos } of ordered) {
      // upsert de la OfertaTarifa por la clave completa
      const existing = await prisma.ofertaTarifa.findFirst({
        where: {
          tipo: base.tipo, subtipo: base.subtipo, compania: base.compania,
          nombre: base.nombre, anexoPrecio: base.anexoPrecio
        }
      });

      const oferta = existing
        ? await prisma.ofertaTarifa.update({
            where: { id: existing.id },
            data: {
              activa: true,
              // refrescamos precios de energía por si cambian
              precioKwhP1: base.precioKwhP1,
              precioKwhP2: base.precioKwhP2,
              precioKwhP3: base.precioKwhP3,
              precioKwhP4: base.precioKwhP4,
              precioKwhP5: base.precioKwhP5,
              precioKwhP6: base.precioKwhP6,
              comisionKwhAdminBase: null,
            }
          })
        : await prisma.ofertaTarifa.create({ data: base as any });

      totalOfertas++;

      // Inserta tramos en lotes
      for (let i = 0; i < tramos.length; i += CHUNK) {
        const slice = tramos.slice(i, i + CHUNK).map(t => ({ ...t, ofertaTarifaId: oferta.id }));
        if (!slice.length) continue;

        try {
          await prisma.ofertaTarifaTramo.createMany({
            data: slice,
            skipDuplicates: true, // respeta UNIQUE (ofertaTarifaId, desde, hasta)
          });
          totalTramos += slice.length;
        } catch {
          // Fallback fino a fino si hubiese algún choque raro
          for (const t of slice) {
            try {
              await prisma.ofertaTarifaTramo.create({ data: t });
              totalTramos++;
            } catch {
              duplicadosSaltados++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Importación completada",
      summary: {
        rowsRead: rows.length,
        ofertasCreadasOActualizadas: totalOfertas,
        tramosInsertadosTeoricos: totalTramos,
        tramosDuplicadosSaltados: duplicadosSaltados,
        saltadosSinClave,
        saltadosSinConsumo,
      },
    });
  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json({ error: err?.message || "Error interno importando Excel" }, { status: 500 });
  }
}
