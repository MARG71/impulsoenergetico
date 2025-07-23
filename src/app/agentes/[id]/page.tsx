'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EditarAgente() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarAgente = async () => {
      const res = await fetch(`/api/agentes/${id}`);
      const data = await res.json();
      setNombre(data.nombre);
      setEmail(data.email);
      setTelefono(data.telefono || '');
      setCargando(false);
    };
    cargarAgente();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/agentes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono }),
    });

    if (res.ok) {
      toast.success('Agente actualizado correctamente');
      router.push('/agentes');
    } else {
      toast.error('Error al actualizar agente');
    }
  };

  if (cargando) return <p className="text-center text-gray-600">Cargando...</p>;

  return (
    <div className="p-6 min-h-screen bg-[#68B84B] flex justify-center items-start">
      <div className="bg-[#F0F0F0] p-8 rounded-xl shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-[#1F1F1F]">Editar Agente</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label className="text-black">Nombre</Label>
            <Input
              type="text"
              className="bg-white text-black"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-black">Email</Label>
            <Input
              type="email"
              className="bg-white text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="text-black">Teléfono</Label>
            <Input
              type="text"
              className="bg-white text-black"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <Button type="submit" className="bg-green-600 text-white hover:bg-green-800">
            Guardar Cambios
          </Button>
        </form>
      </div>
    </div>
  );
}
