'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegistroFormulario() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const agenteId = searchParams.get('agenteId');
  const lugarId = searchParams.get('lugarId');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agenteId || !lugarId) {
      setMensaje('El código QR está incompleto o no es válido.');
      return;
    }

    setCargando(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, telefono, agenteId, lugarId }),
      });

      if (res.ok) {
        // Redirigir al comparador con agenteId y lugarId
        router.push(`/comparador?agenteId=${agenteId}&lugarId=${lugarId}`);
      } else {
        const data = await res.json();
        setMensaje(data.error || 'Error al registrar.');
        setCargando(false);
      }
    } catch (error) {
      setMensaje('Error de red al registrar.');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 to-green-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-xl p-8 rounded-xl shadow-lg space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-green-800">
          🚀 ¡Ahorra y gana con tus suministros!
        </h1>
        <p className="text-center text-gray-600 text-sm">
          Completa tus datos para comenzar a comparar ofertas y ganar comisiones.
        </p>

        {mensaje && <p className="text-red-500 text-sm text-center">{mensaje}</p>}

        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-3 border rounded text-gray-800"
          required
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded text-gray-800"
          required
        />

        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full p-3 border rounded text-gray-800"
          required
        />

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded transition duration-300"
        >
          {cargando ? 'Enviando...' : 'Comenzar'}
        </button>

        <p className="text-xs text-center text-gray-500">
          Al enviar aceptas recibir comunicaciones comerciales sobre nuestras ofertas y servicios.
        </p>
      </form>
    </div>
  );
}
