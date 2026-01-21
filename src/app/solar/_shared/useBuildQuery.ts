// src/app/solar/_shared/useBuildQuery.ts
"use client";

import { useSearchParams } from "next/navigation";

type ExtraParams = Record<string, string>;

export function useBuildQuery() {
  const searchParams = useSearchParams();

  const nombre = searchParams.get("nombre") || "";
  const agenteId = searchParams.get("agenteId") || "";
  const lugarId = searchParams.get("lugarId") || "";

  const buildQuery = (extra?: ExtraParams) => {
    const p = new URLSearchParams();

    if (nombre) p.set("nombre", nombre);
    if (agenteId) p.set("agenteId", agenteId);
    if (lugarId) p.set("lugarId", lugarId);

    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        if (v != null && v !== "") p.set(k, v);
      });
    }

    const qs = p.toString();
    return qs ? `?${qs}` : "";
  };

  return { nombre: nombre || null, agenteId, lugarId, buildQuery };
}
