'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password?: string;
  rol: 'ADMIN' | 'AGENTE' | 'LUGAR';
  agenteId?: number;
  lugarId?: number;
}

interface Agente {
  id: number;
  nombre: string;
}

interface Lugar {
  id: number;
  nombre: string;
}

export default function CrearUsuarioPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'ADMIN' | 'AGENTE' | 'LUGAR'>('LUGAR');
  const [agenteId, setAgenteId] = useState<number | undefined>();
  const [lugarId, setLugarId] = useState<number | undefined>();
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  useEffect(() => {
    fetch('/api/usuarios').then(res => res.json()).then(setUsuarios);
    fetch('/api/agentes').then(res => res.json()).then(setAgentes);
    fetch('/api/lugares').then(res => res.json()).then(setLugares);
  }, []);

  const crearUsuario = async () => {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, rol, agenteId, lugarId }),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setUsuarios([...usuarios, nuevo]);
      setNombre('');
      setEmail('');
      setPassword('');
      setRol('LUGAR');
      setAgenteId(undefined);
      setLugarId(undefined);
      toast.success('Usuario creado correctamente');
    } else {
      toast.error('Error al crear usuario');
    }
  };

  const eliminarUsuario = async (id: number) => {
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsuarios(usuarios.filter(u => u.id !== id));
      toast.success('Usuario eliminado');
    } else {
      toast.error('Error al eliminar');
    }
  };

  const guardarCambios = async () => {
    if (!usuarioEditando) return;

    const { id, nombre, email, rol, agenteId, lugarId, password } = usuarioEditando;

    const datosActualizados: any = {
      nombre,
      email,
      rol,
      agenteId: agenteId || null,
      lugarId: lugarId || null,
    };

    if (password && password.trim() !== "") {
      datosActualizados.password = password;
    }

    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosActualizados),
    });

    if (res.ok) {
      const actual = await res.json();
      setUsuarios(usuarios.map(x => (x.id === actual.id ? actual : x)));
      setUsuarioEditando(null);
      toast.success('Usuario actualizado');
    } else {
      toast.error('Error al actualizar');
    }
  };

  return (
    <div className="p-6 bg-[#68B84B] min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Crear Usuario</h1>

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
            <Label className="text-black">Contraseña</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-white text-black" />
          </div>
          <div>
            <Label className="text-black">Rol</Label>
            <Select value={rol} onValueChange={setRol}>
              <SelectTrigger className="bg-white text-black">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="AGENTE">AGENTE</SelectItem>
                <SelectItem value="LUGAR">LUGAR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-black">Agente</Label>
            <Select value={agenteId?.toString()} onValueChange={v => setAgenteId(Number(v))}>
              <SelectTrigger className="bg-white text-black">
                <SelectValue placeholder="Selecciona un agente" />
              </SelectTrigger>
              <SelectContent>
                {agentes.map(a => (
                  <SelectItem key={a.id} value={a.id.toString()}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-black">Lugar</Label>
            <Select value={lugarId?.toString()} onValueChange={v => setLugarId(Number(v))}>
              <SelectTrigger className="bg-white text-black">
                <SelectValue placeholder="Selecciona un lugar" />
              </SelectTrigger>
              <SelectContent>
                {lugares.map(l => (
                  <SelectItem key={l.id} value={l.id.toString()}>{l.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="mt-6 bg-[#1F1F1F] text-white hover:bg-black" onClick={crearUsuario}>Crear</Button>
      </div>

      <div className="bg-[#DDEFD4] p-4 rounded-xl shadow">
        <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">Usuarios registrados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-[#F0C300] text-white">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Rol</th>
                <th className="px-4 py-2">Agente</th>
                <th className="px-4 py-2">Lugar</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="text-black text-center">
                  <td className="border px-4 py-2">{u.id}</td>
                  <td className="border px-4 py-2">{u.nombre}</td>
                  <td className="border px-4 py-2">{u.email}</td>
                  <td className="border px-4 py-2">{u.rol}</td>
                  <td className="border px-4 py-2">{u.agenteId ?? '-'}</td>
                  <td className="border px-4 py-2">{u.lugarId ?? '-'}</td>
                  <td className="border px-4 py-2 space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 text-white hover:bg-blue-800" onClick={() => setUsuarioEditando(u)}>Editar</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl bg-[#F3F8F1] rounded-xl shadow-lg p-6">
                        <DialogHeader>
                          <DialogTitle className="text-[#1F1F1F] text-xl font-bold">Editar Usuario</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div>
                            <Label className="text-[#1F1F1F]">Nombre</Label>
                            <Input value={usuarioEditando?.nombre || ''} onChange={e => setUsuarioEditando(prev => prev ? { ...prev, nombre: e.target.value } : null)} />
                          </div>
                          <div>
                            <Label className="text-[#1F1F1F]">Email</Label>
                            <Input value={usuarioEditando?.email || ''} onChange={e => setUsuarioEditando(prev => prev ? { ...prev, email: e.target.value } : null)} />
                          </div>
                          <div>
                            <Label className="text-[#1F1F1F]">Rol</Label>
                            <Select value={usuarioEditando?.rol || 'LUGAR'} onValueChange={v => setUsuarioEditando(prev => prev ? { ...prev, rol: v as Usuario['rol'] } : null)}>
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                <SelectItem value="AGENTE">AGENTE</SelectItem>
                                <SelectItem value="LUGAR">LUGAR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[#1F1F1F]">Agente</Label>
                            <Select value={usuarioEditando?.agenteId?.toString()} onValueChange={v => setUsuarioEditando(prev => prev ? { ...prev, agenteId: Number(v) } : null)}>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Selecciona un agente" />
                              </SelectTrigger>
                              <SelectContent>
                                {agentes.map(a => (
                                  <SelectItem key={a.id} value={a.id.toString()}>{a.nombre}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[#1F1F1F]">Lugar</Label>
                            <Select value={usuarioEditando?.lugarId?.toString()} onValueChange={v => setUsuarioEditando(prev => prev ? { ...prev, lugarId: Number(v) } : null)}>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Selecciona un lugar" />
                              </SelectTrigger>
                              <SelectContent>
                                {lugares.map(l => (
                                  <SelectItem key={l.id} value={l.id.toString()}>{l.nombre}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[#1F1F1F]">Contraseña (solo si deseas cambiarla)</Label>
                            <Input type="password" onChange={e => setUsuarioEditando(prev => prev ? { ...prev, password: e.target.value } : null)} />
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                          <Button className="bg-[#28a745] text-white hover:bg-[#218838] px-6 py-2 rounded-lg" onClick={guardarCambios}>
                            Guardar cambios
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button className="bg-red-500 text-white hover:bg-red-700" onClick={() => eliminarUsuario(u.id)}>Eliminar</Button>
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