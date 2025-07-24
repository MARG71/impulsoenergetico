'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import RegistroFormulario from './RegistroFormulario';

export default function RegistroLeadPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Cargando...</div>}>
      <RegistroFormulario />
    </Suspense>
  );
}
