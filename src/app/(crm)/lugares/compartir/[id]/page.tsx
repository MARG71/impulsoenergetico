import { Suspense } from "react";
import CompartirContenido from "./CompartirContenido";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 px-6 py-10">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
              <div className="text-lg font-extrabold">Cargando kit de compartir…</div>
              <div className="text-sm text-slate-400 mt-2">Un momento.</div>
            </div>
          </div>
        </div>
      }
    >
      <CompartirContenido id={id} />
    </Suspense>
  );
}
