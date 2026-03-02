// src/app/registro/page.tsx
// src/app/registro/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import RegistroFormulario from "./RegistroFormulario";

export const metadata: Metadata = {
  title: "🎁 Oferta Exclusiva | Impulso Energético",
  description:
    "Regístrate en IMPULSO ENERGÉTICO y ahorra en luz, gas, telefonía, seguros y más servicios. Oferta exclusiva por QR.",
  themeColor: "#00d4aa",
};

export default function Page() {
  return (
    <Suspense>
      <RegistroFormulario />
    </Suspense>
  );
}