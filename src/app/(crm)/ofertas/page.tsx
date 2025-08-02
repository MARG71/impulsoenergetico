'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Import dinámico del componente cliente
const GestionOfertasContenido = dynamic(() => import('./GestionOfertasContenido'), {
  ssr: false, // Esto sigue siendo necesario para evitar prerender
})

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando ofertas...</div>}>
      <GestionOfertasContenido />
    </Suspense>
  )
}
