// src/app/solar/_shared/SolarFooter.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBuildQuery } from "./useBuildQuery";

export default function SolarFooter() {
  const router = useRouter();
  const { buildQuery } = useBuildQuery();

  return (
    <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-slate-800 pt-4 text-[11px] md:text-xs text-slate-400">
      <span>© {new Date().getFullYear()} Impulso Energético · Solar IMPULSO</span>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => router.push(`/comparador${buildQuery({ tipo: "luz" })}`)}
          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Ver mi ahorro en luz
        </button>
        <button
          onClick={() => router.push(`/solar/tienda${buildQuery()}`)}
          className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900"
        >
          Ir a tienda solar
        </button>
      </div>
    </section>
  );
}

