import { Suspense } from "react";
import EditarLugarContenido from "./EditarLugarContenido";

type Params = { id: string };

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="p-6 text-slate-200">Cargando…</div>}>
      <EditarLugarContenido id={id} />
    </Suspense>
  );
}
