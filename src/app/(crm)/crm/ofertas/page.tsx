// Desactiva SSG/caché para esta ruta
export const dynamic = 'force-dynamic';

import GestionOfertasContenido from '../GestionOfertasContenido';

export default function Page() {
  return <GestionOfertasContenido />;
}
