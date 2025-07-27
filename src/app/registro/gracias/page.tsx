'use client';

import { useEffect, useState } from 'react';

export default function RegistroGraciasPage() {
  const [url, setUrl] = useState('/comparador');

  useEffect(() => {
    const agenteId = localStorage.getItem('agenteId');
    const lugarId = localStorage.getItem('lugarId');
    if (agenteId && lugarId) {
      setUrl(`/comparador?agenteId=${agenteId}&lugarId=${lugarId}`);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-yellow-100 p-6">
      <div className="bg-white shadow-xl rounded-xl p-10 max-w-xl w-full text-center">
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          🎉 ¡Gracias por registrarte!
        </h1>
        <p className="text-gray-700 mb-6">
          Ahora puedes comenzar a comparar ofertas, ahorrar en tus suministros y obtener recompensas por recomendar.
        </p>
        <a
          href={url}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded transition duration-300"
        >
          Ir al Comparador
        </a>
      </div>
    </div>
  );
}
