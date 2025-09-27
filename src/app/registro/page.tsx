// src/app/registro/page.tsx
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import RegistroLandingContenido from './RegistroLandingContenido';

export default function RegistroLeadPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Cargando...</div>}>
      <RegistroLandingContenido />
    </Suspense>
  );
}
