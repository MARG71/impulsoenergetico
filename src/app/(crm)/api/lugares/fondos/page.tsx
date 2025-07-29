'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function GestionFondos() {
  const [fondos, setFondos] = useState<any[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    fetchFondos();
  }, []);

  const fetchFondos = async () => {
    const res = await fetch('/api/fondos');
    const data = await res.json();
    setFondos(data);
  };

  const handleSubir = async () => {
    if (!archivo) return;
    setSubiendo(true);
    const formData = new FormData();
    formData.append('file', archivo);

    const res = await fetch('/api/fondos', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      setArchivo(null);
      await fetchFondos();
    }
    setSubiendo(false);
  };

  const fondoPrincipal = fondos[0];
  const fondosAnteriores = fondos.slice(1);

  return (
    <div className="p-6 min-h-screen bg-[#f0fdf4]">
      <h1 className="text-3xl font-bold text-[#1F1F1F] mb-6">Gestión de Fondos de Cartel</h1>

      <div className="bg-white p-6 rounded-xl shadow-md mb-10">
        <h2 className="text-xl font-semibold mb-4 text-[#1F1F1F]">Subir nuevo fondo</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setArchivo(e.target.files?.[0] || null)}
          className="mb-4"
        />
        <Button
          onClick={handleSubir}
          disabled={!archivo || subiendo}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {subiendo ? 'Subiendo...' : 'Subir fondo'}
        </Button>
      </div>

      {fondoPrincipal && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-[#1F1F1F]">Fondo Principal Actual</h2>
          <Image
            src={fondoPrincipal.url}
            alt="Fondo principal"
            width={900}
            height={500}
            className="rounded-xl shadow-md w-full max-w-[800px]"
          />
        </div>
      )}

      {fondosAnteriores.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-[#1F1F1F]">Galería de Fondos Anteriores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fondosAnteriores.map((fondo) => (
              <Image
                key={fondo.id}
                src={fondo.url}
                alt="Fondo anterior"
                width={300}
                height={200}
                className="rounded-lg shadow"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
