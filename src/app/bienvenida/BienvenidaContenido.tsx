"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Flame, Phone, PartyPopper, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function BienvenidaContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombre = searchParams.get('nombre') || '';
  const agenteId = searchParams.get('agenteId') || '';
  const lugarId = searchParams.get('lugarId') || '';

  const secciones = [
    {
      nombre: 'Luz',
      icono: <Sparkles className="w-10 h-10 text-yellow-100" />,
      ruta: `/comparador?seccion=luz&agenteId=${agenteId}&lugarId=${lugarId}`,
      bg: 'bg-green-500',
    },
    {
      nombre: 'Gas',
      icono: <Flame className="w-10 h-10 text-yellow-100" />,
      ruta: '#',
      bg: 'bg-orange-500',
    },
    {
      nombre: 'Telefonía',
      icono: <Phone className="w-10 h-10 text-yellow-100" />,
      ruta: '#',
      bg: 'bg-blue-600',
    },
  ];

  const ofertasEspeciales = [
    {
      titulo: '💡 Ahorra hasta un 30% en tu factura de luz',
      descripcion: 'Promoción válida hasta fin de mes. Consulta condiciones.',
      bg: 'bg-green-100 text-green-800',
      accion: () => router.push(`/comparador?seccion=luz&agenteId=${agenteId}&lugarId=${lugarId}`),
    },
    {
      titulo: '🔥 Bono de bienvenida en tu alta de gas',
      descripcion: 'Aprovecha esta oferta exclusiva para nuevos clientes. ¡Incluye asesoramiento técnico y económico sin coste!',
      bg: 'bg-orange-100 text-orange-800',
      accion: () => alert('Oferta de gas en construcción.'),
    },
    {
      titulo: '📱 50% de descuento en tu tarifa móvil',
      descripcion: 'Válido contratando desde nuestra plataforma con permanencia mínima de 6 meses.',
      bg: 'bg-blue-100 text-blue-800',
      accion: () => alert('Oferta de telefonía en construcción.'),
    },
    {
      titulo: '⚡ Asesoría energética gratuita',
      descripcion: 'Analizamos tu consumo y te recomendamos la mejor tarifa, sin compromiso.',
      bg: 'bg-purple-100 text-purple-800',
      accion: () => alert('Asesoría personalizada próximamente disponible.'),
    },
    {
      titulo: '🌞 Bonificación por energía solar',
      descripcion: 'Descuento adicional si tienes instalación fotovoltaica o estás en proceso de instalación. Promoción ecológica.',
      bg: 'bg-yellow-100 text-yellow-800',
      accion: () => alert('Oferta solar en preparación.'),
    },
  ];

  const ofertasPorSeccion = {
    luz: [
      '💡 Tarifa estable todo el año',
      '🔌 Sin permanencia ni letra pequeña',
      '⚡ Ahorro garantizado con revisión anual',
      '🧾 Gestión gratuita del cambio de compañía',
    ],
    gas: [
      '🔥 Bono de 30€ en tu primera factura de gas',
      '🏠 Ideal para calefacción eficiente',
      '📈 Precios estables y sin sobresaltos',
      '📞 Atención personalizada y cercana',
    ],
    telefonia: [
      '📱 Tarifa móvil ilimitada desde 9,99€',
      '📶 Cobertura nacional con red 5G',
      '💼 Packs familia con descuentos exclusivos',
      '🆓 Roaming gratuito en Europa y EE.UU.',
    ],
  };

  const [indiceOferta, setIndiceOferta] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceOferta((prev) => (prev + 1) % ofertasEspeciales.length);
    }, 6000);
    return () => clearInterval(intervalo);
  }, [ofertasEspeciales.length]);

  const ofertaActual = ofertasEspeciales[indiceOferta];

  const handleClick = (seccion: string, ruta: string) => {
    if (seccion === 'Luz') {
      router.push(ruta);
    } else {
      alert('🔧 Esta sección está en construcción. Muy pronto estará disponible.');
    }
  };

  const avanzar = () => {
    setIndiceOferta((prev) => (prev + 1) % ofertasEspeciales.length);
  };

  const retroceder = () => {
    setIndiceOferta((prev) => (prev - 1 + ofertasEspeciales.length) % ofertasEspeciales.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-gradient-to-br from-emerald-50 to-blue-100 min-h-screen flex flex-col items-center px-4 py-6"

    >
      {/* Logo y bienvenida */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center mb-4 px-4 gap-4">
        <Image
          src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
          alt="Logo Impulso Energético"
          width={160}
          height={50}
          priority
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xl sm:text-2xl md:text-3xl text-green-600 text-center"
        >
          <PartyPopper className="inline-block w-6 h-6 mr-2 animate-bounce" />
          ¡Bienvenido{nombre ? `, ${nombre}` : ''}!
        </motion.div>
      </div>

      <p className="text-center text-gray-600 mb-4 max-w-xl text-sm md:text-base">
        Gracias por confiar en <strong>Impulso Energético</strong>. Elige el servicio que deseas comparar o consulta nuestras promociones exclusivas.
      </p>

      {/* Servicios con fondo llamativo */}
      <div className="w-full max-w-5xl bg-gradient-to-r from-green-400 via-orange-400 to-blue-500 rounded-xl p-6 mb-6 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {secciones.map((sec) => (
            <Card
              key={sec.nombre}
              onClick={() => handleClick(sec.nombre, sec.ruta)}
              className={`cursor-pointer text-white ${sec.bg} shadow-md hover:shadow-lg transition-transform hover:scale-105`}
            >
              <CardContent className="flex flex-col items-center py-4">
                {sec.icono}
                <span className="text-base md:text-lg font-medium mt-2">{sec.nombre}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-center text-white text-sm font-semibold bg-pink-600 px-4 py-1 rounded-xl shadow-lg animate-pulse mb-4">
        🔜 Más servicios próximamente disponibles
      </p>

      {/* Carrusel de ofertas especiales con fondo más vivo */}
      <div className="w-full py-6 px-4 rounded-xl shadow max-w-4xl mb-6 bg-gradient-to-r from-blue-100 to-indigo-100">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">Ofertas Especiales</h2>
        <div className="relative mb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={indiceOferta}
            transition={{ duration: 0.4 }}
            className={`rounded-xl px-6 py-5 text-center ${ofertaActual.bg} shadow-md min-h-[160px]`}
          >
            <h3 className="text-base md:text-lg font-semibold mb-2">{ofertaActual.titulo}</h3>
            <p className="text-sm md:text-base mb-4 leading-relaxed">{ofertaActual.descripcion}</p>
            <button
              onClick={ofertaActual.accion}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition text-sm"
            >
              Ir a la oferta
            </button>
          </motion.div>
          <button onClick={retroceder} className="absolute left-[-40px] top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full p-2 shadow hover:bg-gray-100 transition">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={avanzar} className="absolute right-[-40px] top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full p-2 shadow hover:bg-gray-100 transition">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="flex justify-center space-x-1">
          {ofertasEspeciales.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                i === indiceOferta ? 'bg-green-600 scale-125' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Ofertas por sección con fondo según servicio */}
      {Object.entries(ofertasPorSeccion).map(([seccion, items]) => {
        const fondo =
          seccion === 'luz' ? 'bg-green-500' :
          seccion === 'gas' ? 'bg-orange-500' :
          seccion === 'telefonia' ? 'bg-blue-600' :
          'bg-gray-200';

        return (
          <div key={seccion} className={`w-full max-w-5xl ${fondo} rounded-xl px-6 py-6 mb-6 text-white`}>
            <h3 className="text-xl font-bold mb-4 capitalize">Ofertas en {seccion}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((oferta, idx) => (
                
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow p-4 text-sm text-center hover:shadow-lg transition transform hover:scale-[1.02] text-gray-700"
                >
  
                  <p className="font-medium mb-2">{oferta}</p>
                  
                  <button
                    className={`
                      text-white px-3 py-1 rounded text-xs font-semibold transition 
                      ${
                        seccion === 'luz'
                          ? 'bg-green-600 hover:bg-green-700'
                          : seccion === 'gas'
                          ? 'bg-orange-500 hover:bg-orange-600'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }
                    `}
                    onClick={() => alert(`Acceder a ofertas de ${seccion}`)}
                  >
                    Ver más
                  </button>


                </div>

              ))}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
