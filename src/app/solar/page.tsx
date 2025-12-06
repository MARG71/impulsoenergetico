// src/app/solar/page.tsx
import React, { Suspense } from "react";
import SolarLanding from "./SolarLanding";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando sección Solar IMPULSO…
        </div>
      }
    >
      <SolarLanding />
    </Suspense>
  );
}
