// src/app/(crm)/leads/[id]/page.tsx
import { Suspense } from "react";
import CRMClienteLayout from "../../CRMClienteLayout";
import LeadDetalleContenido from "./LeadDetalleContenido";

export default function LeadDetallePage() {
  return (
    <CRMClienteLayout>
      <Suspense fallback={<div className="p-6 text-slate-100">Cargando lead…</div>}>
        <LeadDetalleContenido />
      </Suspense>
    </CRMClienteLayout>
  );
}
