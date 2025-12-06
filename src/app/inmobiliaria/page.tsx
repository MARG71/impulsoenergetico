// src/app/inmobiliaria/page.tsx
import React, { Suspense } from "react";
import InmobiliariaLanding from "./InmobiliariaLanding";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando sección Inmobiliaria IMPULSO…
        </div>
      }
    >
      <InmobiliariaLanding />
    </Suspense>
  );
}
