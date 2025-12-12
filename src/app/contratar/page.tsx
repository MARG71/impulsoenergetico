import { Suspense } from "react";
import ContratarFormulario from "./ContratarFormulario";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-200">Cargando…</div>}>
      <ContratarFormulario />
    </Suspense>
  );
}
