// src/app/bienvenida/page.tsx
import { Suspense } from 'react';
import BienvenidaContenido from './BienvenidaContenido';

export const dynamic = 'force-dynamic';

export default function BienvenidaPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-white bg-[#0E2631] min-h-screen">Cargando bienvenida...</div>}>
      <BienvenidaContenido />
    </Suspense>
  );
}
