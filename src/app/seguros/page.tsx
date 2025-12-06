import { Suspense } from "react";
import SegurosContenido from "./SegurosContenido";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <SegurosContenido />
    </Suspense>
  );
}
