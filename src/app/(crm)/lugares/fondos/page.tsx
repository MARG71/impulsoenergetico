'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { toast } from 'sonner';

export default function GestionFondosCartel() {
  const [fondos, setFondos] = useState<string[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const fetchFondos = async () => {
    const res = await fetch('/api/fondos');
    const data = await res.json();
    setFondos(data);
  };

  useEffect(() => {
    fetchFondos();
  }, []);

  const handleSubirFondo = async () => {
    if (!archivo) return toast.error('Selecciona un archivo');

    const formData = new FormData();
    formData.append('file', archivo);
    setSubiendo(true);

    const res = await fetch('/api/fondos', {
      method: 'POST',
      body: formData,
    });

    setSubiendo(false);

    if (res.ok) {
      toast.success('Fondo subido correctamente');
      setArchivo(null);
      fetchFondos();
    } else {
      toast.error('Error al subir el fondo');
    }
  };

  return (
    <div className="p-8 bg-[#F6FFEC] min-h-screen">
      <h1 className="text-3xl font-bold text-[#1F1F1F] mb-6">Gestión de Fondos para Carteles</h1>

      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <label className="block text-gray-700 font-semibold mb-2">Selecciona un fondo nuevo (.jpg, .png):</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setArchivo(e.target.files?.[0] || null)}
          className="mb-4"
        />
        <Button onClick={handleSubirFondo} disabled={subiendo}>
          {subiendo ? 'Subiendo...' : 'Subir Fondo'}
        </Button>
      </div>

      <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">Fondos disponibles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {fondos.map((url, index) => (
          <div key={index} className="bg-white shadow rounded p-2">
            <Image src={url} alt={`Fondo ${index + 1}`} width={400} height={200} className="rounded" />
            <p className="text-center text-sm mt-2 break-all">{url}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
