
// src/app/bienvenida/page.tsx
import { Suspense } from "react";
import BienvenidaContenido from "./BienvenidaContenido";

export default function BienvenidaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      Cargando bienvenida...
    </div>}>
      <BienvenidaContenido />
    </Suspense>
  );
}
