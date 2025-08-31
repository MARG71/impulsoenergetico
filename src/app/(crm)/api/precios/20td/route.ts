// src/app/api/precios/20td/route.ts
import { NextResponse } from "next/server";
import { leerTarifas20TD, Tarifa20TD } from "@/lib/tarifas20td";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILE_PATH = `${process.cwd()}/public/data/precios_20td.xlsx`;

/**
 * GET /api/precios/20td?potenciaKw=4.6&consumoMWh=3.5&compania=...&limit=30
 *
 * - Filtra por rangos (si los hay)
 * - Devuelve filas normalizadas y, si se pasan potencia/consumo, añade una estimación de coste:
 *   - potenciaCosteAnual = potenciaKw * (pp1 + pp2)  (2.0TD suele facturar ambos términos)
 *   - energiaCosteAnual  = consumoMWh * 1000 * energiaMedia (si no hay reparto P1..P3)
 *   - totalEstimado      = potenciaCosteAnual + energiaCosteAnual
 *   - metodoCalculo      = "mediaSimple" (a falta de consumo por periodos)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const potenciaKw = url.searchParams.get("potenciaKw");
    const consumoMWh = url.searchParams.get("consumoMWh");
    const compania = url.searchParams.get("compania")?.trim();
    const limit = Number(url.searchParams.get("limit") ?? 30);

    const pKw = potenciaKw ? Number(potenciaKw) : null;
    const cMWh = consumoMWh ? Number(consumoMWh) : null;

    const all = leerTarifas20TD(FILE_PATH);

    let list = all;

    if (compania) {
      list = list.filter((t) => t.compania?.toLowerCase().includes(compania.toLowerCase()));
    }

    // filtrar por rango de potencia si nos dan potencia
    if (pKw != null && Number.isFinite(pKw)) {
      list = list.filter((t) => {
        if (!t.potenciaRange) return true; // si no hay rango, no excluyo
        return pKw >= t.potenciaRange.min && pKw <= t.potenciaRange.max;
      });
    }

    // filtrar por rango de consumo si nos dan consumo
    if (cMWh != null && Number.isFinite(cMWh)) {
      list = list.filter((t) => {
        if (!t.consumoRange) return true;
        // en tu Excel el rango parece estar en MWh
        return cMWh >= t.consumoRange.min && cMWh <= t.consumoRange.max;
      });
    }

    // calcular estimación básica si hay potencia y consumo
    const withCalc = list.slice(0, limit).map((t) => {
      if (pKw == null || cMWh == null) return t;

      const pp1 = t.pp1 ?? 0;
      const pp2 = t.pp2 ?? 0;
      const energiaMedia = t.energiaMedia ?? 0;

      const potenciaCosteAnual = pKw * (pp1 + pp2);
      const energiaCosteAnual = cMWh * 1000 * energiaMedia; // MWh -> kWh

      const totalEstimado = potenciaCosteAnual + energiaCosteAnual;

      return {
        ...t,
        estimacion: {
          metodoCalculo: "mediaSimple", // si luego tenemos P1/P2/P3 reales, lo cambiamos
          potenciaKw: pKw,
          consumoMWh: cMWh,
          potenciaCosteAnual,
          energiaCosteAnual,
          totalEstimado,
        },
      };
    });

    return NextResponse.json({
      ok: true,
      count: withCalc.length,
      items: withCalc,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Error leyendo Excel" }, { status: 500 });
  }
}
