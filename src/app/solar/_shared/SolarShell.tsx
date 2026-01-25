"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import SolarHeader from "./SolarHeader";
import SolarLeadPopup from "./SolarLeadPopup";
import SolarQuickActions from "./SolarQuickActions";

const LOGO_SRC = "/brand/impulso-logo.png";
const CTA_PRIMARY_HREF = "/solar/estudio";

export default function SolarShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // ✅ No mostrar popup en /solar/estudio
  const disablePopup = pathname?.startsWith("/solar/estudio");

  // ✅ Links del menú superior
  const links = useMemo(
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
      {/* Fondo solar colorido */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_520px_at_15%_10%,rgba(255,193,7,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_80%_18%,rgba(16,185,129,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_70%_90%,rgba(255,140,0,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#061513] via-[#061513] to-[#040B0A]" />
      </div>

      <SolarHeader
        logoSrc={LOGO_SRC}
        links={links}
        cta={{ label: "Pedir estudio", href: CTA_PRIMARY_HREF }}
      />

      <SolarQuickActions
        phone="+34 692 137 048"
        estudioHref={CTA_PRIMARY_HREF}
        guiaHref="/solar/faq"
      />

      {!disablePopup && <SolarLeadPopup />}

      {children}
    </div>
  );
}
