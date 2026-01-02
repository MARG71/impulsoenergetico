import { Suspense } from "react";
import EditarLugarContenido from "./EditarLugarContenido";

export default function Page(props: any) {
  const id = String(props?.params?.id ?? "");

  return (
    <Suspense fallback={<div className="p-6 text-slate-200">Cargando edición…</div>}>
      <EditarLugarContenido id={id} />
    </Suspense>
  );
}
