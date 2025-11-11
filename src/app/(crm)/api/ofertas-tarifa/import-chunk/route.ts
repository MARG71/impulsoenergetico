import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// ===== helpers (mismos que tenías) =====
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
function parseRangeToInts(s: any): [number, number | null] | null {
  if (!s && s !== 0) return null;
  const txt = String(s).replace(/\./g, "").replace(",", ".").toLowerCase().trim();
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
    const body = await req.json();
    const tipo: "LUZ"|"GAS"|"TELEFONIA" = (body.tipo || "LUZ").toUpperCase();
    const subtipo: string | null = body.subtipo || null; // "2.0TD" | ...
    const rows: any[] = Array.isArray(body.rows) ? body.rows : [];
    const firstChunk: boolean = !!body.firstChunk;
    const replace: boolean = !!body.replace;

    if (!rows.length) return NextResponse.json({ ok: true, empty: true });

    // limpiar al principio si se pidió replace
    if (firstChunk && replace && subtipo) {
      await prisma.ofertaTarifa.deleteMany({
        where: { tipo: tipo as any, subtipo }
      });
    }

    const LABELS = {
      compania: ["compañia", "compania"],
      subtipo: ["tarifa", "subtipo"],
      anexoNombre: ["nombre", "nombre anexo", "anexo", "anexo precio", "epigrafe", "epígrafe"],
      p1: ["p.c.1 (€/kwh)", "pc1", "precio p1", "p1"],
      p2: ["p.c.2 (€/kwh)", "pc2", "precio p2", "p2"],
      p3: ["p.c.3 (€/kwh)", "pc3", "precio p3", "p3"],
      p4: ["p.c.4 (€/kwh)", "pc4", "precio p4", "p4"],
      p5: ["p.c.5 (€/kwh)", "pc5", "precio p5", "p5"],
      p6: ["p.c.6 (€/kwh)", "pc6", "precio p6", "p6"],
      potenciaEtiqueta: ["potencia"],
      consumoRango: ["consumo", "consumo rango", "rango consumo"],
      comisionComparador: ["comision comparador", "comisión comparador", "comision €/kwh comparador", "comisión €/kwh comparador"],
    };

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

    for (const r0 of rows) {
      // vienen ya "normalizados" desde el cliente, pero por seguridad normalizamos claves
      const r: Record<string, any> = {};
      for (const [k, v] of Object.entries(r0)) r[normKey(k)] = v;

      const _sub = (subtipo || String(pick(r, LABELS.subtipo, "2.0TD"))).toUpperCase();
      const compania = String(pick(r, LABELS.compania, "") ?? "").trim();
      const anexoNombre = String(pick(r, LABELS.anexoNombre, "") ?? "").trim();
      if (!compania || !anexoNombre) { saltadosSinClave++; continue; }

      const p1 = toNum(pick(r, LABELS.p1));
      const p2 = toNum(pick(r, LABELS.p2));
      const p3 = toNum(pick(r, LABELS.p3));
      const p4 = toNum(pick(r, LABELS.p4));
      const p5 = toNum(pick(r, LABELS.p5));
      const p6 = toNum(pick(r, LABELS.p6));

      const consumoTxt = pick(r, LABELS.consumoRango, null);
      const rango = parseRangeToInts(consumoTxt);
      if (!rango) { saltadosSinConsumo++; continue; }
      const [desde, hasta] = rango;

      const comTramo = toNum(pick(r, LABELS.comisionComparador));
      const potenciaEtiqueta = pick(r, LABELS.potenciaEtiqueta, null);
      const notas = potenciaEtiqueta ? `POTENCIA: ${String(potenciaEtiqueta).trim()}` : null;

      const key = `${tipo}|${_sub}|${compania}|${anexoNombre}`;

      if (!buckets.has(key)) {
        buckets.set(key, {
          base: {
            tipo, subtipo: _sub, compania,
            nombre: anexoNombre,
            anexoPrecio: anexoNombre,
            descripcion: null, descripcionCorta: null,
            activa: true, destacada: false,
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
        comisionKwhAdmin: comTramo,
        comisionFijaAdmin: null,
        activo: true,
        notas,
      });
    }

    // guardar por compañía
    const ordered = Array.from(buckets.values()).sort((a, b) =>
      a.base.compania.localeCompare(b.base.compania, "es", { sensitivity: "base" })
    );

    const CHUNK = 500;
    let ofertas = 0, tramosOk = 0, tramosDup = 0;

    for (const { base, tramos } of ordered) {
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

      ofertas++;

      for (let i = 0; i < tramos.length; i += CHUNK) {
        const slice = tramos.slice(i, i + CHUNK).map(t => ({ ...t, ofertaTarifaId: oferta.id }));
        if (!slice.length) continue;

        try {
          await prisma.ofertaTarifaTramo.createMany({ data: slice, skipDuplicates: true });
          tramosOk += slice.length;
        } catch {
          for (const t of slice) {
            try {
              await prisma.ofertaTarifaTramo.create({ data: t });
              tramosOk++;
            } catch {
              tramosDup++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      ofertas,
      tramosOk,
      tramosDup,
      saltadosSinClave,
      saltadosSinConsumo,
    });
  } catch (err: any) {
    console.error("import-chunk error:", err);
    return NextResponse.json({ error: err?.message || "Error importando chunk" }, { status: 500 });
  }
}
