// src/app/page.tsx
import { Suspense } from "react";
import HomeLanding from "./HomeLanding";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-200">Cargando Impulso Energético...</div>}>
      <HomeLanding />
    </Suspense>
  );
}
