// src/app/ferreteria/page.tsx
import React, { Suspense } from "react";
import FerreteriaLanding from "./FerreteriaLanding";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando sección Ferretería BRICOTITAN…
        </div>
      }
    >
      <FerreteriaLanding />
    </Suspense>
  );
}
