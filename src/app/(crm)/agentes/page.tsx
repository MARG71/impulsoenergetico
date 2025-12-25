"use client";

import { Suspense } from "react";
import AgentesGestionContenido from "./AgentesGestionContenido";

export default function AgentesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando agentes…
        </div>
      }
    >
      <AgentesGestionContenido />
    </Suspense>
  );
}
