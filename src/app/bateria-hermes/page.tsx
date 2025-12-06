// src/app/bateria-hermes/page.tsx
import React, { Suspense } from "react";
import BateriaHermesLanding from "./BateriaHermesLanding";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando sección Batería IA HERMES…
        </div>
      }
    >
      <BateriaHermesLanding />
    </Suspense>
  );
}
