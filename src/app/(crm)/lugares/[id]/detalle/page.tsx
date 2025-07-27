'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function DetalleLugar() {
  const { id } = useParams();
  const router = useRouter();
  const [lugar, setLugar] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchLugar = async () => {
      const res = await fetch(`/api/lugares/${id}`);
      const data = await res.json();
      setLugar(data);
      setCargando(false);
    };
    fetchLugar();
  }, [id]);

  if (cargando) return <p className="text-center text-gray-600">Cargando...</p>;
  if (!lugar) return <p className="text-center text-red-600">Lugar no encontrado</p>;

  return (
    <div className="p-6 bg-[#E0F7FA] min-h-screen">
      <Button onClick={() => router.push('/lugares')} className="mb-4 bg-[#F0C300] text-black hover:bg-yellow-400">
        ⬅ Volver
      </Button>

      <h1 className="text-2xl font-bold text-[#1F1F1F] mb-4">Detalle del Lugar</h1>
      <div className="bg-white p-6 rounded-xl shadow">
        <p><strong>Nombre:</strong> {lugar.nombre}</p>
        <p><strong>Dirección:</strong> {lugar.direccion}</p>
        <p><strong>QR Code:</strong> {lugar.qrCode}</p>
        <p><strong>Agente:</strong> {lugar.agente?.nombre || '-'}</p>
      </div>
    </div>
  );
}
