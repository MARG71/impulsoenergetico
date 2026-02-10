import { Suspense } from "react";
import EditarLugarContenido from "./EditarLugarContenido";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-6 text-slate-200">Cargando…</div>}>
      <EditarLugarContenido id={params.id} />
    </Suspense>
  );
}
