"use client";

import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";

import SolarHeader from "./SolarHeader";
import SolarFooter from "./SolarFooter";
import SolarLeadPopup from "./SolarLeadPopup";
import SolarQuickActions from "./SolarQuickActions";
import { useBuildQuery } from "./useBuildQuery";

export default function SolarShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const buildQuery = useBuildQuery();

  const LOGO_SRC = "/brand/impulso-logo.png";

  const links = useMemo(
    () => [
      { label: "Por qué", href: buildQuery("/solar#por-que") },
      { label: "Beneficios", href: buildQuery("/solar#beneficios") },
      { label: "Kits", href: buildQuery("/solar#kits") },
      { label: "Proceso", href: buildQuery("/solar/como-funciona") },
      { label: "Tienda", href: buildQuery("/solar/tienda") },
      { label: "FAQ", href: buildQuery("/solar/faq") },
      { label: "Subvenciones", href: buildQuery("/solar/subvenciones") },
    ],
    [buildQuery]
  );

  const estudioHref = useMemo(() => buildQuery("/solar/estudio"), [buildQuery]);
  const disablePopup = pathname?.startsWith("/solar/estudio");

  return (
    <div className="min-h-screen bg-[#061513] text-white">
      {/* Fondo más “solar” + colorido */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,193,7,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(24,166,118,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35),rgba(0,0,0,0.85))]" />
      </div>

      <SolarHeader logoSrc={LOGO_SRC} links={links} cta={{ label: "Pedir estudio", href: estudioHref }} />

      {/* Botonera fija estilo Sotysolar */}
      <SolarQuickActions
        phone="+34 600 000 000"
        estudioHref={estudioHref}
        guiaHref={buildQuery("/solar/guia")} // si no existe aún, luego lo creamos o lo cambiamos a PDF
      />

      {/* Popup: 30s primera vez, luego 60s. En cada ruta se rearma. */}
      <SolarLeadPopup
        disabled={disablePopup}
        ctaHref={estudioHref}
        firstDelaySeconds={30}
        repeatDelaySeconds={60}
        armOnRouteChange
      />

      {children}

      <SolarFooter />
    </div>
  );
}
