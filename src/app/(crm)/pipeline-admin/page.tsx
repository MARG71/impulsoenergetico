// src/app/(crm)/pipeline-admin/page.tsx
"use client";

import { Suspense } from "react";
import PipelineAdminContenido from "./PipelineAdminContenido";

export default function PipelineAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          Cargando pipeline global…
        </div>
      }
    >
      <PipelineAdminContenido />
    </Suspense>
  );
}
