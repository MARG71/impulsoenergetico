// src/app/solar/page.tsx
import { Suspense } from "react";
import SolarLanding from "./SolarLanding";

export default function SolarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <SolarLanding />
    </Suspense>
  );
}

