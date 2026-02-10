import { Suspense } from "react";
import EditarLugarContenido from "./EditarLugarContenido";

export default function Page(props: { params: { id: string } }) {
  const { id } = props.params;

  return (
    <Suspense fallback={<div className="p-6 text-slate-200">Cargando…</div>}>
      <EditarLugarContenido id={id} />
    </Suspense>
  );
}
