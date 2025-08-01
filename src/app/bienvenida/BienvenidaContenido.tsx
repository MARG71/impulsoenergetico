'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Flame, Phone, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function BienvenidaContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombre = searchParams.get('nombre') || '';
  const agenteId = searchParams.get('agenteId') || '';
  const lugarId = searchParams.get('lugarId') || '';

  const handleClick = (seccion: string, ruta: string) => {
    if (seccion === 'Luz') {
      router.push(ruta);
    } else {
      alert('🔧 Esta sección está en construcción. Muy pronto estará disponible.');
    }
  };

  const secciones = [
    {
      nombre: 'Luz',
      icono: <Sparkles className="w-10 h-10 text-yellow-100" />,
      ruta: `/comparador?seccion=luz&agenteId=${agenteId}&lugarId=${lugarId}`,
      bg: 'bg-green-500'
    },
    {
      nombre: 'Gas',
      icono: <Flame className="w-10 h-10 text-yellow-100" />,
      ruta: '#',
      bg: 'bg-orange-500'
    },
    {
      nombre: 'Telefonía',
      icono: <Phone className="w-10 h-10 text-yellow-100" />,
      ruta: '#',
      bg: 'bg-blue-600'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-white to-sky-100 flex flex-col items-center px-4 py-6"
    >
      <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center mb-6 px-4 gap-4">
        <Image
          src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
          alt="Logo Impulso Energético"
          width={180}
          height={50}
          priority
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xl sm:text-2xl md:text-4xl text-green-600 text-center"
        >
          <PartyPopper className="inline-block w-7 h-7 mr-2 animate-bounce" />
          ¡Bienvenido{nombre ? `, ${nombre}` : ''}!
        </motion.div>
      </div>

      <p className="text-center text-gray-600 mb-10 max-w-xl text-sm md:text-base">
        Gracias por confiar en <strong>Impulso Energético</strong>. Elige el servicio que deseas comparar o consulta nuestras promociones exclusivas.
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl mb-10"
      >
        {secciones.map((sec) => (
          <Card
            key={sec.nombre}
            onClick={() => handleClick(sec.nombre, sec.ruta)}
            className={`cursor-pointer text-white ${sec.bg} shadow-lg hover:shadow-xl transition-transform hover:scale-105`}
          >
            <CardContent className="flex flex-col items-center py-8">
              {sec.icono}
              <span className="text-lg md:text-xl font-semibold mt-4">{sec.nombre}</span>
            </CardContent>
          </Card>
        ))}
      </motion.div>

<motion.p
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: 0.6, duration: 0.5 }}
  className="text-center text-white text-base font-semibold bg-pink-600 px-4 py-2 rounded-xl shadow-lg animate-pulse mt-2 mb-8"
>
  🔜 Más servicios próximamente disponibles
</motion.p>

<h2 className="text-2xl font-semibold mb-4 text-gray-800">Ofertas Especiales</h2>
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.6 }}
  className="w-full max-w-5xl mb-10"
>
  <motion.div
    className="overflow-hidden relative rounded-xl shadow-xl"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8 }}
  >
    <motion.div
      className="flex w-[300%] animate-slideCarousel"
      style={{ animationDuration: '18s' }}
    >
      <div className="w-full sm:w-1/3 p-4 bg-green-100">
        <h3 className="font-bold text-lg mb-2 text-green-800">💡 Ahorra hasta un 30% en tu factura de luz</h3>
        <p className="text-gray-700 text-sm mb-2">Promoción válida hasta fin de mes. Consulta condiciones.</p>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm" onClick={() => window.location.href = '/comparador?seccion=luz'}>
          Ir a la oferta
        </button>
      </div>
      <div className="w-full sm:w-1/3 p-4 bg-orange-100">
        <h3 className="font-bold text-lg mb-2 text-orange-800">🔥 Bono de bienvenida en tu alta de gas</h3>
        <p className="text-gray-700 text-sm mb-2">Aprovecha esta oferta exclusiva para nuevos clientes.</p>
        <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm" onClick={() => alert('Oferta de gas en construcción.')}>Ir a la oferta</button>
      </div>
      <div className="w-full sm:w-1/3 p-4 bg-blue-100">
        <h3 className="font-bold text-lg mb-2 text-blue-800">📱 50% de descuento en tu tarifa móvil</h3>
        <p className="text-gray-700 text-sm mb-2">Válido contratando desde nuestra plataforma.</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm" onClick={() => alert('Oferta de telefonía en construcción.')}>Ir a la oferta</button>
      </div>
    </motion.div>
  </motion.div>
</motion.div>
    </motion.div>
  );
}
