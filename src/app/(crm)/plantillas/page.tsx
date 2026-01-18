import { Suspense } from "react";
import PlantillasContenido from "./PlantillasContenido";

export default function PlantillasPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-100">Cargando plantillas…</div>}>
      <PlantillasContenido />
    </Suspense>
  );
}
