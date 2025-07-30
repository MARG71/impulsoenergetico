'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';

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
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  };

  const imprimirCartel = () => {
    if (!cartelRef.current) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cartel</title>
          <style>
            body { margin: 0; padding: 0; font-family: sans-serif; }
            .cartel { position: relative; width: 210mm; height: 297mm; }
            .fondo { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
            .qr { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 12px; border-radius: 12px; z-index: 2; }
            .pie { position: absolute; bottom: 30px; width: 100%; text-align: center; color: white; font-size: 12px; z-index: 3; text-shadow: 0 0 4px black; }
            .logo { width: 100px; margin: 0 auto 8px; }
          </style>
        </head>
        <body>${cartelRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!lugar || !fondoUrl) {
    return <div className="p-10 text-center">Cargando cartel...</div>;
  }

  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;

  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-6">
      {/* Cartel */}
      <div ref={cartelRef} className="cartel relative w-[210mm] h-[297mm] shadow-xl border border-gray-300 overflow-hidden rounded bg-white">
        {/* Fondo como img estándar */}
        <img src={fondoUrl} alt="Fondo cartel" className="fondo" />

        {/* QR centrado */}
        <div className="qr">
          <QRCode value={qrUrl} size={180} />
        </div>

        {/* Pie con logo e info */}
        <div className="pie">
          <img src="/logo-impulso.jpeg" alt="Logo Impulso" className="logo" />
          <div><strong>IMPULSO ENERGÉTICO</strong></div>
          <div>Tel: 692 137 048 — info@impulsoenergetico.es</div>
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
