import { Suspense } from 'react';
import BienvenidaContenido from './BienvenidaContenido';

export default function BienvenidaPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">Cargando...</div>}>
      <BienvenidaContenido />
    </Suspense>
  );
}
