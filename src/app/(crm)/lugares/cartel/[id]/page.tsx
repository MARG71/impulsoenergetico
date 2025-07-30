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

    const html2pdf = (await import('html2pdf.js')).default;

    html2pdf()
      .from(cartelRef.current)
      .set({
        margin: 0,
        filename: 'cartel_impulso.pdf',
        html2canvas: {
          scale: 3,
          useCORS: true,
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
    window.print(); // Imprime directamente solo el cartel
  };

  if (!lugar || !fondoUrl) {
    return <div className="p-10 text-center">Cargando cartel...</div>;
  }

  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;

  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-6">
      {/* Estilos de impresión embebidos */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .cartel {
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always;
            margin: 0 auto;
          }
        }
      `}</style>

      {/* Botón Volver */}
      <div className="w-full max-w-4xl mb-4 no-print">
        <Button onClick={() => router.back()} className="bg-gray-200 text-black hover:bg-gray-300">
          ⬅ Volver
        </Button>
      </div>

      {/* Cartel A4 */}
      <div
        ref={cartelRef}
        className="cartel relative border border-gray-300 shadow-xl overflow-hidden bg-white"
      >
        <img
          src={fondoUrl}
          alt="Fondo del cartel"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        />
        {/* QR centrado */}
        <div
          className="absolute z-10 bg-white p-3 rounded-lg shadow-md"
          style={{
            width: '5cm',
            height: '5cm',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <QRCode value={qrUrl} size={160} />
        </div>
      </div>

      {/* Botones */}
      <div className="mt-6 flex gap-4 justify-center no-print">
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
