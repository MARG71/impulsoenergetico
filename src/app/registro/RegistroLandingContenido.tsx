'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  Bolt,
  Flame,
  Phone,
  Sun,
  Thermometer,
  BatteryCharging,
  Building2,
  Plane,
  Wrench,
  Hammer,
  Package,
  Plus,
  Check,
} from 'lucide-react';
import RegistroFormulario from './RegistroFormulario';

// === Paleta basada en el logo adjunto ===
const brand = {
  bg: '#0E2631',         // azul petróleo oscuro (fondo)
  text: '#F6EED1',       // crema para títulos/textos sobre oscuro
  accent: '#FF7A3B',     // neón naranja
  accent2: '#FF4D7E',    // neón magenta/rosa
  card: '#0f2b38',       // variantes del fondo para tarjetas
};

const SECCIONES = [
  { key: 'luz', label: 'Luz', icon: Bolt },
  { key: 'gas', label: 'Gas', icon: Flame },
  { key: 'telefonia', label: 'Telefonía', icon: Phone },
  { key: 'solar', label: 'Solar', icon: Sun },
  { key: 'aerotermia', label: 'Aerotermia', icon: Thermometer },
  { key: 'bateria', label: 'Batería HERMES IA', icon: BatteryCharging },
  { key: 'inmobiliaria', label: 'Inmobiliaria', icon: Building2 },
  { key: 'viajes', label: 'Viajes', icon: Plane },
  { key: 'repuestos', label: 'Repuestos coche', icon: Wrench },
  { key: 'ferreteria', label: 'Ferretería', icon: Hammer },
  { key: 'ganaderos', label: 'Productos ganaderos', icon: Package },
  { key: 'mas', label: 'Más pronto…', icon: Plus },
];

