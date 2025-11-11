import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* Helpers ----------------------------------------------------- */
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
/** Convierte "0-2000" / "0 – 2.000" / "0 a 2000" a [0,2000]. Si no hay “hasta”, devuelve [desde,null] */
function parseRangeToInts(s: any): [number, number | null] | null {
  if (!s && s !== 0) return null;
  const txt = String(s).replace(/\./g, "").replace(",", ".").toLowerCase().trim();
  const parts = txt.split(/-|–|a|hasta|>/).map(t => t.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const desde = parseInt(parts[0], 10);
  const hasta = parts.length > 1 ? parseInt(parts[1], 10) : null;
  if (!Number.isFinite(desde)) return null;
  if (hasta !== null && !Number.isFinite(hasta)) return [desde, null];
  return [desde, hasta];
}

/* Mapeo de cabeceras (tus nombres habituales) ----------------- */
const L = {
  compania: ["compañia", "compania"],
  nombreAnexo: ["nombre", "anexo", "anexo precio", "epigrafe", "epígrafe"],
  subtipo: ["tarifa", "subtipo"],

  /** NUEVO: ref y última actualización */
  ref: ["ref", "referencia", "referencia anexo"],
  ultimaAct: ["ultima actualización", "última actualización", "fecha actualización", "actualizacion"],


  // POTENCIA €/kW·año (P.P.1..P.P.6)
  pp1: ["p.p.1 (€/kw/año)", "pp1", "potencia p1"],
  pp2: ["p.p.2 (€/kw/año)", "pp2", "potencia p2"],
  pp3: ["p.p.3 (€/kw/año)", "pp3", "potencia p3"],
  pp4: ["p.p.4 (€/kw/año)", "pp4", "potencia p4"],
  pp5: ["p.p.5 (€/kw/año)", "pp5", "potencia p5"],
  pp6: ["p.p.6 (€/kw/año)", "pp6", "potencia p6"],

  // ENERGÍA €/kWh (P.C.1..P.C.6)
  pc1: ["p.c.1 (€/kwh)", "pc1", "precio p1", "p1"],
  pc2: ["p.c.2 (€/kwh)", "pc2", "precio p2", "p2"],
  pc3: ["p.c.3 (€/kwh)", "pc3", "precio p3", "p3"],
  pc4: ["p.c.4 (€/kwh)", "pc4", "precio p4", "p4"],
  pc5: ["p.c.5 (€/kwh)", "pc5", "precio p5", "p5"],
  pc6: ["p.c.6 (€/kwh)", "pc6", "precio p6", "p6"],

  // Rango de consumo y etiqueta textual de potencia
  consumoRango: ["consumo", "rango consumo"],
  potenciaEtiqueta: ["potencia"],

  // Comisión por tramo (COMISION COMPARADOR)
  comComparador: [
    "comision comparador",
    "comisión comparador",
    "comision €/kwh comparador",
    "comisión €/kwh comparador",
  ],
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Espera JSON:
 * {
 *   tipo: "LUZ"|"GAS"|"TELEFONIA",
 *   subtipo: "2.0TD" | "3.0TD" | "6.1TD",
 *   replace: boolean,          // si true y firstChunk => borra el subtipo antes de importar
 *   firstChunk: boolean,       // primer bloque
 *   rows: Array<object>        // filas normalizadas por el cliente
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tipoGlobal = (body?.tipo || "LUZ").toString().toUpperCase();
    const subtipoGlobal = (body?.subtipo || "2.0TD").toString().toUpperCase();
    const replace = !!body?.replace;
    const firstChunk = !!body?.firstChunk;
    const rawRows: any[] = Array.isArray(body?.rows) ? body.rows : [];

    if (!rawRows.length) {
      return NextResponse.json({ ok: true, summary: { rows: 0 } });
    }

    // Si es el primer chunk y hay replace => limpiar previamente ese subtipo
    if (firstChunk && replace) {
      await prisma.ofertaTarifa.deleteMany({
        where: { tipo: tipoGlobal as any, subtipo: subtipoGlobal },
      });
    }

    // Cada fila => upsert de la tarifa (anexo) + create del tramo
    let ofertasToque = 0;
    let tramosInsertados = 0;
    let tramosDuplicados = 0;
    let saltadosSinClave = 0;
    let saltadosSinConsumo = 0;

    for (const r0 of rawRows) {
      // el cliente ya normalizó keys con normKey; por si acaso:
      const r: Record<string, any> = {};
      for (const [k, v] of Object.entries(r0)) r[normKey(k)] = v;

      const tipo = tipoGlobal;
      const subtipo = subtipoGlobal || String(pick(r, L.subtipo, "2.0TD")).toUpperCase();
      const compania = String(pick(r, L.compania, "") ?? "").trim();
      const nombreAnexo = String(pick(r, L.nombreAnexo, "") ?? "").trim();

      const ref = String(pick(r, L.ref, "") ?? "").trim();
      const ultimaActRaw = pick(r, L.ultimaAct, null);
      let ultimaActualizacion: Date | null = null;
      if (ultimaActRaw) {
        const t = new Date(ultimaActRaw);
        if (!isNaN(t.getTime())) ultimaActualizacion = t;
      }


      if (!compania || !nombreAnexo) { saltadosSinClave++; continue; }

      // POTENCIA €/kW·año
      const pp1 = toNum(pick(r, L.pp1)); const pp2 = toNum(pick(r, L.pp2));
      const pp3 = toNum(pick(r, L.pp3)); const pp4 = toNum(pick(r, L.pp4));
      const pp5 = toNum(pick(r, L.pp5)); const pp6 = toNum(pick(r, L.pp6));

      // ENERGÍA €/kWh
      const pc1 = toNum(pick(r, L.pc1)); const pc2 = toNum(pick(r, L.pc2));
      const pc3 = toNum(pick(r, L.pc3)); const pc4 = toNum(pick(r, L.pc4));
      const pc5 = toNum(pick(r, L.pc5)); const pc6 = toNum(pick(r, L.pc6));

      // Rango de consumo
      const rango = parseRangeToInts(pick(r, L.consumoRango, null));
      if (!rango) { saltadosSinConsumo++; continue; }
      const [desde, hasta] = rango;

      // Comisión comparador €/kWh (por tramo)
      const comTramo = toNum(pick(r, L.comComparador));

      // Notas: etiqueta de potencia textual
      const potEtiqueta = pick(r, L.potenciaEtiqueta, null);
      const notas = potEtiqueta ? `POTENCIA: ${String(potEtiqueta).trim()}` : null;

      // Upsert tarifa (clave: tipo+subtipo+compañía+nombre+anexoPrecio)
      const existing = await prisma.ofertaTarifa.findFirst({
        where: { tipo: tipo as any, subtipo, compania, nombre: nombreAnexo, anexoPrecio: nombreAnexo },
        select: { id: true },
      });

      const baseData = {
        tipo: tipo as any,
        subtipo,
        compania,
        nombre: nombreAnexo,
        anexoPrecio: nombreAnexo,
        
        /** NUEVO */
        ref: ref || null,
        ultimaActualizacion,

        activa: true,
        destacada: false,

        // Energía
        precioKwhP1: pc1, precioKwhP2: pc2, precioKwhP3: pc3,
        precioKwhP4: pc4, precioKwhP5: pc5, precioKwhP6: pc6,

        // Potencia
        precioPotenciaP1: pp1, precioPotenciaP2: pp2, precioPotenciaP3: pp3,
        precioPotenciaP4: pp4, precioPotenciaP5: pp5, precioPotenciaP6: pp6,

        // Comisión base no usada (trabajamos por tramos)
        comisionKwhAdminBase: null,
      };

      let ofertaId: number;
      if (existing) {
        const up = await prisma.ofertaTarifa.update({
          where: { id: existing.id },
          data: baseData,
          select: { id: true },
        });
        ofertaId = up.id;
      } else {
        const cr = await prisma.ofertaTarifa.create({
          data: baseData,
          select: { id: true },
        });
        ofertaId = cr.id;
      }
      ofertasToque++;

      // Crear tramo evitando duplicado por UNIQUE (ofertaTarifaId + desde + hasta)
      try {
        await prisma.ofertaTarifaTramo.create({
          data: {
            ofertaTarifaId: ofertaId,
            consumoDesdeKWh: desde,
            consumoHastaKWh: hasta,
            comisionKwhAdmin: comTramo,
            comisionFijaAdmin: null,
            activo: true,
            notas,
          },
        });
        tramosInsertados++;
      } catch (e: any) {
        // P2002 => unique violation
        if (String(e?.code) === "P2002" || /Unique constraint/i.test(String(e?.message))) {
          tramosDuplicados++;
        } else {
          throw e;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      summary: {
        rows: rawRows.length,
        ofertasToque,
        tramosInsertados,
        tramosDuplicados,
        saltadosSinClave,
        saltadosSinConsumo,
      },
    });
  } catch (err: any) {
    console.error("import-chunk error:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
