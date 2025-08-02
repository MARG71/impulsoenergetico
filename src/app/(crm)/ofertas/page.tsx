'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// ⚠️ ¡Import dinámico para evitar que el componente cliente se use en el build del servidor!
const GestionOfertasContenido = dynamic(() => import('./GestionOfertasContenido'), {
  ssr: false,
})

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Cargando ofertas...</div>}>
      <GestionOfertasContenido />
    </Suspense>
  )
}
