// src/app/(crm)/agentes/ID/DETALLE/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  const comparativasFiltradas = agente.comparativas.filter((comp: any) => {
    const texto = `${comp.id} ${comp.tipoServicio} ${comp.tipoTarifa} ${comp.nombreTarifa} ${comp.importeFactura} ${comp.cliente?.nombre} ${comp.lugar?.nombre}`;
    return normalizarTexto(texto).includes(normalizarTexto(busqueda));
  });

  const lugaresFiltrados = agente.lugares.filter((lugar: any) => {
    const texto = `${lugar.nombre} ${lugar.direccion}`;
    return normalizarTexto(texto).includes(normalizarTexto(busqueda));
  });

  const usuariosFiltrados = agente.usuarios.filter((user: any) => {
    const texto = `${user.nombre} ${user.email} ${user.rol}`;
    return normalizarTexto(texto).includes(normalizarTexto(busqueda));
  });

  return (
    <div className="p-6 bg-[#68B84B] min-h-screen">
      <div className="mb-4">
        <Button onClick={() => router.push('/agentes')} className="bg-[#F0C300] text-black hover:bg-yellow-400">
          ⬅ Volver
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Detalle del Agente</h1>

      {/* DATOS DEL AGENTE */}
      <div className="bg-[#FFE0B2] p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">🧾 Información General del Agente</h2>
        <p><strong>Nombre:</strong> {agente.nombre}</p>
        <p><strong>Email:</strong> {agente.email}</p>
        <p><strong>Teléfono:</strong> {agente.telefono || '-'}</p>
        <p><strong>% Agente:</strong> {agente.pctAgente != null ? `${(Number(agente.pctAgente) * 100).toFixed(1)}%` : '—'}</p> {/* ← NUEVO */}
      </div>

      {/* USUARIOS */}
      <div className="bg-[#D0F0C0] p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">📇 Datos del Usuario Vinculado</h2>

        <Input
          placeholder="🔍 Buscar por nombre, email o rol..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 w-full"
        />

        {usuariosFiltrados.length > 0 ? (
          usuariosFiltrados.map((user: any) => {
            const lugarNombre = agente.lugares.find((l: any) => l.id === user.lugarId)?.nombre || '-';
            return (
              <div key={user.id} className="grid md:grid-cols-2 gap-4 border p-4 rounded bg-[#FFFCF0] mb-4">
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

      {/* LUGARES */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">📍 Lugares asignados</h2>

        <Input
          placeholder="🔍 Buscar por nombre o dirección..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 w-full"
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
                <th className="p-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {lugaresFiltrados.map((lugar: any) => (
                <tr key={lugar.id} className="border-b hover:bg-[#f6f6f6]">
                  <td className="p-2 font-semibold">#{lugar.id}</td>
                  <td className="p-2">{lugar.nombre}</td>
                  <td className="p-2">{lugar.direccion}</td>
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

      {/* COMPARATIVAS */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">📊 Comparativas</h2>

        <Input
          placeholder="🔍 Buscar por tipo, tarifa, cliente o lugar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 w-full"
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
            <tbody>
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
    </div>
  );
}

function normalizarTexto(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
