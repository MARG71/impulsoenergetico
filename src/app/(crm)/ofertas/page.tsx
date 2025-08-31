// src/app/(crm)/ofertas/page.tsx
export const dynamic = 'force-dynamic'; // evitar SSG/caché

import NextDynamic from 'next/dynamic';
import { Suspense } from 'react';

// Carga cliente-only del contenido
const GestionOfertasContenido = NextDynamic(() => import('./GestionOfertasContenido'), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Cargando ofertas...</div>}>
      <GestionOfertasContenido />
    </Suspense>
  );
}

