// src/app/(crm)/api/ofertas-tarifa/import/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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

    // Mapear cabeceras
    const LABELS = {
      tarifa: ["tarifa", "subtipo"],
      nombre: ["nombre", "nombre tarifa", "tarifa"],
      compania: ["compañia", "compania"],
      anexo: ["anexo", "anexo precio", "epigrafe", "epígrafe", "epigrafe precios", "anexo de precios"],

      // ENERGÍA (€/kWh)
      p1: ["p.c.1 (€/kwh)", "pc1", "precio p1", "p1"],
      p2: ["p.c.2 (€/kwh)", "pc2", "precio p2", "p2"],
      p3: ["p.c.3 (€/kwh)", "pc3", "precio p3", "p3"],
      p4: ["p.c.4 (€/kwh)", "pc4", "precio p4", "p4"],
      p5: ["p.c.5 (€/kwh)", "pc5", "precio p5", "p5"],
      p6: ["p.c.6 (€/kwh)", "pc6", "precio p6", "p6"],

      // POTENCIA (€/kW·año) — intenta cubrir distintas nomenclaturas
      pot1: ["pot.1", "potencia p1", "potencia (p1)", "término potencia p1", "p1 potencia", "potencia 1", "pt1", "p.c.1 (€/kw/año)", "p.c.1 (€/kw/ano)"],
      pot2: ["pot.2", "potencia p2", "potencia (p2)", "término potencia p2", "p2 potencia", "potencia 2", "pt2", "p.c.2 (€/kw/año)", "p.c.2 (€/kw/ano)"],
      pot3: ["pot.3", "potencia p3", "pt3"],
      pot4: ["pot.4", "potencia p4", "pt4"],
      pot5: ["pot.5", "potencia p5", "pt5"],
      pot6: ["pot.6", "potencia p6", "pt6"],

      // COMISIONES
      // ✅ Base por kWh: queremos "COMISION COMPARADOR"
      comBase: ["comision comparador", "comisión comparador", "comision €/kwh comparador", "comisión €/kwh comparador"],
      // (opcional) MIA la guardamos en payload por auditoría
      comMia:  ["comision mia", "comisión mia"],

      // consumo (tu Excel parece mensual)
      consumo: ["consumo", "consumo mensual", "consumo_desde_mensual"],
      // por si hay comisión por tramo:
      comTramoKwh: ["co cons.", "comision_kwh_admin_tramo", "comision_kwh_admin", "comisión_kwh_admin_tramo"],
      comTramoFija: ["comision fija admin", "comision_admin_fija", "comisión comparador fija", "comision comparador fija"],
    };

    // Agrupar por tarifa-base (SEPARANDO POR ANEXO)
    const group: Record<Key, { base: any; tramos: any[]; _stats: { rows: number } }> = {};
    const summary = {
      rowsRead: rows.length,
      offersGrouped: 0,
      tramosBuilt: 0,
      skipped: { noCompaniaNombre: 0, noSubtipo: 0 },
    };

    for (const r of rows) {
      const tipo = (tipoGlobal || "LUZ").toUpperCase();
      const subtipo = (subtipoGlobal || String(pick(r, LABELS.tarifa, "2.0TD"))).toUpperCase();

      const compania = String(pick(r, LABELS.compania, "") ?? "").trim();
      const nombre = String(pick(r, LABELS.nombre, "") ?? "").trim();
      if (!compania || !nombre) { summary.skipped.noCompaniaNombre++; continue; }

      const anexoRaw = pick(r, LABELS.anexo, null);
      const anexoPrecio = (anexoRaw === null || anexoRaw === undefined || anexoRaw === "")
        ? null
        : String(anexoRaw).trim();

      // ENERGÍA
      const p1 = toNum(pick(r, LABELS.p1));
      const p2 = toNum(pick(r, LABELS.p2));
      const p3 = toNum(pick(r, LABELS.p3));
      const p4 = toNum(pick(r, LABELS.p4));
      const p5 = toNum(pick(r, LABELS.p5));
      const p6 = toNum(pick(r, LABELS.p6));

      // POTENCIA
      const pot1 = toNum(pick(r, LABELS.pot1));
      const pot2 = toNum(pick(r, LABELS.pot2));
      const pot3 = toNum(pick(r, LABELS.pot3));
      const pot4 = toNum(pick(r, LABELS.pot4));
      const pot5 = toNum(pick(r, LABELS.pot5));
      const pot6 = toNum(pick(r, LABELS.pot6));

      // COMISIÓN BASE = COMISION COMPARADOR
      const comisionKwhAdminBase = toNum(pick(r, LABELS.comBase));
      const comisionMia = toNum(pick(r, LABELS.comMia)); // opcional para payload

      const k: Key = JSON.stringify([tipo, subtipo, compania, nombre, anexoPrecio ?? null]);

      if (!group[k]) {
        group[k] = {
          base: {
            tipo, subtipo, compania, nombre,
            anexoPrecio: anexoPrecio,
            descripcion: null, descripcionCorta: null,
            activa: true, destacada: false,
            // ENERGÍA
            precioKwhP1: p1, precioKwhP2: p2, precioKwhP3: p3,
            precioKwhP4: p4, precioKwhP5: p5, precioKwhP6: p6,
            // POTENCIA
            precioPotenciaP1: pot1, precioPotenciaP2: pot2, precioPotenciaP3: pot3,
            precioPotenciaP4: pot4, precioPotenciaP5: pot5, precioPotenciaP6: pot6,
            // COMISIÓN BASE (comparador)
            comisionKwhAdminBase,
            // Guarda MIA en payload para auditoría si venía
            payload: comisionMia != null ? { comisionMia } : null,
          },
          tramos: [],
          _stats: { rows: 0 },
        };
        summary.offersGrouped++;
      }
      group[k]._stats.rows++;

      // tramo: consumo mensual → anual
      const consumoMes   = toNum(pick(r, LABELS.consumo));
      const comTramoKwh  = toNum(pick(r, LABELS.comTramoKwh));
      const comTramoFija = toNum(pick(r, LABELS.comTramoFija));

      if (consumoMes !== null || comTramoKwh !== null || comTramoFija !== null) {
        const desdeAnual = consumoMes !== null ? Math.round(consumoMes * 12) : 0;
        group[k].tramos.push({
          consumoDesdeKWh: desdeAnual,
          consumoHastaKWh: null, // se rellena al ordenar
          comisionKwhAdmin: comTramoKwh,   // €/kWh (si existe por tramo)
          comisionFijaAdmin: comTramoFija, // € (si existe por tramo)
          activo: true,
          notas: null,
        });
      }
    }

    // Dedupe por consumoDesde dentro de CADA (compañía/nombre/anexo)
    for (const g of Object.values(group)) {
      const byDesde = new Map<number, any>();
      for (const t of g.tramos) {
        const d = t.consumoDesdeKWh ?? 0;
        if (!byDesde.has(d)) byDesde.set(d, { ...t });
        else {
          const prev = byDesde.get(d);
          byDesde.set(d, {
            ...prev,
            comisionKwhAdmin: t.comisionKwhAdmin ?? prev.comisionKwhAdmin,
            comisionFijaAdmin: t.comisionFijaAdmin ?? prev.comisionFijaAdmin,
          });
        }
      }
      g.tramos = [...byDesde.values()];
    }

    // Ordenar y cerrar rangos [desde, hasta)
    for (const g of Object.values(group)) {
      g.tramos.sort((a, b) => (a.consumoDesdeKWh ?? 0) - (b.consumoDesdeKWh ?? 0));
      for (let i = 0; i < g.tramos.length; i++) {
        g.tramos[i].consumoHastaKWh =
          i < g.tramos.length - 1 ? g.tramos[i + 1].consumoDesdeKWh : null;
      }
    }

    // Dedupe (desde,hasta)
    for (const g of Object.values(group)) {
      const seen = new Set<string>();
      g.tramos = g.tramos.filter((t) => {
        const kk = `${t.consumoDesdeKWh}-${t.consumoHastaKWh ?? "inf"}`;
        if (seen.has(kk)) return false;
        seen.add(kk);
        return true;
      });
      summary.tramosBuilt += g.tramos.length;
    }

    // === Guardar en BD (sin transacciones largas) ===
    const resultados: any[] = [];
    let totalTramos = 0;

    for (const g of Object.values(group)) {
      // buscar existente por clave (incluye anexoPrecio)
      const existing = await prisma.ofertaTarifa.findFirst({
        where: {
          tipo: g.base.tipo as any,
          subtipo: g.base.subtipo,
          compania: g.base.compania,
          nombre: g.base.nombre,
          anexoPrecio: g.base.anexoPrecio ?? null,
        },
      });

      let row;
      if (existing) {
        row = await prisma.ofertaTarifa.update({
          where: { id: existing.id },
          data: {
            descripcion: g.base.descripcion,
            activa: true,
            // ENERGÍA
            precioKwhP1: g.base.precioKwhP1,
            precioKwhP2: g.base.precioKwhP2,
            precioKwhP3: g.base.precioKwhP3,
            precioKwhP4: g.base.precioKwhP4,
            precioKwhP5: g.base.precioKwhP5,
            precioKwhP6: g.base.precioKwhP6,
            // POTENCIA
            precioPotenciaP1: g.base.precioPotenciaP1,
            precioPotenciaP2: g.base.precioPotenciaP2,
            precioPotenciaP3: g.base.precioPotenciaP3,
            precioPotenciaP4: g.base.precioPotenciaP4,
            precioPotenciaP5: g.base.precioPotenciaP5,
            precioPotenciaP6: g.base.precioPotenciaP6,
            // COMISIÓN BASE (comparador)
            comisionKwhAdminBase: g.base.comisionKwhAdminBase,
            payload: g.base.payload,
          },
        });
      } else {
        row = await prisma.ofertaTarifa.create({ data: { ...g.base } });
      }

      // borrar tramos previos y crear nuevos
      await prisma.ofertaTarifaTramo.deleteMany({ where: { ofertaTarifaId: row.id } });
      if (g.tramos.length) {
        await prisma.ofertaTarifaTramo.createMany({
          data: g.tramos.map((t) => ({ ...t, ofertaTarifaId: row.id })),
          skipDuplicates: true,
        });
        totalTramos += g.tramos.length;
      }

      resultados.push(row);
    }

    return NextResponse.json({
      ok: true,
      ofertas: resultados.length,
      tramos: totalTramos,
      summary,
    });
  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json({ error: err?.message || "Error interno importando Excel" }, { status: 500 });
  }
}
