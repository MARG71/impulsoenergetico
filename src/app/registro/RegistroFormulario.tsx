'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function RegistroFormulario() {
  const searchParams = useSearchParams();
  const agenteId = searchParams.get('agenteId');
  const lugarId = searchParams.get('lugarId');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agenteId || !lugarId) {
      setMensaje('El código QR está incompleto o no es válido.');
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, telefono, agenteId, lugarId }),
      });

      if (res.ok) {
        setRegistroExitoso(true);
      } else {
        const data = await res.json();
        setMensaje(data.error || 'Error al registrar.');
      }
    } catch (error) {
      setMensaje('Error de red al registrar.');
    }
  };

  if (registroExitoso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-100">
        <div className="bg-white p-6 rounded shadow text-center">
          <h1 className="text-2xl font-bold text-green-700 mb-2">✅ ¡Gracias por registrarte!</h1>
          <p className="text-gray-600">En breve un asesor de Impulso Energético se pondrá en contacto contigo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h1 className="text-xl font-bold text-gray-800 text-center">📋 Registro de Contacto</h1>

        {mensaje && <p className="text-red-500 text-sm text-center">{mensaje}</p>}

        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="email"
          placeholder="Correo electrónico (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <input
          type="tel"
          placeholder="Teléfono de contacto"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
        >
          Enviar
        </button>

        <p className="text-xs text-center text-gray-400">
          Al enviar aceptas ser contactado por un asesor de Impulso Energético.
        </p>
      </form>
    </div>
  );
}
