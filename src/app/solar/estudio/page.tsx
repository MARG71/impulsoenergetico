// src/app/solar/estudio/page.tsx
import React, { Suspense } from "react";
import SolarEstudio from "./SolarEstudio";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando estudio solar…
        </div>
      }
    >
      <SolarEstudio />
    </Suspense>
  );
}
