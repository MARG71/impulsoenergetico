// src/app/(crm)/agentes/ID/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';


// helper
const toPct = (v: string) => {
  const n = Number((v ?? '').replace(',', '.'));
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n;
};

export default function EditarAgente() {
  const router = useRouter();
  const params = useParams() as { id: string };
  const { id } = params;

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pctAgente, setPctAgente] = useState(''); // ← NUEVO
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarAgente = async () => {
      const res = await fetch(`/api/agentes/${id}`);
      const data = await res.json();
      setNombre(data.nombre);
      setEmail(data.email);
      setTelefono(data.telefono || '');
      setPctAgente(data.pctAgente != null ? String(Number(data.pctAgente) * 100) : ''); // ← init %
      setCargando(false);
    };
    if (id) cargarAgente();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/agentes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono, pctAgente: toPct(pctAgente) }), // ← añadido
    });

    if (res.ok) {
      toast.success('Agente actualizado correctamente');
      router.push('/agentes');
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error || 'Error al actualizar agente');
    }
  };

  if (cargando) return <p className="text-center text-gray-600">Cargando...</p>;

  return (
    <div className="p-6 min-h-screen bg-[#68B84B] flex justify-center items-start">
      <div className="mb-6 w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
            alt="Impulso Energético"
            width={160}
            height={48}
            priority
          />
          <span className="hidden md:inline text-white/90">CRM · Editar agente</span>
        </div>
        <div className="flex gap-2">
          <Link href="/agentes">
            <Button className="bg-[#68B84B] text-white hover:bg-green-700">⬅ Volver a agentes</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-[#F0C300] text-black hover:bg-yellow-400">🏠 Dashboard</Button>
          </Link>
        </div>
      </div>

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
          <div>{/* NUEVO */}
            <Label className="text-black">% Agente</Label>
            <Input
              type="number"
              step="0.01"
              className="bg-white text-black"
              placeholder="ej. 15 o 0.15"
              value={pctAgente}
              onChange={(e) => setPctAgente(e.target.value)}
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
