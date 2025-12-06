import { Suspense } from "react";
import RepuestosCochesContenido from "./RepuestosCochesContenido";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <RepuestosCochesContenido />
    </Suspense>
  );
}
