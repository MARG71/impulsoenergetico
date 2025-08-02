import { Suspense } from 'react'
import GestionOfertasContenido from './GestionOfertasContenido'

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Cargando ofertas...</div>}>
      <GestionOfertasContenido />
    </Suspense>
  )
}
