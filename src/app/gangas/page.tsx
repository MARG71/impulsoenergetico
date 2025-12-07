import { Suspense } from "react";
import GangasContenido from "./GangasContenido";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <GangasContenido />
    </Suspense>
  );
}
