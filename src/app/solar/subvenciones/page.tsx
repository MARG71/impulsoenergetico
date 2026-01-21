import React, { Suspense } from "react";
import Subvenciones from "./Subvenciones";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando subvenciones…
        </div>
      }
    >
      <Subvenciones />
    </Suspense>
  );
}
