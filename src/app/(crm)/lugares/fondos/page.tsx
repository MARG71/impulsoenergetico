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
    setSubiendo(true);

    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('upload_preset', 'impulso_carteles'); // tu preset de Cloudinary

    try {
      const cloudinaryRes = await fetch('https://api.cloudinary.com/v1_1/dhkzxihjg/image/upload', {
        method: 'POST',
        body: formData,
      });

      const cloudinaryData = await cloudinaryRes.json();

      if (!cloudinaryData.secure_url) {
        throw new Error('Error en la subida a Cloudinary');
      }

      const apiRes = await fetch('/api/fondos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: archivo.name,
          url: cloudinaryData.secure_url,
        }),
      });

      if (!apiRes.ok) throw new Error('Error al guardar en base de datos');

      toast.success('Fondo subido correctamente');
      setArchivo(null);
      fetchFondos();
    } catch (error) {
      console.error(error);
      toast.error('Error al subir el fondo');
    } finally {
      setSubiendo(false);
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
          className="mb-4 text-black" // <-- Soluciona el texto blanco sobre blanco
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
