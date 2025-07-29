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
    formData.append('upload_preset', 'impulso_carteles'); // tu preset Cloudinary

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
      <h1 className="text-3xl font-bold text-[#004AAD] mb-10">🎨 Gestión de Fondos para Carteles</h1>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-10 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold text-[#1F1F1F] mb-4">Subir nuevo fondo</h2>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecciona un fondo (.jpg, .png):
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setArchivo(e.target.files?.[0] || null)}
          className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#004AAD] file:text-white hover:file:bg-[#00368A] mb-4"
        />

        <Button onClick={handleSubirFondo} disabled={subiendo} className="w-full">
          {subiendo ? 'Subiendo...' : 'Subir Fondo'}
        </Button>
      </div>

      <h2 className="text-2xl font-bold text-[#004AAD] mb-6">🖼️ Fondos disponibles</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {fondos.map((url, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition duration-300"
          >
            <Image
              src={url}
              alt={`Fondo ${index + 1}`}
              width={600}
              height={400}
              className="w-full h-64 object-cover"
            />
            <div className="p-3 text-center bg-[#F9FAFB]">
              <p className="text-xs text-gray-600 break-words">{url}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
