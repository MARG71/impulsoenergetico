// src/app/(crm)/panel-agente/page.tsx
import { Suspense } from "react";
import PanelAgenteContenido from "./PanelAgenteContenido";

export default function PanelAgentePage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Cargando panel del agente…</div>}>
      <PanelAgenteContenido />
    </Suspense>
  );
}
