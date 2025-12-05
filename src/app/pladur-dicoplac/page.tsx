// src/app/pladur-dicoplac/page.tsx
import React, { Suspense } from "react";
import PladurDicoplacLanding from "./PladurDicoplacLanding";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando sección Pladur DICOPLAC…
        </div>
      }
    >
      <PladurDicoplacLanding />
    </Suspense>
  );
}
