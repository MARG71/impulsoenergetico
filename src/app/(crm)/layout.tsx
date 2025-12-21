// ✅ src/app/(crm)/layout.tsx
import type { Metadata } from "next";
import CRMClienteLayout from "./CRMClienteLayout";
import "../globals.css";

export const metadata: Metadata = {
  title: "IMPULSO ENERGÉTICO CRM",
  description: "Panel de control administrativo",
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <CRMClienteLayout>{children}</CRMClienteLayout>;
}
