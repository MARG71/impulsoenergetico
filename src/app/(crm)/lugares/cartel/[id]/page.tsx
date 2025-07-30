'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';

export default function CartelLugar() {
  const router = useRouter();
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

    await new Promise((resolve) => setTimeout(resolve, 300));

    const html2pdf = (await import('html2pdf.js')).default;

    html2pdf()
      .from(cartelRef.current)
      .set({
        margin: 0,
        filename: 'cartel_impulso.pdf',
        html2canvas: {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          logging: false,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      })
      .save();
  };

  const imprimirCartel = () => {
    if (!cartelRef.current) return;

    const ventana = window.open('', '_blank');
    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head>
          <title>Imprimir Cartel</title>
          <style>
            body { margin: 0; padding: 0; }
            .cartel { width: 210mm; height: 297mm; position: relative; }
            .fondo { position: absolute; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
            .qr-centro {
              position: absolute;
              width: 5cm;
              height: 5cm;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 12px;
              display: flex;
              justify-content: center;
              align-items: center;
              border-radius: 12px;
              box-shadow: 0 0 10px rgba(0,0,0,0.2);
              z-index: 2;
            }
          </style>
        </head>
        <body>${cartelRef.current.innerHTML}</body>
      </html>
    `);
    ventana.document.close();
    setTimeout(() => ventana.print(), 500);
  };

  if (!lugar || !fondoUrl) {
    return <div className="p-10 text-center">Cargando cartel...</div>;
  }

  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;

  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-6">
      {/* Botón Volver */}
      <div className="w-full max-w-4xl mb-4">
        <Button onClick={() => router.back()} className="bg-gray-200 text-black hover:bg-gray-300">
          ⬅ Volver
        </Button>
      </div>

      {/* Cartel A4 */}
      <div
        ref={cartelRef}
        className="cartel relative w-[210mm] h-[297mm] border border-gray-300 shadow-xl overflow-hidden rounded bg-white"
      >
        <img src={fondoUrl} alt="Fondo cartel" className="fondo" />

        {/* QR centrado */}
        <div className="qr-centro">
          <QRCode value={qrUrl} size={160} />
        </div>
      </div>

      {/* Botones acción */}
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
