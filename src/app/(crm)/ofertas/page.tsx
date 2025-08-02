import { Suspense } from 'react'
import GestionOfertasContenido from './GestionOfertasContenido'

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando ofertas...</div>}>
      <GestionOfertasContenido />
    </Suspense>
  )
}
