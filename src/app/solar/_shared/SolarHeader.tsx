// src/app/solar/_shared/SolarHeader.tsx
"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useBuildQuery } from "./useBuildQuery";

export default function SolarHeader() {
  const router = useRouter();
  const { buildQuery } = useBuildQuery();

  return (
    <header className="flex items-center justify-between gap-4 mb-8 md:mb-10">
      <div className="flex items-center gap-4">
        <div className="relative h-10 w-44 sm:h-12 sm:w-56">
          <Image
            src="/logo-impulso.png"
            alt="Impulso Energético"
            fill
            className="object-contain drop-shadow-[0_0_24px_rgba(16,185,129,0.8)]"
            priority
          />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] md:text-xs tracking-[0.30em] uppercase text-emerald-300 font-semibold">
            IMPULSO ENERGÉTICO · SOLAR IMPULSO
          </span>
          <span className="text-xs text-slate-300">
            Autoconsumo, ahorro y autonomía energética
          </span>
        </div>
      </div>

      <button
        onClick={() => router.push(`/bienvenida${buildQuery()}`)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-xs md:text-sm text-slate-100 hover:bg-slate-800"
      >
        ← Volver a la pantalla principal
      </button>
    </header>
  );
}
