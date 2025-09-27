// src/app/registro/RegistroLandingContenido.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Zap, Check, Clock } from 'lucide-react';
import RegistroFormulario from './RegistroFormulario';

const brand = {
  primary: '#16a34a',   // verde
  secondary: '#f97316', // naranja
  accent: '#2563eb',    // azul
};

const serviciosBase = [
  { key: 'luz', titulo: 'Luz', desc: 'Comparador y optimización de tarifas eléctricas.', status: 'activo', icon: Zap },
  { key: 'gas', titulo: 'Gas', desc: 'Ahorro en suministro de gas natural.', status: 'activo', icon: Zap },
  { key: 'telefonia', titulo: 'Telefonía', desc: 'Fibra y móvil para empresas y particulares.', status: 'activo', icon: Zap },
  { key: 'ganaderia', titulo: 'Ganadería', desc: 'Suministros y soluciones agrícolas.', status: 'activo', icon: Zap },
  { key: 'fv', titulo: 'Fotovoltaica', desc: 'Instalación llave en mano y PPA.', status: 'proximo', icon: Zap },
  { key: 'baterias', titulo: 'Baterías HERMES-IA', desc: 'Acumulación inteligente y gestión IA.', status: 'proximo', icon: Zap },
];

export default function RegistroLandingContenido() {
  const searchParams = useSearchParams();
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);

  // Leer IDs de URL (QR/redes) y persistirlos
  useEffect(() => {
    const urlAgente = searchParams.get('agenteId');
    const urlLugar = searchParams.get('lugarId');

    if (urlAgente && urlLugar) {
      setAgenteId(urlAgente);
      setLugarId(urlLugar);
      try {
        localStorage.setItem('agenteId', urlAgente);
        localStorage.setItem('lugarId', urlLugar);
      } catch {}
    } else {
      try {
        const storedAgenteId = localStorage.getItem('agenteId');
        const storedLugarId = localStorage.getItem('lugarId');
        setAgenteId(storedAgenteId);
        setLugarId(storedLugarId);
      } catch {}
    }
  }, [searchParams]);

  const activos = useMemo(() => serviciosBase.filter(s => s.status === 'activo'), []);
  const proximos = useMemo(() => serviciosBase.filter(s => s.status === 'proximo'), []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* HERO agresivo */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(80rem 40rem at 20% -10%, ${brand.primary}18, transparent),
                         radial-gradient(70rem 35rem at 120% 20%, ${brand.accent}15, transparent)`
          }}
        />
        <div className="container mx-auto px-6 pt-24 pb-16 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Impulso Energético
              <span className="block text-gray-700 font-semibold mt-2">
                ¡Ahorra YA en Luz, Gas, Telefonía y más!
              </span>
            </h1>
            <p className="mt-5 text-lg text-gray-800 max-w-2xl">
              Ofertas exclusivas solo para clientes registrados. 60 segundos para darte de alta y ver tus descuentos reales.
            </p>

            {/* CTA: baja al formulario */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#form"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white text-lg"
                style={{ backgroundColor: brand.primary }}
              >
                Acceder a las ofertas <ChevronRight size={18} />
              </a>
              <a
                href="#form"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold"
                style={{ border: `2px solid ${brand.primary}`, color: brand.primary }}
                title="Sin registro no se muestran precios ni promos"
              >
                Ver ahorro estimado
              </a>
            </div>

            {/* Pruebas sociales rápidas */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-700">
              <span className="inline-flex items-center gap-2">
                <Check size={16} /> Estudio gratuito
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={16} /> Ofertas reales y actualizadas
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={16} /> Sin compromiso
              </span>
            </div>

            {(agenteId || lugarId) && (
              <div className="mt-3 text-xs text-gray-500">
                {agenteId && <>Agente: <b>{agenteId}</b>{' '}</>}
                {lugarId && <>· Lugar: <b>{lugarId}</b></>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="container mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold">Servicios</h2>
        <p className="text-gray-600 mt-2">Activos y próximos lanzamientos</p>

        {/* Activos */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {activos.map((s) => (
            <div key={s.key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <s.icon />
                  <h3 className="text-xl font-bold">{s.titulo}</h3>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full"
                  style={{ backgroundColor: `#16a34a22`, color: brand.primary }}
                >
                  <Check size={16} /> Activo
                </span>
              </div>
              <p className="mt-3 text-gray-700">{s.desc}</p>
              <a href="#form" className="mt-5 inline-flex items-center gap-2 font-semibold" style={{ color: brand.accent }}>
                Ver ofertas <ChevronRight size={16} />
              </a>
            </div>
          ))}
        </div>

        {/* Próximos */}
        {proximos.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-800">Próximamente</h3>
            <div className="mt-4 grid md:grid-cols-3 gap-6">
              {proximos.map((s) => (
                <div key={s.key} className="bg-white rounded-2xl p-6 border border-dashed">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 opacity-80">
                      <s.icon />
                      <h4 className="text-lg font-bold">{s.titulo}</h4>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full text-gray-600 bg-gray-100">
                      <Clock size={16} /> Próximo
                    </span>
                  </div>
                  <p className="mt-3 text-gray-600">{s.desc}</p>
                  <span className="mt-4 inline-block text-sm text-gray-500">Apúntate y te avisamos al activar.</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-white border-y border-gray-100">
        <div className="container mx-auto px-6 py-16">
          <h2 className="text-3xl md:text-4xl font-bold">Cómo consigues el ahorro</h2>
          <div className="mt-8 grid md:grid-cols-4 gap-6">
            {[
              { n: '01', t: 'Regístrate', d: 'Déjanos tu nombre, email y teléfono.' },
              { n: '02', t: 'Accede a ofertas', d: 'Promos reales y negociadas.' },
              { n: '03', t: 'Contrata fácil', d: 'Altas, portabilidades o instalaciones.' },
              { n: '04', t: 'Mejora continua', d: 'Revisamos y optimizamos tus condiciones.' },
            ].map((step) => (
              <div key={step.n} className="rounded-2xl p-6 border border-gray-100">
                <div className="text-sm font-extrabold text-gray-400">{step.n}</div>
                <div className="mt-2 text-xl font-bold">{step.t}</div>
                <p className="mt-2 text-gray-700">{step.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <a
              href="#form"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white text-lg"
              style={{ backgroundColor: brand.primary }}
            >
              Acceder a las ofertas <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* FORMULARIO (tu componente actual) */}
      <section id="form" className="container mx-auto px-6 py-16">
        <RegistroFormulario />
      </section>

      {/* FOOTER simple */}
      <footer className="border-t border-gray-200">
        <div className="container mx-auto px-6 py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Impulso Energético</div>
          <div className="flex items-center gap-3">
            <a href="#form" className="hover:underline">Ver ofertas</a>
            <a href="#" className="hover:underline">Aviso legal</a>
            <a href="#" className="hover:underline">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
