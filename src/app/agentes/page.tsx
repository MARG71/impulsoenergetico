// Nuevo diseño de Agentes con estilo Impulso Energético
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Agente {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
}

export default function AgentesPage() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [agenteEditando, setAgenteEditando] = useState<Agente | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/agentes').then(res => res.json()).then(setAgentes);
  }, []);

  const crearAgente = async () => {
    const res = await fetch('/api/agentes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono }),
    });

    if (res.ok) {
      const nuevo = await res.json();
      setAgentes([...agentes, nuevo]);
      setNombre('');
      setEmail('');
      setTelefono('');
      toast.success('Agente creado correctamente');
    } else {
      toast.error('Error al crear agente');
    }
  };

  const eliminarAgente = async (id: number) => {
    const res = await fetch(`/api/agentes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAgentes(agentes.filter(a => a.id !== id));
      toast.success('Agente eliminado');
    } else {
      toast.error('Error al eliminar agente');
    }
  };

  const guardarCambios = async () => {
    if (!agenteEditando) return;
    const { id, nombre, email, telefono } = agenteEditando;

    const res = await fetch(`/api/agentes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono }),
    });

    if (res.ok) {
      const actualizado = await res.json();
      setAgentes(agentes.map(a => (a.id === actualizado.id ? actualizado : a)));
      setAgenteEditando(null);
      toast.success('Agente actualizado');
    } else {
      toast.error('Error al actualizar');
    }
  };

  return (
    <div className="p-6 bg-[#68B84B] min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Registrar Agente</h1>

      <div className="bg-[#F0F0F0] p-6 rounded-xl shadow w-full mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-black">Nombre</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} className="bg-white text-black" />
          </div>
          <div>
            <Label className="text-black">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white text-black" />
          </div>
          <div>
            <Label className="text-black">Teléfono</Label>
            <Input value={telefono} onChange={e => setTelefono(e.target.value)} className="bg-white text-black" />
          </div>
        </div>

        <Button className="mt-6 bg-[#1F1F1F] text-white hover:bg-black" onClick={crearAgente}>Registrar</Button>
      </div>

      <div className="bg-[#DDEFD4] p-4 rounded-xl shadow">
        <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">Agentes registrados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-[#F0C300] text-white">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Teléfono</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {agentes.map(a => (
                <tr key={a.id} className="text-black text-center">
                  <td className="border px-4 py-2">{a.id}</td>
                  <td className="border px-4 py-2">{a.nombre}</td>
                  <td className="border px-4 py-2">{a.email}</td>
                  <td className="border px-4 py-2">{a.telefono || '-'}</td>
                  <td className="border px-4 py-2 space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 text-white hover:bg-blue-800" onClick={() => setAgenteEditando(a)}>Editar</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-[#F3F8F1] rounded-xl shadow-lg p-6">
                        <DialogHeader>
                          <DialogTitle className="text-[#1F1F1F] text-xl font-bold">Editar Agente</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div>
                            <Label className="text-[#1F1F1F]">Nombre</Label>
                            <Input value={agenteEditando?.nombre || ''} onChange={e => setAgenteEditando(prev => prev ? { ...prev, nombre: e.target.value } : null)} />
                          </div>
                          <div>
                            <Label className="text-[#1F1F1F]">Email</Label>
                            <Input value={agenteEditando?.email || ''} onChange={e => setAgenteEditando(prev => prev ? { ...prev, email: e.target.value } : null)} />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-[#1F1F1F]">Teléfono</Label>
                            <Input value={agenteEditando?.telefono || ''} onChange={e => setAgenteEditando(prev => prev ? { ...prev, telefono: e.target.value } : null)} />
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                          <Button className="bg-[#28a745] text-white hover:bg-[#218838] px-6 py-2 rounded-lg" onClick={guardarCambios}>
                            Guardar cambios
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Link href={`/agentes/${a.id}/detalle`}>
                      <Button className="bg-yellow-500 text-white hover:bg-yellow-600">Ver Detalle</Button>
                    </Link>
                    <Button className="bg-red-500 text-white hover:bg-red-700" onClick={() => eliminarAgente(a.id)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
