'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RegistroFormulario() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);

  useEffect(() => {
    const urlAgente = searchParams.get('agenteId');
    const urlLugar = searchParams.get('lugarId');

    if (urlAgente && urlLugar) {
      setAgenteId(urlAgente);
      setLugarId(urlLugar);
      localStorage.setItem('agenteId', urlAgente);
      localStorage.setItem('lugarId', urlLugar);
    } else {
      const storedAgenteId = localStorage.getItem('agenteId');
      const storedLugarId = localStorage.getItem('lugarId');
      setAgenteId(storedAgenteId);
      setLugarId(storedLugarId);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje('');

    if (!agenteId || !lugarId) {
      setMensaje('El código QR está incompleto o no es válido.');
      return;
    }

    setCargando(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          agenteId: parseInt(agenteId),
          lugarId: parseInt(lugarId),
        }),
      });

      if (res.ok) {
        localStorage.setItem('agenteId', agenteId);
        localStorage.setItem('lugarId', lugarId);

        // Redirigir a la nueva pantalla de bienvenida
        router.push(`/bienvenida?nombre=${encodeURIComponent(nombre)}&agenteId=${agenteId}&lugarId=${lugarId}`);
      } else {
        const data = await res.json();
        setMensaje(data.error || 'Error al registrar.');
      }
    } catch (error) {
      setMensaje('Error de red al registrar.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-6"
      style={{
        backgroundImage:
          'linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0.85)), url(\"/fondo-registro.jpg\")',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-95 w-full max-w-xl p-8 rounded-xl shadow-2xl space-y-6 backdrop-blur-md"
      >
        <h1 className="text-3xl font-extrabold text-center text-green-700 leading-tight">
          💡 Ahorra en tus facturas <br /> y gana dinero con tus suministros
        </h1>

        <p className="text-center text-gray-700 text-sm">
          Compara ofertas de luz, gas, telefonía, seguros o energía solar. 
          Y si compartes, ¡gana comisiones por cada contrato conseguido!
        </p>

        {mensaje && <p className="text-red-600 text-sm text-center">{mensaje}</p>}

        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded text-gray-800"
          required
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded text-gray-800"
          required
        />

        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded text-gray-800"
          required
        />

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded transition duration-300"
        >
          {cargando ? 'Enviando...' : 'Comenzar ahora'}
        </button>

        <p className="text-xs text-center text-gray-600">
          Al enviar aceptas recibir comunicaciones comerciales sobre nuestras ofertas y servicios.
        </p>

        {agenteId && lugarId && (
          <p className="text-[10px] text-center text-gray-400">
            ID Agente: {agenteId} | ID Lugar: {lugarId}
          </p>
        )}
      </form>
    </div>
  );
}
