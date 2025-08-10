// src/app/(crm)/agentes/ID/DETALLE/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const fmtPct = (v: any) =>
  v == null ? '—' : `${(Number(v) * 100).toFixed(1)}%`;

const fmtDate = (s?: string) => {
  if (!s) return '—';
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function DetalleAgente() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [agente, setAgente] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const fetchAgente = async () => {
      const res = await fetch(`/api/agentes/${id}/detalle`);
      const data = await res.json();
      setAgente(data);
      setCargando(false);
    };
    if (id) fetchAgente();
  }, [id]);

  if (cargando) return <p className="text-center text-gray-600">Cargando...</p>;
  if (!agente) return <p className="text-center text-red-600">Agente no encontrado</p>;

  const comparativasFiltradas = (agente.comparativas ?? []).filter((comp: any) => {
    const texto = `${comp.id} ${comp.tipoServicio} ${comp.tipoTarifa} ${comp.nombreTarifa} ${comp.importeFactura} ${comp.cliente?.nombre} ${comp.lugar?.nombre}`;
    return normalizarTexto(texto).includes(normalizarTexto(busqueda));
  });

  const lugaresFiltrados = (agente.lugares ?? []).filter((lugar: any) => {
    const texto = `${lugar.nombre} ${lugar.direccion}`;
    return normalizarTexto(texto).includes(normalizarTexto(busqueda));
  });

  const usuariosFiltrados = (agente.usuarios ?? []).filter((user: any) => {
    const texto = `${user.nombre} ${user.email} ${user.rol}`;
    return normalizarTexto(texto).includes(normalizarTexto(busqueda));
  });

  const leadsFiltrados = (agente.leads ?? []).filter((lead: any) => {
    const texto = `${lead.nombre} ${lead.email} ${lead.telefono} ${lead.estado} ${lead.lugar?.nombre}`;
    return normalizarTexto(texto).includes(normalizarTexto(busqueda));
  });

  return (
    <div className="p-6 bg-[#68B84B] min-h-screen">
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
          <span className="hidden md:inline text-white/90">CRM · Detalle de agente</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/agentes')} className="bg-[#68B84B] text-white hover:bg-green-700">
            ⬅ Volver a agentes
          </Button>
          <Button onClick={() => router.push('/dashboard')} className="bg-[#F0C300] text-black hover:bg-yellow-400">
            🏠 Dashboard
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Detalle del Agente</h1>

      {/* INFO GENERAL — forzamos texto oscuro para contraste */}
      <div className="bg-[#FFE0B2] text-[#1F1F1F] p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold mb-4">🧾 Información General del Agente</h2>
        <p><strong>Nombre:</strong> {agente.nombre}</p>
        <p><strong>Email:</strong> {agente.email}</p>
        <p><strong>Teléfono:</strong> {agente.telefono || '-'}</p>
        <p><strong>% Agente:</strong> {fmtPct(agente.pctAgente)}</p>
      </div>

      {/* USUARIOS VINCULADOS */}
      <div className="bg-[#D0F0C0] text-[#1F1F1F] p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold mb-4">📇 Datos del Usuario Vinculado</h2>

        <Input
          placeholder="🔍 Buscar por nombre, email o rol..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 w-full bg-white text-black"
        />

        {usuariosFiltrados.length > 0 ? (
          usuariosFiltrados.map((user: any) => {
            const lugarNombre = (agente.lugares ?? []).find((l: any) => l.id === user.lugarId)?.nombre || '-';
            return (
              <div key={user.id} className="grid md:grid-cols-2 gap-4 border p-4 rounded bg-[#FFFCF0] text-[#1F1F1F] mb-4">
                <div>
                  <p><strong>Nombre:</strong> {user.nombre}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Rol:</strong> {user.rol}</p>
                </div>
                <div>
                  <p><strong>Contraseña (hashed):</strong> {user.password}</p>
                  <p><strong>Agente:</strong> {agente.nombre}</p>
                  <p><strong>Lugar:</strong> {lugarNombre}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-700">No hay usuarios vinculados.</p>
        )}
      </div>

      {/* LUGARES ASIGNADOS — añadimos % y texto oscuro */}
      <div className="bg-white text-[#1F1F1F] p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold mb-4">📍 Lugares asignados</h2>

        <Input
          placeholder="🔍 Buscar por nombre o dirección..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 w-full bg-white text-black"
        />

        {lugaresFiltrados.length === 0 ? (
          <p>No hay lugares asignados.</p>
        ) : (
          <table className="w-full border-collapse bg-[#FFF6E0] rounded-xl">
            <thead>
              <tr className="bg-[#F0C300] text-left text-black">
                <th className="p-2">ID</th>
                <th className="p-2">Nombre</th>
                <th className="p-2">Dirección</th>
                <th className="p-2">% Cliente</th>
                <th className="p-2">% Lugar</th>
                <th className="p-2">Acción</th>
              </tr>
            </thead>
            <tbody className="text-[#1F1F1F]">
              {lugaresFiltrados.map((lugar: any) => (
                <tr key={lugar.id} className="border-b hover:bg-[#f6f6f6]">
                  <td className="p-2 font-semibold">#{lugar.id}</td>
                  <td className="p-2">{lugar.nombre}</td>
                  <td className="p-2">{lugar.direccion}</td>
                  <td className="p-2">{fmtPct(lugar.pctCliente)}</td>
                  <td className="p-2">{fmtPct(lugar.pctLugar)}</td>
                  <td className="p-2">
                    <Button
                      onClick={() => router.push(`/lugares/${lugar.id}/detalle`)}
                      className="bg-[#68B84B] text-white hover:bg-green-700"
                    >
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* COMPARATIVAS — forzamos texto oscuro en filas */}
      <div className="bg-white text-[#1F1F1F] p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold mb-4">📊 Comparativas</h2>

        <Input
          placeholder="🔍 Buscar por tipo, tarifa, cliente o lugar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 w-full bg-white text-black"
        />

        {comparativasFiltradas.length === 0 ? (
          <p>No hay comparativas asociadas.</p>
        ) : (
          <table className="w-full border-collapse bg-[#FFF6E0] rounded-xl">
            <thead>
              <tr className="bg-[#F0C300] text-left text-black">
                <th className="p-2">ID</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Tarifa</th>
                <th className="p-2">Importe</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Lugar</th>
                <th className="p-2">Acción</th>
              </tr>
            </thead>
            <tbody className="text-[#1F1F1F]">
              {comparativasFiltradas.map((comp: any) => (
                <tr key={comp.id} className="border-b hover:bg-[#f6f6f6]">
                  <td className="p-2 font-semibold">#{comp.id}</td>
                  <td className="p-2">{comp.tipoServicio}</td>
                  <td className="p-2">{comp.nombreTarifa}</td>
                  <td className="p-2">{comp.importeFactura} €</td>
                  <td className="p-2">{comp.cliente?.nombre || '-'}</td>
                  <td className="p-2">{comp.lugar?.nombre || '-'}</td>
                  <td className="p-2">
                    <Button onClick={() => router.push(`/comparador?id=${comp.id}`)} className="bg-[#68B84B] text-white hover:bg-green-700">
                      Cargar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* LEADS — NUEVA SECCIÓN */}
      {/* LEADS — SIMPLIFICADO */}
      <div className="bg-white text-[#1F1F1F] p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">🧲 Leads del agente</h2>

        <Input
          placeholder="🔍 Buscar por nombre, email, teléfono o lugar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 w-full bg-white text-black"
        />

        {leadsFiltrados.length === 0 ? (
          <p>No hay leads asignados.</p>
        ) : (
          <table className="w-full border-collapse bg-[#FFF6E0] rounded-xl">
            <thead>
              <tr className="bg-[#F0C300] text-left text-black">
                <th className="p-2">Nombre</th>
                <th className="p-2">Email</th>
                <th className="p-2">Teléfono</th>
                <th className="p-2">Lugar</th>
              </tr>
            </thead>
            <tbody className="text-[#1F1F1F]">
              {leadsFiltrados.map((lead: any) => (
                <tr key={lead.id} className="border-b hover:bg-[#f6f6f6]">
                  <td className="p-2">{lead.nombre}</td>
                  <td className="p-2">{lead.email}</td>
                  <td className="p-2">{lead.telefono}</td>
                  <td className="p-2">{lead.lugar?.nombre || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

function normalizarTexto(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
