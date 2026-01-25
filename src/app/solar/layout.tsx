import type { ReactNode } from "react";
import SolarShell from "./_shared/SolarShell";

export default function SolarLayout({ children }: { children: ReactNode }) {
  return <SolarShell>{children}</SolarShell>;
}
