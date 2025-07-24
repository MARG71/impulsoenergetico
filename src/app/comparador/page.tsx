'use client';

import { Suspense } from 'react';
import ComparadorContenido from './ComparadorContenido';

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando comparador...</div>}>
      <ComparadorContenido />
    </Suspense>
  );
}
