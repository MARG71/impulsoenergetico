// src/app/aerotermia/page.tsx
import React, { Suspense } from "react";
import AerotermiaLanding from "./AerotermiaLanding";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando sección Aerotermia IMPULSO…
        </div>
      }
    >
      <AerotermiaLanding />
    </Suspense>
  );
}
