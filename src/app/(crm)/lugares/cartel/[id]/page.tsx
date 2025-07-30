'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function CartelLugar() {
  const params = useParams();
  const id = params?.id;
  const [lugar, setLugar] = useState<any | null>(null);
  const [fondoUrl, setFondoUrl] = useState<string | null>(null);
  const cartelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    const fetchLugar = async () => {
      const res = await fetch(`/api/lugares/${id}`);
      const data = await res.json();
      setLugar(data);
    };

    const fetchFondoActivo = async () => {
      const res = await fetch('/api/fondos');
      const data = await res.json();
      const fondoActivo = data.find((f: any) => f.activo);
      if (fondoActivo) setFondoUrl(fondoActivo.url);
    };

    fetchLugar();
    fetchFondoActivo();
  }, [id]);

  const descargarPDF = async () => {
    if (!cartelRef.current) return;
    const html2pdf = (await import('html2pdf.js')).default;

    html2pdf()
      .from(cartelRef.current)
      .set({
        margin: 0,
        filename: `cartel_impulso.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  };

  const imprimirCartel = () => {
    if (!cartelRef.current) return;
    const printContent = cartelRef.current.innerHTML;
    const win = window.open('', '', 'width=800,height=600');
    win?.document.write(`
      <html>
        <head>
          <title>Imprimir Cartel</title>
          <style>body { margin: 0; padding: 0; }</style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win?.document.close();
    win?.print();
  };

  if (!lugar || !fondoUrl) {
    return <div className="p-10 text-center">Cargando cartel...</div>;
  }

  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;

  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-6">
      {/* Cartel A4 */}
      <div
        ref={cartelRef}
        className="relative w-[210mm] h-[297mm] shadow-xl border border-gray-300 overflow-hidden rounded"
      >
        {/* Fondo activo */}
        <Image
          src={fondoUrl}
          alt="Fondo del cartel"
          layout="fill"
          objectFit="cover"
          priority
        />

        {/* QR centrado */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-xl shadow-lg">
          <QRCode value={qrUrl} size={180} />
        </div>

        {/* Pie de cartel */}
        <div className="absolute bottom-6 w-full text-center text-white drop-shadow-md">
          <div className="mb-2">
            <Image src="/logo-impulso.jpeg" alt="Logo Impulso" width={100} height={100} className="mx-auto" />
          </div>
          <p className="text-sm font-semibold">IMPULSO ENERGÉTICO</p>
          <p className="text-xs">Tel: 692 137 048 — info@impulsoenergetico.es</p>
        </div>
      </div>

      {/* Botones */}
      <div className="mt-6 flex gap-4 justify-center">
        <Button onClick={descargarPDF} className="bg-blue-600 text-white hover:bg-blue-700">
          Descargar cartel en PDF
        </Button>
        <Button onClick={imprimirCartel} className="bg-green-600 text-white hover:bg-green-700">
          Imprimir cartel
        </Button>
      </div>
    </div>
  );
}
