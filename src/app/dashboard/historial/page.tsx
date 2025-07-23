'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistorialComparativasPage() {
  const [comparativas, setComparativas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('');
  const router = useRouter();

  useEffect(() => {
    const cargarComparativas = async () => {
      try {
        const res = await fetch('/api/comparativas');
        const data = await res.json();
        const arrayData = Array.isArray(data) ? data : [];
        setComparativas([...arrayData].reverse());
      } catch (error) {
        console.error('Error al cargar comparativas', error);
        setComparativas([]);
      }
    };
    cargarComparativas();
  }, []);

  const filtradas = comparativas.filter((c) => {
    return (
      c.cliente?.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
      c.nombreTarifa?.toLowerCase().includes(filtro.toLowerCase())
    );
  });

  const verComparativa = (id: number) => {
    router.push(`/comparador?id=${id}`);
  };

  return (
    <div className="p-6 min-h-screen bg-white text-gray-800">
      <h1 className="text-2xl font-bold mb-6 text-green-800">📁 Historial de Comparativas</h1>

      <input
        type="text"
        placeholder="🔍 Buscar por cliente o tarifa..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="mb-6 p-3 border rounded w-full md:w-1/2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />

      <div className="max-h-[600px] overflow-y-auto bg-yellow-100 p-4 rounded shadow-md">
        <table className="w-full table-auto border-separate border-spacing-y-3">
          <thead className="bg-yellow-300 text-gray-900">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">ID</th>
              <th className="px-4 py-2 text-left font-semibold">Cliente</th>
              <th className="px-4 py-2 text-left font-semibold">Tarifa</th>
              <th className="px-4 py-2 text-left font-semibold">Importe</th>
              <th className="px-4 py-2 text-left font-semibold">Agente</th>
              <th className="px-4 py-2 text-left font-semibold">Lugar</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((c) => (
              <tr key={c.id} className="bg-white rounded shadow text-sm">
                <td className="px-4 py-2 font-bold text-gray-700">#{c.id}</td>
                <td className="px-4 py-2 font-semibold">{c.cliente?.nombre}</td>
                <td className="px-4 py-2 font-semibold">{c.nombreTarifa}</td>
                <td className="px-4 py-2 font-semibold">{c.importeFactura} €</td>
                <td className="px-4 py-2 font-semibold">{c.agente?.nombre || '—'}</td>
                <td className="px-4 py-2 font-semibold">{c.lugar?.nombre || '—'}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => verComparativa(c.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold"
                  >
                    Cargar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtradas.length === 0 && (
          <div className="text-center text-gray-600 mt-6 font-medium">No se encontraron resultados.</div>
        )}
      </div>
    </div>
  );
}


