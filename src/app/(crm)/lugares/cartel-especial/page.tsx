'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';

export default function CartelEspecialLugar() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [lugar, setLugar] = useState<any | null>(null);
  const [cargando, setCargando] = useState(true);

  // Controles QR
  const [qrSize, setQrSize] = useState(180);      // px
  const [posX, setPosX] = useState(50);           // %
  const [posY, setPosY] = useState(50);           // %
  const contRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const r = await fetch(`/api/lugares/${id}`);
      const d = await r.json();
      setLugar(d);
      setCargando(false);
    })();
  }, [id]);

  if (cargando) return <div className="p-8">Cargando…</div>;
  if (!lugar) return <div className="p-8 text-red-600">Lugar no encontrado.</div>;
  if (!lugar.especialCartelUrl) {
    return (
      <div className="p-8">
        <p className="mb-4">
          Este lugar no tiene <b>cartel especial</b> subido todavía.
        </p>
        <Button onClick={() => router.push('/lugares')} className="bg-blue-600 text-white">
          Volver a Lugares
        </Button>
      </div>
    );
  }

  const origen = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = `${origen}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;

  const descargarPDF = async () => {
    if (!contRef.current) return;
    const html2pdf = (await import('html2pdf.js')).default;
    await new Promise((r) => setTimeout(r, 150)); // pequeño delay
    html2pdf()
      .from(contRef.current)
      .set({
        margin: 0,
        filename: `cartel_especial_${lugar.id}.pdf`,
        html2canvas: { scale: 3, useCORS: true, allowTaint: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  };

  const descargarPNG = async () => {
    if (!contRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    await new Promise((r) => setTimeout(r, 150));
    const canvas = await html2canvas(contRef.current, { scale: 3, useCORS: true, backgroundColor: null });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `cartel_especial_${lugar.id}.png`;
    a.click();
  };

  const imprimir = () => {
    if (!contRef.current) return;
    const win = window.open('', '', 'width=900,height=1200');
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>Imprimir cartel especial</title></head>
        <body style="margin:0">
          ${contRef.current.outerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="mb-4 flex gap-2">
        <Button onClick={() => router.back()} className="bg-gray-200 text-black hover:bg-gray-300">⬅ Volver</Button>
      </div>

      {/* Controles */}
      <div className="mb-6 grid md:grid-cols-3 gap-4">
        <div>
          <div className="text-sm font-semibold mb-1">Tamaño del QR (px)</div>
          <input type="range" min={100} max={320} value={qrSize} onChange={e => setQrSize(Number(e.target.value))} className="w-full" />
          <div className="text-xs text-gray-500 mt-1">{qrSize}px</div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-1">Posición X (%)</div>
          <input type="range" min={0} max={100} value={posX} onChange={e => setPosX(Number(e.target.value))} className="w-full" />
          <div className="text-xs text-gray-500 mt-1">{posX}%</div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-1">Posición Y (%)</div>
          <input type="range" min={0} max={100} value={posY} onChange={e => setPosY(Number(e.target.value))} className="w-full" />
          <div className="text-xs text-gray-500 mt-1">{posY}%</div>
        </div>
      </div>

      {/* Lienzo del cartel */}
      <div
        ref={contRef}
        className="relative border border-gray-200 shadow-xl overflow-hidden bg-white"
        style={{ width: '210mm', height: '297mm', position: 'relative' }}
      >
        <img
          src={lugar.especialCartelUrl}
          alt="Cartel especial"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <div
          style={{
            position: 'absolute',
            left: `${posX}%`,
            top: `${posY}%`,
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            padding: 12,
            borderRadius: 12,
          }}
        >
          <QRCode value={qrUrl} size={qrSize} />
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={descargarPDF} className="bg-blue-600 text-white hover:bg-blue-700">Descargar PDF</Button>
        <Button onClick={descargarPNG} className="bg-emerald-600 text-white hover:bg-emerald-700">Descargar PNG</Button>
        <Button onClick={imprimir} className="bg-green-600 text-white hover:bg-green-700">Imprimir</Button>
      </div>
    </div>
  );
}