export default function RegistroLandingContenido() {
  const searchParams = useSearchParams();
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);

  // 1) Leer IDs de URL y persistirlos (QR / redes)
  useEffect(() => {
    const a = searchParams.get('agenteId');
    const l = searchParams.get('lugarId');

    if (a && l) {
      setAgenteId(a);
      setLugarId(l);
      try {
        localStorage.setItem('agenteId', a);
        localStorage.setItem('lugarId', l);
      } catch {}
    } else {
      try {
        const sa = localStorage.getItem('agenteId');
        const sl = localStorage.getItem('lugarId');
        setAgenteId(sa);
        setLugarId(sl);
      } catch {}
    }
  }, [searchParams]);

  const secciones = useMemo(() => SECCIONES, []);

  return (
    <div className="min-h-screen text-gray-100" style={{ backgroundColor: brand.bg }}>
      {/* HERO agresivo */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(60rem 28rem at 15% -10%, ${brand.accent}22, transparent),
                         radial-gradient(50rem 24rem at 120% 20%, ${brand.accent2}22, transparent)`,
          }}
        />
        <div className="container mx-auto px-6 pt-20 pb-12 relative">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4">
              <img
                src="/logo-impulso.png"
                alt="Impulso Energético"
                className="h-14 w-auto"
              />
              <span className="sr-only">Impulso Energético</span>
            </div>

            <h1
              className="mt-6 text-4xl md:text-5xl font-extrabold leading-tight"
              style={{ color: brand.text }}
            >
              Ofertas **REALES** y **EXCLUSIVAS** para ahorrar YA
            </h1>

            <p className="mt-4 text-lg md:text-xl" style={{ color: '#d9d2b5' }}>
              Luz, Gas, Telefonía, Solar, Aerotermia, Baterías HERMES-IA, Inmobiliaria, Viajes,
              Repuestos, Ferretería y más. <b>Desbloquea tus descuentos en 60 segundos.</b>
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#form"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-lg"
                style={{
                  background: `linear-gradient(90deg, ${brand.accent}, ${brand.accent2})`,
                  color: '#0b1e27',
                }}
              >
                Acceder a las ofertas <ChevronRight size={18} />
              </a>
              <a
                href="#form"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold"
                style={{ border: `2px solid ${brand.text}`, color: brand.text }}
                title="Sin registro no se muestran precios ni promos"
              >
                Ver ahorro estimado
              </a>
            </div>

            {/* badges rápidas */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm" style={{ color: '#d9d2b5' }}>
              <span className="inline-flex items-center gap-2">
                <Check size={16} /> Estudio gratuito
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={16} /> Ofertas negociadas y actualizadas
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={16} /> Sin compromiso
              </span>
            </div>

            {(agenteId || lugarId) && (
              <div className="mt-3 text-xs" style={{ color: '#c9c2a5' }}>
                {agenteId && <>Agente: <b>{agenteId}</b>{' '}</>}
                {lugarId && <>· Lugar: <b>{lugarId}</b></>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Secciones tipo WakeUp: botones redondos */}
      <section className="container mx-auto px-6 pb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6" style={{ color: brand.text }}>
          Elige tu sección y empieza a ahorrar
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
          {secciones.map(({ key, label, icon: Icon }) => (
            <a
              key={key}
              href="#form"
              className="group flex flex-col items-center justify-center gap-2"
              title={`${label} · Accede y desbloquea ofertas`}
            >
              <div
                className="h-28 w-28 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: `radial-gradient(60% 60% at 50% 40%, ${brand.card}, ${brand.bg})`,
                  boxShadow: `0 0 0 3px ${brand.bg}, 0 0 0 6px ${brand.accent}33, 0 6px 18px #00000080`,
                }}
              >
                <Icon size={34} style={{ color: brand.text }} />
              </div>
              <span className="text-sm font-semibold text-center" style={{ color: brand.text }}>
                {label}
              </span>
            </a>
          ))}
        </div>

        <p className="mt-4 text-sm" style={{ color: '#c9c2a5' }}>
          Seguimos añadiendo más servicios. Déjanos tus datos y te avisamos de nuevas ofertas.
        </p>
      </section>

      {/* Banda con promesa de valor */}
      <section className="py-8" style={{ background: `linear-gradient(90deg, ${brand.accent}22, ${brand.accent2}22)` }}>
        <div className="container mx-auto px-6">
          <p className="text-lg md:text-xl font-bold" style={{ color: brand.text }}>
            <span className="mr-2">💥</span>
            <b>Sin trucos</b>: precios reales, atención cercana y gestión completa (altas, portabilidades e instalaciones).
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="container mx-auto px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: brand.text }}>
          ¿Cómo desbloqueas tus descuentos?
        </h2>
        <div className="mt-7 grid md:grid-cols-4 gap-6">
          {[
            { n: '01', t: 'Regístrate', d: 'Nombre, email y teléfono. 60 segundos.' },
            { n: '02', t: 'Accede a ofertas', d: 'Verás promos reales y negociadas.' },
            { n: '03', t: 'Contrata fácil', d: 'Nos ocupamos de altas y portabilidades.' },
            { n: '04', t: 'Ahorro constante', d: 'Seguimiento y optimización continua.' },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl p-6 border"
              style={{ borderColor: '#26404b', backgroundColor: '#112e3c' }}
            >
              <div className="text-sm font-extrabold" style={{ color: '#8fb0bd' }}>{s.n}</div>
              <div className="mt-2 text-lg font-bold" style={{ color: brand.text }}>{s.t}</div>
              <p className="mt-2 text-sm" style={{ color: '#c9c2a5' }}>{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <a
            href="#form"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-lg"
            style={{
              background: `linear-gradient(90deg, ${brand.accent}, ${brand.accent2})`,
              color: '#0b1e27',
            }}
          >
            Acceder a las ofertas <ChevronRight size={18} />
          </a>
        </div>
      </section>

      {/* FORMULARIO (tu componente actual) */}
      <section id="form" className="container mx-auto px-6 py-12">
        <RegistroFormulario />
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: '#1f3a45' }}>
        <div className="container mx-auto px-6 py-8 text-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div style={{ color: '#b7b099' }}>© {new Date().getFullYear()} Impulso Energético</div>
          <div className="flex items-center gap-3">
            <a href="#form" className="hover:underline" style={{ color: brand.text }}>Ver ofertas</a>
            <a href="#" className="hover:underline" style={{ color: brand.text }}>Aviso legal</a>
            <a href="#" className="hover:underline" style={{ color: brand.text }}>Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
