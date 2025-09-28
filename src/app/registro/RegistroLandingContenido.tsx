'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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
  Shield,
  Plus,
  Check,
  Lock,
  Tag,
} from 'lucide-react';
import RegistroFormulario from './RegistroFormulario';

// Paleta
const brand = {
  bg: '#0E2631',
  text: '#F6EED1',
  accent: '#FF7A3B',
  accent2: '#FF4D7E',
  card: '#112e3c',
  cardAlt: '#143a48',
};

// Secciones (tipo WakeUp)
const SECCIONES = [
  { key: 'luz',          label: 'Luz',                 icon: Bolt },
  { key: 'gas',          label: 'Gas',                 icon: Flame },
  { key: 'telefonia',    label: 'Telefonía',           icon: Phone },
  { key: 'solar',        label: 'Solar',               icon: Sun },
  { key: 'aerotermia',   label: 'Aerotermia',          icon: Thermometer },
  { key: 'bateria',      label: 'Batería HERMES IA',   icon: BatteryCharging },
  { key: 'inmobiliaria', label: 'Inmobiliaria',        icon: Building2 },
  { key: 'viajes',       label: 'Viajes',              icon: Plane },
  { key: 'repuestos',    label: 'Repuestos coche',     icon: Wrench },
  { key: 'ferreteria',   label: 'Ferretería',          icon: Hammer },
  { key: 'seguros',      label: 'Seguros',             icon: Shield },
  { key: 'mas',          label: 'Más pronto…',         icon: Plus },
];

// Fallback si falla la API
const FALLBACK_TEASERS = [
  { k: 'luz', t: 'Luz empresa • Precio fijo estable', b: 'Top ahorro', tag: 'Hasta -22%', copy: 'Tarifa fija negociada para pymes. Sin sustos.' },
  { k: 'telefonia', t: 'Fibra + Móvil ilimitado', b: 'Pack pro', tag: 'Desde 29€/mes', copy: 'Cobertura nacional y portabilidad asistida.' },
  { k: 'seguros', t: 'Hogar + Auto • Multi', b: 'Bundle Smart', tag: 'Bonos -15%', copy: 'Bonificación por pólizas combinadas.' },
  { k: 'viajes', t: 'Escapadas energía cero', b: 'Eco Travel', tag: 'Hasta -35%', copy: 'Alojamiento eficiente y ventajas exclusivas.' },
];

type OfertaAPI = {
  id: number | string;
  titulo?: string;
  descripcionCorta?: string;
  descripcionLarga?: string;
  tipo?: string;
  destacada?: boolean;
  activa?: boolean;
  etiqueta?: string;
  creadaEn?: string;
};

