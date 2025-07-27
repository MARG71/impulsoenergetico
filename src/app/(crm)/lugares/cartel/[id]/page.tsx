// src/app/lugares/cartel/[id]/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const fondos = [
  '/energia-fondo.jpg',
  '/fondo-comisiones.jpg',
  '/fondo-eco.jpg',
];

export default function CartelLugar() {
  const params = useParams();
  const id = params?.id;
  const [lugar, setLugar] = useState<any | null>(null);
  const [fondoActual, setFondoActual] = useState(0);
  const cartelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    const fetchLugar = async () => {
      const res = await fetch(`/api/lugares/${id}`);
      const data = await res.json();
      setLugar(data);
    };

    fetchLugar();
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
          <style>
            body { font-family: sans-serif; padding: 40px; text-align: center; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win?.document.close();
    win?.print();
  };

  const cambiarFondo = (index: number) => {
    setFondoActual(index);
  };

  if (!lugar) return <div className="p-10 text-center">Cargando cartel...</div>;

  // ✅ URL QR con dominio dinámico y parámetros agenteId + lugarId
  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10">
      <div
        ref={cartelRef}
        className="bg-white w-[210mm] h-[297mm] p-12 border border-gray-300 shadow-xl flex flex-col justify-between"
      >
        <div className="flex justify-between items-center mb-6">
          <Image
            src="/logo-impulso.jpeg"
            alt="Logo Impulso Energético"
            width={120}
            height={120}
          />
          <div className="text-right text-sm text-gray-600">
            www.impulsoenergetico.com
            <br />
            contacto@impulsoenergetico.com
            <br />
            Tel: 900 123 456
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#1F1F1F] mb-4 leading-snug">
              ¿Quieres ahorrar <br />
              en tu factura de luz, gas o teléfono?
            </h1>
            <p className="text-lg text-gray-800 mb-6">
              Escanea este código QR, accede al comparador y descubre las mejores
              tarifas. Si contratas, ¡ganas una comisión! Comparte el QR con tus
              amigos y gana por cada contrato.
            </p>
            <div className="text-sm text-gray-500">
              Hecho con ❤️ por Impulso Energético — Smart Idea
            </div>
          </div>
          <div className="flex flex-col items-center">
            <QRCode value={qrUrl} size={200} />
            <p className="text-center text-xs text-gray-500 mt-2">Escanea con tu móvil</p>
          </div>
        </div>

        <div className="mt-10 w-full">
          <Image
            src={fondos[fondoActual]}
            alt="Fondo energía"
            width={1000}
            height={200}
            className="w-full object-cover rounded-md"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        <Button onClick={descargarPDF} className="bg-blue-600 text-white hover:bg-blue-700">
          Descargar cartel en PDF
        </Button>
        <Button onClick={imprimirCartel} className="bg-green-600 text-white hover:bg-green-700">
          Imprimir cartel
        </Button>
      </div>

      <div className="mt-8">
        <h3 className="text-center mb-4 text-lg font-semibold">Elige fondo para el cartel:</h3>
        <div className="flex gap-4 flex-wrap justify-center">
          {fondos.map((fondo, index) => (
            <div
              key={fondo}
              className="cursor-pointer border rounded hover:ring-2 ring-green-500"
              onClick={() => cambiarFondo(index)}
            >
              <Image
                src={fondo}
                alt={`Fondo ${index + 1}`}
                width={150}
                height={100}
                className="rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
