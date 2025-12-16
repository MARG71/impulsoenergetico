"use client";

import { Suspense } from "react";
import AgenteLugaresContenido from "./AgenteLugaresContenido";

export default function AgenteLugaresPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">Cargando lugares…</div>}>
      <AgenteLugaresContenido />
    </Suspense>
  );
}
