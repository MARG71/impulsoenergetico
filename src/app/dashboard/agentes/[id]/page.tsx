'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditarAgente() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarAgente = async () => {
      const res = await fetch(`/api/agentes/${id}`);
      const data = await res.json();
      setNombre(data.nombre);
      setEmail(data.email);
      setCargando(false);
    };
    cargarAgente();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/agentes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email }),
    });

    if (res.ok) {
      alert('Agente actualizado correctamente');
      router.push('/dashboard'); // Redirige al panel principal
    } else {
      alert('Error al actualizar el agente');
    }
  };

  if (cargando) return <p className="text-center mt-10">Cargando datos del agente...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4 text-blue-800">Editar Agente</h2>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold">Nombre</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex justify-between">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Guardar Cambios
          </button>
          <button
            type="button"
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
            onClick={() => router.push('/dashboard')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
