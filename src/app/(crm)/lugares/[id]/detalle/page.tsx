'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const fmtPct = (v: any) => (v == null ? '—' : `${(Number(v) * 100).toFixed(1)}%`);

export default function DetalleLugar() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [lugar, setLugar] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const fetchLugar = async () => {
      const res = await fetch(`/api/lugares/${id}/detalle`);
      const data = await res.json();
      setLugar(data);
      setCargando(false);
    };
    if (id) fetchLugar();
  }, [id]);

  if (cargando) return <p className="text-center text-gray-600">Cargando...</p>;
  if (!lugar) return <p className="text-center text-red-600">Lugar no encontrado</p>;

  const usuariosFiltrados = (lugar.usuarios ?? []).filter((u: any) => {
    const txt = `${u.nombre} ${u.email} ${u.rol}`;
    return txt.toLowerCase().includes(busqueda.toLowerCase());
  });

  const leadsFiltrados = (lugar.leads ?? []).filter((l: any) => {
    const txt = `${l.nombre} ${l.email} ${l.telefono} ${l.estado}`;
    return txt.toLowerCase().includes(busqueda.toLowerCase());
  });

  const comparativasFiltradas = (lugar.comparativas ?? []).filter((c: any) => {
    const txt = `${c.id} ${c.tipoServicio} ${c.nombreTarifa} ${c.cliente?.nombre} ${c.agente?.nombre}`;
    return txt.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div className="p-6 bg-[#E0F7FA] min-h-screen">
      {/* Header con logo y navegación */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
            alt="Impulso Energético"
            width={160}
            height={48}
            priority
          />
          <span className="hidden md:inline text-[#1F1F1F]">CRM · Detalle de lugar</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/lugares')} className="bg-[#68B84B] text-white hover:bg-green-700">
            ⬅ Volver a lugares
          </Button>
          <Button onClick={() => router.push('/dashboard')} className="bg-[#F0C300] text-black hover:bg-yellow-400">
            🏠 Dashboard
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[#1F1F1F] mb-4">Detalle del Lugar</h1>

      {/* INFO GENERAL */}
      <div className="bg-white p-6 rounded-xl shadow mb-8 text-[#1F1F1F]">
        <div className="grid md:grid-cols-2 gap-4">
          <p><strong>Nombre:</strong> {lugar.nombre}</p>
          <p><strong>Dirección:</strong> {lugar.direccion}</p>
          <p><strong>QR Code:</strong> {lugar.qrCode}</p>
          <p><strong>Agente:</strong> {lugar.agente?.nombre || '-'}</p>
          <p><strong>% Cliente:</strong> {fmtPct(lugar.pctCliente)}</p>
          <p><strong>% Lugar:</strong> {fmtPct(lugar.pctLugar)}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => router.push(`/lugares/cartel/${lugar.id}`)} className="bg-orange-500 text-white hover:bg-orange-600">Generar cartel</Button>
          {lugar.agenteId && (
            <Button onClick={() => router.push(`/agentes/${lugar.agenteId}/detalle`)} className="bg-blue-600 text-white hover:bg-blue-700">
              Ver agente
            </Button>
          )}
        </div>
      </div>

      {/* BUSCADOR GLOBAL */}
      <Input
        placeholder="🔍 Buscar en usuarios, leads y comparativas..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-4 w-full bg-white text-black"
      />

      {/* USUARIOS */}
      <div className="bg-[#F7FFF4] p-6 rounded-xl shadow mb-8 text-[#1F1F1F]">
        <h2 className="text-xl font-bold mb-4">👥 Usuarios vinculados</h2>
        {usuariosFiltrados.length === 0 ? (
          <p>No hay usuarios vinculados a este lugar.</p>
        ) : (
          <table className="w-full border-collapse bg-white rounded-xl">
            <thead>
              <tr className="bg-[#F0C300] text-left text-black">
                <th className="p-2">Nombre</th>
                <th className="p-2">Email</th>
                <th className="p-2">Rol</th>
              </tr>
            </thead>
            <tbody className="text-[#1F1F1F]">
              {usuariosFiltrados.map((u: any) => (
                <tr key={u.id} className="border-b hover:bg-[#f6f6f6]">
                  <td className="p-2">{u.nombre}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.rol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* LEADS */}
      <div className="bg-white p-6 rounded-xl shadow mb-8 text-[#1F1F1F]">
        <h2 className="text-xl font-bold mb-4">🧲 Leads del lugar</h2>
        {leadsFiltrados.length === 0 ? (
          <p>No hay leads en este lugar.</p>
        ) : (
          <table className="w-full border-collapse bg-[#FFF6E0] rounded-xl">
            <thead>
              <tr className="bg-[#F0C300] text-left text-black">
                <th className="p-2">Nombre</th>
                <th className="p-2">Email</th>
                <th className="p-2">Teléfono</th>
                <th className="p-2">Estado</th>
              </tr>
            </thead>
            <tbody className="text-[#1F1F1F]">
              {leadsFiltrados.map((l: any) => (
                <tr key={l.id} className="border-b hover:bg-[#f6f6f6]">
                  <td className="p-2">{l.nombre}</td>
                  <td className="p-2">{l.email}</td>
                  <td className="p-2">{l.telefono}</td>
                  <td className="p-2">{l.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* COMPARATIVAS */}
      <div className="bg-white p-6 rounded-xl shadow text-[#1F1F1F]">
        <h2 className="text-xl font-bold mb-4">📊 Comparativas</h2>
        {comparativasFiltradas.length === 0 ? (
          <p>No hay comparativas asociadas al lugar.</p>
        ) : (
          <table className="w-full border-collapse bg-[#FFF6E0] rounded-xl">
            <thead>
              <tr className="bg-[#F0C300] text-left text-black">
                <th className="p-2">ID</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Tarifa</th>
                <th className="p-2">Importe</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Agente</th>
              </tr>
            </thead>
            <tbody className="text-[#1F1F1F]">
              {comparativasFiltradas.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-[#f6f6f6]">
                  <td className="p-2 font-semibold">#{c.id}</td>
                  <td className="p-2">{c.tipoServicio}</td>
                  <td className="p-2">{c.nombreTarifa}</td>
                  <td className="p-2">{c.importeFactura} €</td>
                  <td className="p-2">{c.cliente?.nombre || '-'}</td>
                  <td className="p-2">{c.agente?.nombre || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
