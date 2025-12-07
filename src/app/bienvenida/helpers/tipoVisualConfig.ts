import { TipoOferta } from "../types";

export type TipoVisualConfig = {
  label: string;
  bgPill: string;
  btn: string;
  border: string;
};

// Config visual por tipo (lo que antes era tipoConfig)
const mapaVisualPorTipo: Record<TipoOferta, TipoVisualConfig> = {
  LUZ: {
    label: "Luz",
    bgPill: "bg-emerald-100 text-emerald-800",
    btn: "bg-emerald-600 hover:bg-emerald-500",
    border: "border-emerald-200",
  },
  GAS: {
    label: "Gas",
    bgPill: "bg-orange-100 text-orange-800",
    btn: "bg-orange-500 hover:bg-orange-400",
    border: "border-orange-200",
  },
  TELEFONIA: {
    label: "Telefonía",
    bgPill: "bg-sky-100 text-sky-800",
    btn: "bg-sky-600 hover:bg-sky-500",
    border: "border-sky-200",
  },
  SOLAR: {
    label: "Solar",
    bgPill: "bg-amber-100 text-amber-800",
    btn: "bg-amber-500 hover:bg-amber-400",
    border: "border-amber-200",
  },
  AEROTERMIA: {
    label: "Aerotermia / Geotermia",
    bgPill: "bg-cyan-100 text-cyan-800",
    btn: "bg-cyan-500 hover:bg-cyan-400",
    border: "border-cyan-200",
  },
  BATERIA: {
    label: "Batería IA",
    bgPill: "bg-purple-100 text-purple-800",
    btn: "bg-purple-600 hover:bg-purple-500",
    border: "border-purple-200",
  },
  FERRETERIA: {
    label: "Ferretería",
    bgPill: "bg-lime-100 text-lime-800",
    btn: "bg-lime-600 hover:bg-lime-500",
    border: "border-lime-200",
  },
  INMOBILIARIA: {
    label: "Inmobiliaria",
    bgPill: "bg-rose-100 text-rose-800",
    btn: "bg-rose-500 hover:bg-rose-400",
    border: "border-rose-200",
  },
  VIAJES: {
    label: "Viajes",
    bgPill: "bg-indigo-100 text-indigo-800",
    btn: "bg-indigo-500 hover:bg-indigo-400",
    border: "border-indigo-200",
  },
  REPUESTOS: {
    label: "Repuestos",
    bgPill: "bg-orange-100 text-orange-800",
    btn: "bg-orange-500 hover:bg-orange-400",
    border: "border-orange-200",
  },
  SEGUROS: {
    label: "Seguros",
    bgPill: "bg-slate-200 text-slate-800",
    btn: "bg-slate-500 hover:bg-slate-400",
    border: "border-slate-300",
  },
  GANGAS: {
    label: "La Tienda de las Gangas",
    bgPill: "bg-pink-100 text-pink-800",
    btn: "bg-pink-500 hover:bg-pink-400",
    border: "border-pink-200",
  },
  HIPOTECAS: {
    label: "Hipotecas y financiación",
    bgPill: "bg-emerald-100 text-emerald-800",
    btn: "bg-emerald-600 hover:bg-emerald-500",
    border: "border-emerald-200",
  },
  PLADUR: {
    label: "Pladur DICOPLAC",
    bgPill: "bg-zinc-100 text-zinc-800",
    btn: "bg-zinc-500 hover:bg-zinc-400",
    border: "border-zinc-200",
  },
};

// Helper: devuelve la config visual (o undefined si no hay tipo)
export function getVisualConfigPorTipo(
  tipo: TipoOferta | null | undefined
): TipoVisualConfig | undefined {
  if (!tipo) return undefined;
  return mapaVisualPorTipo[tipo];
}