export default function RegistroLandingContenido() {
  const searchParams = useSearchParams();
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);
  const [leadOK, setLeadOK] = useState(false);

  const [teasers, setTeasers] = useState(FALLBACK_TEASERS);
  const [loadingTeasers, setLoadingTeasers] = useState(true);

  // estilo subrayado ondulado
  const wavy: CSSProperties = {
    textDecorationLine: 'underline',
    textDecorationStyle: 'wavy',
    textDecorationThickness: '3px',
    textUnderlineOffset: '6px',
  };

  // IDs desde URL/localStorage (QR, redes) + flag de lead
  useEffect(() => {
    const a = searchParams.get('agenteId');
    const l = searchParams.get('lugarId');
    if (a && l) {
      setAgenteId(a); setLugarId(l);
      try { localStorage.setItem('agenteId', a); localStorage.setItem('lugarId', l); } catch {}
    } else {
      try { setAgenteId(localStorage.getItem('agenteId')); setLugarId(localStorage.getItem('lugarId')); } catch {}
    }
    try { setLeadOK(localStorage.getItem('leadOK') === '1'); } catch {}
  }, [searchParams]);

  // Cargar ofertas destacadas y activas desde /api/ofertas
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/ofertas', { cache: 'no-store' });
        if (!res.ok) throw new Error('bad status');
        const data: OfertaAPI[] = await res.json();
        const destacados = (data || [])
          .filter(o => o.activa && o.destacada)
          .sort((a, b) => (new Date(b.creadaEn || 0).getTime() - new Date(a.creadaEn || 0).getTime()))
          .slice(0, 6)
          .map(o => ({
            k: (o.tipo || 'oferta').toLowerCase(),
            t: o.titulo || 'Oferta destacada',
            b: 'Destacada',
            tag: o.etiqueta || 'Exclusiva',
            copy: o.descripcionCorta || (o.descripcionLarga ? (o.descripcionLarga.length > 120 ? o.descripcionLarga.slice(0, 117) + '…' : o.descripcionLarga) : 'Condiciones especiales disponibles.'),
          }));
        if (!cancel && destacados.length) setTeasers(destacados);
      } catch { /* fallback */ }
      finally { if (!cancel) setLoadingTeasers(false); }
    })();
    return () => { cancel = true; };
  }, []);

  const secciones = useMemo(() => SECCIONES, []);
  const comparadorHref = useMemo(() => {
    const qs = (agenteId && lugarId) ? `?agenteId=${agenteId}&lugarId=${lugarId}` : '';
    return `/comparador${qs}`;
  }, [agenteId, lugarId]);

  return (
    <div className="min-h-screen text-gray-100" style={{ backgroundColor: brand.bg }}>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(60rem 28rem at 15% -10%, ${brand.accent}22, transparent),
                         radial-gradient(50rem 24rem at 120% 20%, ${brand.accent2}22, transparent)`,
          }}
        />
        <div className="container mx-auto px-6 pt-8 md:pt-10 pb-8 relative">
          <div className="max-w-4xl">
            <img src="/logo-impulso.png" alt="Impulso Energético" className="h-16 md:h-20 w-auto" />
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: brand.text }}>
              Ofertas <span style={wavy}>REALES</span> y <span style={wavy}>EXCLUSIVAS</span> para <span style={wavy}>AHORRAR</span> y <span style={wavy}>GANAR COMISIONES YA</span>
            </h1>
          </div>
        </div>
      </section>

      {/* BANNER FULL-WIDTH */}
      <section className="relative isolate mt-2 md:mt-4">
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
          <picture>
            <source media="(max-width: 768px)" srcSet="/banner-innovacion-mobile.jpg" />
            <img
              src="/banner-innovacion-desktop.jpg"
              alt="Innovación energética para tu hogar y tu empresa"
              className="block w-full h-[200px] md:h-[260px] lg:h-[320px] object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </picture>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow:
                'inset 0 -24px 40px rgba(14,38,49,0.55), inset 0 24px 40px rgba(14,38,49,0.30)',
            }}
          />
        </div>
      </section>

      {/* BLOQUE TEXTO + CTAS + TICKS (entre banner y botones de servicios) */}
      <section className="container mx-auto px-6 pt-6 pb-8">
        <p className="text-lg md:text-xl" style={{ color: '#d9d2b5' }}>
          <b>Y mucho más:</b> Telefonía, Viajes, Inmobiliaria, Seguros, Repuestos y otros servicios para tu día a día.
          <br /><b>Desbloquea tus descuentos en 60 segundos.</b>
        </p>

        <div className="mt-6 flex flex-wrap gap-4 items-center">
          <a
            href="#form"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-lg neon-glow"
            style={{
              background: `linear-gradient(90deg, ${brand.accent}, ${brand.accent2})`,
              color: '#0b1e27',
              boxShadow: `0 0 0 2px ${brand.text}11, 0 0 14px ${brand.accent}aa, 0 0 28px ${brand.accent2}77`,
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

        <div className="mt-6 flex flex-wrap items-center gap-8 text-sm" style={{ color: '#d9d2b5' }}>
          <span className="inline-flex items-center gap-2"><Check size={16} /> Estudio gratuito</span>
          <span className="inline-flex items-center gap-2"><Check size={16} /> Ofertas negociadas y actualizadas</span>
          <span className="inline-flex items-center gap-2"><Check size={16} /> Sin compromiso</span>
        </div>
      </section>

      {/* Secciones: BOTONES ROJOS con glow neón */}
      <section className="container mx-auto px-6 pb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6" style={{ color: brand.text }}>
          Elige tu sección y empieza a ahorrar
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
          {secciones.map(({ key, label, icon: Icon }) => (
            <a key={key} href="#form" className="group flex flex-col items-center justify-center gap-2" title={`${label} · Accede y desbloquea ofertas`}>
              <div
                className="h-28 w-28 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105 neon-glow"
                style={{ background: `linear-gradient(135deg, ${brand.accent}, ${brand.accent2})` }}
              >
                <Icon size={34} style={{ color: brand.bg }} />
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

      {/* Banda promesa */}
      <section className="py-8" style={{ background: `linear-gradient(90deg, ${brand.accent}22, ${brand.accent2}22)` }}>
        <div className="container mx-auto px-6">
          <p className="text-lg md:text-xl font-bold" style={{ color: brand.text }}>
            💥 <b>Sin trucos</b>: precios reales, atención cercana y gestión completa (altas, portabilidades e instalaciones).
          </p>
        </div>
      </section>

      {/* TEASERS (dinámicos) */}
      <section className="container mx-auto px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6" style={{ color: brand.text }}>
          Ofertas destacadas {leadOK ? '(desbloqueadas)' : '(bloqueadas)'}
        </h2>

        {loadingTeasers && <div className="text-sm" style={{ color: '#c9c2a5' }}>Cargando ofertas…</div>}

        {!loadingTeasers && (
          <div className="grid md:grid-cols-2 gap-6">
            {teasers.map((o, i) => (
              <div
                key={i}
                className="group relative rounded-2xl p-[2px]"
                style={{
                  background: `linear-gradient(135deg, ${brand.accent}, ${brand.accent2})`,
                  boxShadow: `0 0 10px ${brand.accent}66, 0 0 24px ${brand.accent2}55`,
                }}
              >
                <div className="rounded-2xl p-6 h-full" style={{ backgroundColor: brand.card }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#1a3c4a', color: brand.text }}>
                      {o.b || 'Destacada'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: '#1a3c4a', color: brand.text }}>
                      <Tag size={14} /> {o.tag || 'Exclusiva'}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg md:text-xl font-extrabold" style={{ color: brand.text }}>{o.t}</h3>
                    <p className="mt-2 text-sm" style={{ color: '#d9d2b5' }}>{o.copy}</p>
                  </div>

                  {/* Overlay bloqueo / desbloqueado */}
                  {!leadOK ? (
                    <div
                      className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center p-6"
                      style={{ background: '#0E2631dd', backdropFilter: 'blur(2px)', color: brand.text }}
                    >
                      <Lock size={32} className="lock-anim" />
                      <div className="font-bold mt-2">Contenido exclusivo</div>
                      <div className="text-sm opacity-90 mt-1">Regístrate para ver precio, condiciones y contratar</div>
                      <a
                        href="#form"
                        className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2 font-semibold neon-glow"
                        style={{ background: `linear-gradient(90deg, ${brand.accent}, ${brand.accent2})`, color: '#0b1e27' }}
                      >
                        Desbloquear ahora <ChevronRight size={16} />
                      </a>
                    </div>
                  ) : (
                    <div className="mt-5">
                      <a
                        href={comparadorHref}
                        className="inline-flex items-center gap-2 rounded-full px-5 py-2 font-semibold neon-glow"
                        style={{ background: `linear-gradient(90deg, ${brand.accent}, ${brand.accent2})`, color: '#0b1e27' }}
                      >
                        Ver detalle y contratar <ChevronRight size={16} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="container mx-auto px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: brand.text }}>
          ¿Cómo desbloqueas tus descuentos?
        </h2>
        <div className="mt-7 grid md:grid-cols-4 gap-6">
          {[
            { n: '01', t: 'Regístrate', d: 'Nombre, email y teléfono. 60 segundos.' },
            { n: '02', t: 'Accede a ofertas', d: 'Promos reales y negociadas.' },
            { n: '03', t: 'Contrata fácil', d: 'Nos ocupamos de altas y portabilidades.' },
            { n: '04', t: 'Ahorro constante', d: 'Seguimiento y optimización continua.' },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl p-6 border shadow-sm" style={{ backgroundColor: brand.cardAlt, borderColor: '#2b5666' }}>
              <div className="text-sm font-extrabold" style={{ color: '#8fb0bd' }}>{s.n}</div>
              <div className="mt-2 text-lg font-bold" style={{ color: brand.text }}>{s.t}</div>
              <p className="mt-2 text-sm" style={{ color: '#d9d2b5' }}>{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <a
            href="#form"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-lg neon-glow"
            style={{ background: `linear-gradient(90deg, ${brand.accent}, ${brand.accent2})`, color: '#0b1e27' }}
          >
            Acceder a las ofertas <ChevronRight size={18} />
          </a>
        </div>
      </section>

      {/* FORMULARIO */}
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

      {/* Animaciones */}
      <style jsx>{`
        @keyframes lockBeat {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(255,122,59,0.0)); }
          50% { transform: scale(1.12); filter: drop-shadow(0 0 10px rgba(255,122,59,0.8)); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(255,122,59,0.4), 0 0 22px rgba(255,77,126,0.3); }
          50% { box-shadow: 0 0 16px rgba(255,122,59,0.8), 0 0 32px rgba(255,77,126,0.6); }
        }
        .lock-anim { animation: lockBeat 1.4s ease-in-out infinite; }
        .neon-glow { animation: glowPulse 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
