import { Suspense } from 'react';
import ComparadorContenido from './ComparadorContenido';

export const dynamic = 'force-dynamic';

export default function ComparadorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Cargando comparador...</div>}>
      <ComparadorContenido />
    </Suspense>
  );
}
