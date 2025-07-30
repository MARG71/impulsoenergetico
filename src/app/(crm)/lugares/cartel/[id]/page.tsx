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

  const imprimirCartel = () => {
    if (!cartelRef.current) return;

    const contenido = cartelRef.current.innerHTML;
    const ventana = window.open('', '', 'width=800,height=1000');

    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head>
          <title>Imprimir Cartel</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .cartel {
              width: 210mm;
              height: 297mm;
              position: relative;
              overflow: hidden;
            }
            .cartel img {
              position: absolute;
              width: 100%;
              height: 100%;
              object-fit: cover;
              z-index: 0;
            }
            .qr-centro {
              position: absolute;
              width: 5cm;
              height: 5cm;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 12px;
              border-radius: 12px;
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 2;
            }
          </style>
        </head>
        <body>
          <div class="cartel">${contenido}</div>
        </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.close();
  };

  // ✅ FUNCIÓN PDF ACTUALIZADA
  const descargarPDF = async () => {
    if (!cartelRef.current) return;

    // Esperar un momento para que se renderice bien
    await new Promise((resolve) => setTimeout(resolve, 200));

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
          logging: true,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      })
      .save();
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

      {/* Cartel visible (pantalla y PDF) */}
      <div
        ref={cartelRef}
        className="relative border border-gray-300 shadow-xl overflow-hidden bg-white"
        style={{
          width: '210mm',
          height: '297mm',
          position: 'relative',
        }}
      >
        {/* Fondo */}
        <img
          src={fondoUrl}
          alt="Fondo del cartel"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        />

        {/* QR centrado */}
        <div
          className="qr-centro"
          style={{
            position: 'absolute',
            width: '5cm',
            height: '5cm',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          <QRCode value={qrUrl} size={160} />
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
