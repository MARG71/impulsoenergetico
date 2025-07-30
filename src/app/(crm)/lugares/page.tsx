'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

type Fondo = {
  id: number;
  nombre: string;
  url: string;
  activo?: boolean;
};

export default function RegistrarLugar() {
  const router = useRouter();
  const sessionData = useSession();
  const session = sessionData?.data;
  const esAdmin = session?.user?.role === 'ADMIN';

  const [agentes, setAgentes] = useState<any[]>([]);
  const [lugares, setLugares] = useState<any[]>([]);
  const [codigoQR, setCodigoQR] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [lugarEditando, setLugarEditando] = useState<any | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [fondos, setFondos] = useState<Fondo[]>([]);
  const [fondoSeleccionado, setFondoSeleccionado] = useState<string>('');
  const [nuevoLugar, setNuevoLugar] = useState({ nombre: '', direccion: '', qrCode: '', agenteId: '' });

  useEffect(() => {
    const fetchData = async () => {
      const [resAgentes, resLugares, resFondos] = await Promise.all([
        fetch('/api/agentes'),
        fetch('/api/lugares'),
        fetch('/api/fondos'),
      ]);

      const [dataAgentes, dataLugares, dataFondos] = await Promise.all([
        resAgentes.json(),
        resLugares.json(),
        resFondos.json(),
      ]);

      setAgentes(dataAgentes);
      setLugares(dataLugares);
      setFondos(dataFondos);

      const activo = dataFondos.find((f: Fondo) => f.activo);
      if (activo) setFondoSeleccionado(activo.url);
    };

    fetchData();
  }, []);

  const generarQR = () => {
    const nuevoQR = uuidv4();
    setCodigoQR(nuevoQR);
    setNuevoLugar({ ...nuevoLugar, qrCode: nuevoQR });
  };

  const generarQRModal = () => {
    const nuevoQR = uuidv4();
    setLugarEditando({ ...lugarEditando, qrCode: nuevoQR });
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este lugar?')) return;
    await fetch(`/api/lugares/${id}`, { method: 'DELETE' });
    setLugares(lugares.filter((l) => l.id !== id));
  };

  const handleGuardarEdicion = async () => {
    if (!lugarEditando) return;
    await fetch(`/api/lugares/${lugarEditando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lugarEditando),
    });
    setLugares(lugares.map((l) => (l.id === lugarEditando.id ? lugarEditando : l)));
    setLugarEditando(null);
    setMostrarModal(false);
  };

  const handleRegistrarLugar = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/lugares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoLugar),
    });
    const data = await res.json();
    setLugares([...lugares, data]);
    setNuevoLugar({ nombre: '', direccion: '', qrCode: '', agenteId: '' });
    setCodigoQR('');
  };

  const handleSeleccionarFondo = async (url: string) => {
    if (!esAdmin) return;
    await fetch('/api/fondos/seleccionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    setFondoSeleccionado(url);
  };

  const lugaresFiltrados = lugares.filter((lugar) => {
    const texto = `${lugar.id} ${lugar.nombre} ${lugar.direccion} ${lugar.qrCode} ${lugar.agente?.nombre}`;
    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div className="p-8 bg-[#B3E58C] min-h-screen">
      <h1 className="text-3xl font-bold text-[#1F1F1F] mb-6">Registrar Lugar</h1>

      {/* Formulario registrar lugar */}
      <form onSubmit={handleRegistrarLugar} className="bg-[#F6FFEC] p-6 rounded-xl shadow-md space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Nombre del lugar" value={nuevoLugar.nombre} onChange={(e) => setNuevoLugar({ ...nuevoLugar, nombre: e.target.value })} className="bg-white text-black" />
          <Input placeholder="Dirección" value={nuevoLugar.direccion} onChange={(e) => setNuevoLugar({ ...nuevoLugar, direccion: e.target.value })} className="bg-white text-black" />
        </div>
        <div className="flex items-center gap-4">
          <Button type="button" onClick={generarQR} className="bg-blue-600 hover:bg-blue-700 text-white">Generar QR</Button>
          {codigoQR && <QRCode value={`https://impulsoenergetico.es/comparador?qr=${codigoQR}`} size={64} />}
        </div>
        <select className="w-full border px-4 py-2 rounded bg-white text-black" value={nuevoLugar.agenteId} onChange={(e) => setNuevoLugar({ ...nuevoLugar, agenteId: e.target.value })}>
          <option value="">Selecciona un agente</option>
          {agentes.map((agente) => (
            <option key={agente.id} value={agente.id}>{agente.nombre}</option>
          ))}
        </select>
        <Button type="submit" className="bg-[#68B84B] hover:bg-green-700 text-white w-full">Registrar Lugar</Button>
      </form>

      {/* Fondos disponibles */}
      <div className="mt-10 bg-[#D4FFD0] p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">🎨 Fondo actual del cartel</h2>

        {esAdmin ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fondos.map((fondo) => (
                <div key={fondo.id} onClick={() => handleSeleccionarFondo(fondo.url)} className={`cursor-pointer border-4 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 ${fondo.url === fondoSeleccionado ? 'border-blue-600' : 'border-transparent'}`}>
                  <Image src={fondo.url} alt={fondo.nombre} width={350} height={220} className="object-cover w-full h-36" />
                  <div className="bg-white py-1 text-center font-medium text-black">{fondo.nombre}</div>
                </div>
              ))}
            </div>
            {fondoSeleccionado && (
              <div className="mt-4">
                <p className="font-semibold text-[#1F1F1F]">Vista previa del fondo actual:</p>
                <Image src={fondoSeleccionado} alt="Fondo seleccionado" width={700} height={460} className="rounded-lg mt-2 border" />
              </div>
            )}
          </>
        ) : (
          fondoSeleccionado && (
            <div className="text-center">
              <Image src={fondoSeleccionado} alt="Fondo actual" width={700} height={460} className="rounded-lg border mx-auto" />
            </div>
          )
        )}
      </div>

      {/* Tabla de lugares */}
      <div className="mt-10 bg-[#E5FFD5] p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-4 text-[#1F1F1F]">Lugares Registrados</h2>
        <Input placeholder="Buscar por cualquier campo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="mb-4 bg-white text-black" />
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F0C300] text-black">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Nombre</th>
                <th className="p-2">Dirección</th>
                <th className="p-2">Agente</th>
                <th className="p-2">QR</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lugaresFiltrados.map((lugar) => (
                <tr key={lugar.id} className="border-b hover:bg-[#f9f9f9]">
                  <td className="p-2 font-semibold text-black">#{lugar.id}</td>
                  <td className="p-2 text-black">{lugar.nombre}</td>
                  <td className="p-2 text-black">{lugar.direccion}</td>
                  <td className="p-2 text-black">{lugar.agente?.nombre || '-'}</td>
                  <td className="p-2 text-xs break-all text-black">{lugar.qrCode}</td>
                  <td className="p-2 flex flex-col md:flex-row gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setLugarEditando(lugar); setMostrarModal(true); }}>Editar</Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleEliminar(lugar.id)}>Eliminar</Button>
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => router.push(`/lugares/cartel/${lugar.id}`)}>Generar cartel</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Lugar</DialogTitle></DialogHeader>
          {lugarEditando && (
            <div className="space-y-4">
              <Input placeholder="Nombre" value={lugarEditando.nombre} onChange={(e) => setLugarEditando({ ...lugarEditando, nombre: e.target.value })} className="text-black" />
              <Input placeholder="Dirección" value={lugarEditando.direccion} onChange={(e) => setLugarEditando({ ...lugarEditando, direccion: e.target.value })} className="text-black" />
              <div className="flex items-center gap-4">
                <Button onClick={generarQRModal} className="bg-blue-600 text-white">Generar QR</Button>
                {lugarEditando.qrCode && <QRCode value={`https://impulsoenergetico.es/comparador?qr=${lugarEditando.qrCode}`} size={64} />}
              </div>
              <select className="w-full border px-4 py-2 rounded bg-white text-black" value={lugarEditando.agenteId} onChange={(e) => setLugarEditando({ ...lugarEditando, agenteId: e.target.value })}>
                <option value="">Selecciona un agente</option>
                {agentes.map((agente) => (
                  <option key={agente.id} value={agente.id}>{agente.nombre}</option>
                ))}
              </select>
              <Button onClick={handleGuardarEdicion} className="bg-[#68B84B] hover:bg-green-700 text-white w-full">Guardar Cambios</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
