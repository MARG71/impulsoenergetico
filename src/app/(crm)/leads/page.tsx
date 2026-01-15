import { Suspense } from "react";
import LeadsContenido from "./LeadsContenido";

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-100">Cargando leads…</div>}>
      <LeadsContenido />
    </Suspense>
  );
}
