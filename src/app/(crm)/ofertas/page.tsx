import dynamic from 'next/dynamic'

const GestionOfertasContenido = dynamic(() => import('./GestionOfertasContenido'), {
  ssr: false, // ⛔ Evita que Next.js intente prerenderizar y falle por useSession
})

export default function Page() {
  return <GestionOfertasContenido />
}
