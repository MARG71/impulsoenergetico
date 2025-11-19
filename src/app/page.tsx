// src/app/page.tsx
import { Suspense } from "react";
import HomeContenido from "./HomeContenido";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando Impulso Energético...</div>}>
      <HomeContenido />
    </Suspense>
  );
}
