"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import SolarHeader from "./SolarHeader";
import SolarLeadPopup from "./SolarLeadPopup";
import SolarQuickActions from "./SolarQuickActions";

const LOGO_SRC = "/brand/impulso-logo.png"; // ajusta si tu logo tiene otro nombre
const CTA_PRIMARY_HREF = "/solar/estudio";

export default function SolarShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // ✅ No mostrar popup en /solar/estudio
  const disablePopup = pathname?.startsWith("/solar/estudio");

  // ✅ Menú (como tu idea Sotysolar)
  const headerLinks = useMemo(
    () => [
      { label: "Por qué", href: "/solar#por-que" },
      { label: "Beneficios", href: "/solar#beneficios" },
      { label: "Kits", href: "/solar#kits" },
      { label: "Proceso", href: "/solar#proceso" },
      { label: "Tienda", href: "/solar/tienda" },
      { label: "FAQ", href: "/solar/faq" },
      { label: "Subvenciones", href: "/solar/subvenciones" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#061513] text-white">
      {/* Fondo “solar” global */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_10%,rgba(255,193,7,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_80%_20%,rgba(16,185,129,0.20),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_70%_90%,rgba(255,140,0,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#061513] via-[#061513] to-[#040B0A]" />
      </div>

      <SolarHeader
        logoSrc={LOGO_SRC}
        links={headerLinks}
        cta={{ label: "Pedir estudio", href: CTA_PRIMARY_HREF }}
      />

      {/* Popup global (si NO está en /solar/estudio) */}
      {!disablePopup && <SolarLeadPopup />}

      {/* Botonera fija global */}
      <SolarQuickActions
        phone="+34 692 137 048"
        estudioHref={CTA_PRIMARY_HREF}
        guiaHref="/solar/faq"
      />

      {children}
    </div>
  );
}
