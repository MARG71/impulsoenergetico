import { Suspense } from "react";
import CRMClienteLayout from "../CRMClienteLayout";
import LeadsContenido from "./LeadsContenido";

export default function LeadsPage() {
  return (
    <CRMClienteLayout>
      <Suspense fallback={<div className="p-6 text-slate-100">Cargando leads…</div>}>
        <LeadsContenido />
      </Suspense>
    </CRMClienteLayout>
  );
}
