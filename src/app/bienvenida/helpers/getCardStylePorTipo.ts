import { TipoOferta } from "../types";

// Ajusta la ruta si necesitas, según donde tengas TipoOferta

export function getCardStylePorTipo(tipo: TipoOferta | null) {
  const base = {
    gradient: "from-slate-700/40 via-slate-950 to-slate-950",
    glow: "shadow-[0_0_18px_rgba(148,163,184,0.45)]",
  };

  if (!tipo) return base;

  const map: Record<
    TipoOferta,
    { gradient: string; glow: string }
  > = {
    LUZ: {
      gradient: "from-emerald-500/30 via-emerald-900/30 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(16,185,129,0.85)]",
    },
    GAS: {
      gradient: "from-orange-500/30 via-orange-900/30 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(249,115,22,0.85)]",
    },
    TELEFONIA: {
      gradient: "from-sky-500/30 via-sky-900/30 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(56,189,248,0.85)]",
    },
    SEGUROS: {
      gradient: "from-slate-400/35 via-slate-900/40 to-slate-950",
      glow: "shadow-[0_0_24px_rgba(148,163,184,0.9)]",
    },
    GANGAS: {
      gradient: "from-pink-500/35 via-rose-900/40 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(244,114,182,0.9)]",
    },
    HIPOTECAS: {
      gradient: "from-emerald-500/30 via-emerald-900/40 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(16,185,129,0.9)]",
    },
    REPUESTOS: {
      gradient: "from-orange-400/35 via-amber-900/40 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(251,146,60,0.9)]",
    },
    PLADUR: {
      gradient: "from-zinc-400/35 via-zinc-900/40 to-slate-950",
      glow: "shadow-[0_0_24px_rgba(161,161,170,0.9)]",
    },
    FERRETERIA: {
      gradient: "from-lime-400/35 via-lime-900/40 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(132,204,22,0.9)]",
    },
    INMOBILIARIA: {
      gradient: "from-rose-500/35 via-rose-900/40 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(244,63,94,0.9)]",
    },
    VIAJES: {
      gradient: "from-indigo-500/35 via-indigo-900/40 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(129,140,248,0.9)]",
    },
    SOLAR: {
      gradient: "from-amber-400/35 via-amber-900/40 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(251,191,36,0.9)]",
    },
    AEROTERMIA: {
      gradient: "from-cyan-400/35 via-cyan-900/40 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(34,211,238,0.9)]",
    },
    BATERIA: {
      gradient: "from-purple-500/35 via-purple-900/40 to-slate-950",
      glow: "shadow-[0_0_26px_rgba(168,85,247,0.9)]",
    },
  };

  return map[tipo] ?? base;
}
