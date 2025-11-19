// src/app/registro/page.tsx
import { Suspense } from "react";
import RegistroFormulario from "./RegistroFormulario";

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-200">Cargando registro...</div>}>
      <RegistroFormulario />
    </Suspense>
  );
}
