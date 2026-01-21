import React, { Suspense } from "react";
import FAQSolar from "./FAQSolar";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando FAQ…
        </div>
      }
    >
      <FAQSolar />
    </Suspense>
  );
}
