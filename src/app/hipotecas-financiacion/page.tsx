import { Suspense } from "react";
import HipotecasFinanciacionContenido from "./HipotecasFinanciacionContenido";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <HipotecasFinanciacionContenido />
    </Suspense>
  );
}
