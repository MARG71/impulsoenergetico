// src/lib/tarifas20td.ts
import fs from "fs";
import * as XLSX from "xlsx";

export type Tarifa20TD = {
  rowIndex: number;
  ref?: string;
  tarifa?: string;
  nombre?: string;
  tipo?: string;
  compania?: string;
  potenciaRange?: { min: number; max: number };
  consumoRange?: { min: number; max: number; unidad: "MWh" | "kWh" | "desconocido" };
  pp1?: number | null; // €/kW/año
  pp2?: number | null; // €/kW/año
  pc1?: number | null; // €/kWh
  pc2?: number | null; // €/kWh
  pc3?: number | null; // €/kWh
  comisionEUR?: number; // € por contrato (pool)
  validez?: string;
  ultimaActualizacion?: string;
  comparador?: string;
  energiaMedia?: number | null; // media simple de PC1..PC3 no nulos
};

function cleanStr(v: any): string {
  return String(v ?? "")
    .replace(/\u00A0/g, " ") // NBSP
    .trim();
}

function parseNumberEU(raw: any): number | null {
  const s = cleanStr(raw)
    .replace(/€/g, "")
    .replace(/kW|kWh|MWh|\/año|\/mes/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return null;

  // Quitar separadores de miles estilo europeo: 1.234,56 -> 1234,56
  // (si hay puntos y comas, quitamos puntos como miles)
  const normalized = s
    .replace(/\./g, "")       // quitar puntos
    .replace(/,/g, ".");      // coma -> punto

  const m = normalized.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

function parseRange(str: any): { min: number; max: number } | undefined {
  const s = cleanStr(str);
  const nums = (s.match(/-?\d+(?:[.,]\d+)?/g) ?? []).map((x) =>
    parseFloat(x.replace(/\./g, "").replace(",", "."))
  );
  if (nums.length >= 2) {
    const a = Number(nums[0]);
    const b = Number(nums[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }
  return undefined;
}

function mediaPrecios(...vals: Array<number | null | undefined>): number | null {
  const nums = vals.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((acc, x) => acc + x, 0) / nums.length;
}

export function leerTarifas20TD(filePath: string): Tarifa20TD[] {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets["Hoja1"];
  if (!ws) return [];

  const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

  const out: Tarifa20TD[] = rows.map((r, idx): Tarifa20TD => {
    const ref = cleanStr(r["Ref."]);
    const tarifa = cleanStr(r["Tarifa"]);
    const nombre = cleanStr(r["Nombre"]);
    const tipo = cleanStr(r["Tipo"]);
    const compania = cleanStr(r["Compañía"]);
    const potencia = cleanStr(r["Potencia"]);
    const consumo = cleanStr(r["Consumo"]);

    const pp1 = parseNumberEU(r["P.P.1 (€/kW/año)"]);
    const pp2 = parseNumberEU(r["P.P.2 (€/kW/año)"]);
    const pc1 = parseNumberEU(r["P.C.1 (€/kWh)"]);
    const pc2 = parseNumberEU(r["P.C.2 (€/kWh)"]);
    const pc3 = parseNumberEU(r["P.C.3 (€/kWh)"]);

    const comisionEUR = parseNumberEU(r["Comisión"]) ?? 0;

    const potenciaRange = parseRange(potencia);
    const consumoRange = parseRange(consumo);

    // Inferimos unidad del campo Consumo por el contexto (tu Excel usa MWh/año)
    const consumoUnidad: "MWh" | "kWh" | "desconocido" = "MWh";

    const energiaMedia = mediaPrecios(pc1, pc2, pc3);

    return {
      rowIndex: idx + 2, // Excel header en fila 1 -> datos desde 2
      ref,
      tarifa,
      nombre,
      tipo,
      compania,
      potenciaRange,
      consumoRange: consumoRange ? { ...consumoRange, unidad: consumoUnidad } : undefined,
      pp1,
      pp2,
      pc1,
      pc2,
      pc3,
      comisionEUR,
      validez: cleanStr(r["Validez"]),
      ultimaActualizacion: cleanStr(r["Última actualización"]),
      comparador: cleanStr(r["Comparador"]),
      energiaMedia,
    };
  });

  // Opcional: filtra filas vacías o con “Comparador=NO”
  return out.filter((t) => (t.comparador?.toUpperCase() !== "NO"));
}
