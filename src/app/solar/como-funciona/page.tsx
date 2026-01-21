import React, { Suspense } from "react";
import ComoFunciona from "./ComoFunciona";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">Cargando…</div>}>
      <ComoFunciona />
    </Suspense>
  );
}
