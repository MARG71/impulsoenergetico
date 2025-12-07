// src/app/bienvenida/helpers/getCardStylePorTipo.ts
import { TipoOferta } from "../types";

type CardStyle = {
  gradient: string;
  glow: string;
};

/**
 * Devuelve gradiente + glow por tipo de oferta,
 * para usar en las tarjetas.
 */
export function getCardStylePorTipo(tipo: TipoOferta | null | undefined): CardStyle {
  switch (tipo) {
    case "LUZ":
      return {
        gradient: "from-emerald-500/30 via-emerald-900/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(16,185,129,0.75)]",
      };
    case "GAS":
      return {
        gradient: "from-orange-500/30 via-orange-900/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(249,115,22,0.75)]",
      };
    case "TELEFONIA":
      return {
        gradient: "from-sky-500/30 via-sky-900/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(56,189,248,0.75)]",
      };
    case "SOLAR":
      return {
        gradient: "from-amber-400/35 via-amber-700/25 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(245,158,11,0.75)]",
      };
    case "AEROTERMIA":
      return {
        gradient: "from-cyan-400/30 via-cyan-900/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(34,211,238,0.75)]",
      };
    case "BATERIA":
      return {
        gradient: "from-purple-500/35 via-purple-900/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(168,85,247,0.75)]",
      };
    case "FERRETERIA":
      return {
        gradient: "from-lime-400/35 via-lime-800/25 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(190,242,100,0.75)]",
      };
    case "INMOBILIARIA":
      return {
        gradient: "from-rose-500/35 via-rose-900/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(244,63,94,0.75)]",
      };
    case "VIAJES":
      return {
        gradient: "from-indigo-500/35 via-indigo-900/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(99,102,241,0.75)]",
      };
    case "REPUESTOS":
      return {
        gradient: "from-orange-400/35 via-orange-900/25 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(249,115,22,0.75)]",
      };
    case "SEGUROS":
      return {
        gradient: "from-slate-400/35 via-slate-800/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(148,163,184,0.75)]",
      };
    case "GANGAS":
      return {
        gradient: "from-pink-500/35 via-pink-900/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(236,72,153,0.75)]",
      };
    case "HIPOTECAS":
      return {
        gradient: "from-emerald-500/35 via-emerald-900/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(16,185,129,0.75)]",
      };
    case "PLADUR":
      return {
        gradient: "from-zinc-400/35 via-zinc-800/30 to-slate-950",
        glow: "shadow-[0_0_22px_rgba(148,163,184,0.75)]",
      };
    default:
      return {
        gradient: "from-slate-700/40 via-slate-950 to-slate-950",
        glow: "shadow-[0_0_18px_rgba(148,163,184,0.45)]",
      };
  }
}
