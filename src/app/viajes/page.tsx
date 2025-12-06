// src/app/viajes/page.tsx
import React, { Suspense } from "react";
import ViajesLanding from "./ViajesLanding";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando sección Viajes VIAJANDO CON MERY…
        </div>
      }
    >
      <ViajesLanding />
    </Suspense>
  );
}
