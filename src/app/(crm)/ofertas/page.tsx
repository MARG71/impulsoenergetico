// src/app/(crm)/ofertas/page.tsx
export const dynamic = 'force-dynamic'; // desactiva SSG/caché de la ruta

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Carga cliente-only del contenido
const GestionOfertasContenido = dynamic(() => import('./GestionOfertasContenido'), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Cargando ofertas...</div>}>
      <GestionOfertasContenido />
    </Suspense>
  );
}

