import { Suspense } from "react";
import ReglasContenido from "./ReglasContenido";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Cargando reglas...</div>}>
      <ReglasContenido />
    </Suspense>
  );
}
