"use client";

import { Suspense } from "react";
import AgenteContenido from "./AgenteContenido";

export default function AgentePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando tu área de agente…
        </div>
      }
    >
      <AgenteContenido />
    </Suspense>
  );
}
