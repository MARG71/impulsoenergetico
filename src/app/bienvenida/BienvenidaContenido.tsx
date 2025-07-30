'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Flame, Phone } from 'lucide-react';

export default function BienvenidaContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombre = searchParams.get('nombre') || '';
  const agenteId = searchParams.get('agenteId') || '';
  const lugarId = searchParams.get('lugarId') || '';

  const secciones = [
    {
      nombre: 'Luz',
      icono: <Sparkles className="w-8 h-8 text-yellow-500" />,
      ruta: `/comparador?seccion=luz&agenteId=${agenteId}&lugarId=${lugarId}`,
    },
    {
      nombre: 'Gas',
      icono: <Flame className="w-8 h-8 text-red-500" />,
      ruta: `/comparador?seccion=gas&agenteId=${agenteId}&lugarId=${lugarId}`,
    },
    {
      nombre: 'Telefonía',
      icono: <Phone className="w-8 h-8 text-blue-500" />,
      ruta: `/comparador?seccion=telefono&agenteId=${agenteId}&lugarId=${lugarId}`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-sky-100 flex flex-col items-center px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        ¡Bienvenido{nombre ? `, ${nombre}` : ''}!
      </h1>
      <p className="text-center text-gray-600 mb-10 max-w-xl">
        Gracias por confiar en <strong>Impulso Energético</strong>. Elige el servicio que deseas comparar o consulta nuestras promociones exclusivas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-10">
        {secciones.map((sec) => (
          <Card
            key={sec.nombre}
            onClick={() => router.push(sec.ruta)}
            className="cursor-pointer shadow-lg hover:shadow-xl transition-transform hover:scale-105"
          >
            <CardContent className="flex flex-col items-center py-6">
              {sec.icono}
              <span className="text-xl font-semibold mt-4">{sec.nombre}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Ofertas Especiales</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Card className="shadow-md">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-2">💡 Ahorra hasta un 30% en tu factura de luz</h3>
            <p className="text-gray-600">Promoción válida hasta fin de mes. Consulta condiciones.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-2">🔥 Bono de bienvenida en tu alta de gas</h3>
            <p className="text-gray-600">Aprovecha esta oferta exclusiva para nuevos clientes.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-2">📱 50% de descuento en tu tarifa móvil</h3>
            <p className="text-gray-600">Válido contratando desde nuestra plataforma.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
