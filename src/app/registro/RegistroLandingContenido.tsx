'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  Bolt, Flame, Phone, Sun, Thermometer, BatteryCharging,
  Building2, Plane, Wrench, Hammer, Shield, Plus, Check, Lock, Tag,
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

// -------- LUGARES ESPECIALES (fallback local para probar) --------
type SpecialPlace = {
  id: string;
  nombre: string;
  logo: string;          // ruta en /public
  color?: string;        // color acento
  mensajeCorto?: string; // texto de la píldora
};
const SPECIAL_PLACES: Record<string, SpecialPlace> = {
  '101': {
    id: '101',
    nombre: 'Club Deportivo Impulso',
    logo: '/clubs/club-demo.png',
    color: '#FF7A3B',
    mensajeCorto: 'AYUDA A TU CLUB',
  },
};

// Secciones
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

// Fallback de ofertas si falla la API
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

  // Info especial del lugar (club/ONG/etc)
  const [club, setClub] = useState<SpecialPlace | null>(null);

  // € aportados (target desde API; animación al entrar en viewport)
  const [aportTarget, setAportTarget] = useState<number | null>(null);
  const [aportDisplay, setAportDisplay] = useState<number>(0);
  const counterRef = useRef<HTMLDivElement | null>(null);
  const [counterVisible, setCounterVisible] = useState(false);

  // subrayado ondulado en palabras clave
  const wavy: CSSProperties = {
    textDecorationLine: 'underline',
    textDecorationStyle: 'wavy',
    textDecorationThickness: '3px',
    textUnderlineOffset: '6px',
  };

  // 1) Coger IDs de URL/localStorage + flag lead
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

  // 2) Cargar datos del lugar especial (API -> fallback local)
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!lugarId) return;
      try {
        const r = await fetch(`/api/lugares/${lugarId}`, { cache: 'no-store' });
        if (r.ok) {
          const data = await r.json();
          if (!cancel && data?.especial) {
            setClub({
              id: String(lugarId),
              nombre: data.nombre || `Lugar ${lugarId}`,
              logo: data.logo || SPECIAL_PLACES[lugarId]?.logo || '/clubs/club-demo.png',
              color: data.color || SPECIAL_PLACES[lugarId]?.color || brand.accent,
              mensajeCorto: data.mensajeCorto || 'AYUDA A TU CLUB',
            });
            // contador (si API lo trae)
            if (typeof data.aportacionAcumulada === 'number') {
              setAportTarget(Math.max(0, Math.floor(data.aportacionAcumulada)));
            } else {
              // fallback demo
              setAportTarget(12500);
            }
            return;
          }
        }
      } catch {}
      if (!cancel && SPECIAL_PLACES[lugarId]) {
        setClub(SPECIAL_PLACES[lugarId]);
        setAportTarget(12500); // fallback demo
      }
    })();
    return () => { cancel = true; };
  }, [lugarId]);

  // 3) Animar contador cuando entra en viewport
  useEffect(() => {
    if (!counterRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setCounterVisible(true),
      { threshold: 0.3 }
    );
    obs.observe(counterRef.current);
    return () => obs.disconnect();
  }, [counterRef]);

  useEffect(() => {
    if (!counterVisible || aportTarget == null) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1200; // ms
    const from = 0;
    const to = aportTarget;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setAportDisplay(Math.floor(from + (to - from) * ease(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [counterVisible, aportTarget]);

  // 4) Ofertas destacadas
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
      } catch {}
      finally { if (!cancel) setLoadingTeasers(false); }
    })();
    return () => { cancel = true; };
  }, []);

  const secciones = useMemo(() => SECCIONES, []);
  const comparadorHref = useMemo(() => {
    const qs = (agenteId && lugarId) ? `?agenteId=${agenteId}&lugarId=${lugarId}` : '';
    return `/comparador${qs}`;
  }, [agenteId, lugarId]);

  const clubColor = club?.color || brand.accent;

  const fmt = (n: number) => new Intl.NumberFormat('es-ES').format(n);

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
        <div className="container mx-auto px-6 pt-8 md:pt-10 pb-6 md:pb-8 relative">
          {/* Fila superior: logo Impulso (izq) · Píldora central · Escudo club (dcha) */}
          <div className="flex items-center justify-between gap-3">
            {/* Logo Impulso con marco neón */}
            <div
              className="neon-frame-impulso rounded-2xl p-2 md:p-3"
              style={{
                boxShadow: `0 0 0 3px ${brand.accent}, 0 0 22px ${brand.accent}, 0 0 44px ${brand.accent2}AA`,
                background: 'rgba(0,0,0,0.20)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
              title="Impulso Energético"
            >
              <img src="/logo-impulso.png" alt="Impulso Energético" className="h-14 md:h-18 lg:h-20 w-auto" />
            </div>

            {/* Píldora central (desktop) */}
            {club && (
              <div className="hidden md:flex flex-1 justify-center">
                <div
                  className="mega-pill"
                  style={{
                    border: `2px solid ${clubColor}`,
                    color: brand.text,
                    boxShadow: `0 0 0 2px ${clubColor}22, 0 0 26px ${clubColor}77, inset 0 0 10px rgba(255,255,255,0.06)`,
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                  }}
                >
                  <span className="text-xl">🏆</span>
                  <span className="font-extrabold uppercase tracking-wide text-xl">
                    {club.mensajeCorto || 'AYUDA A TU CLUB'}
                  </span>
                  <span className="opacity-90 text-lg">· {club.nombre}</span>
                </div>
              </div>
            )}

            {/* Escudo club con marco neón */}
            {club && (
              <div
                className="neon-frame rounded-2xl p-2 md:p-3"
                style={{
                  boxShadow: `0 0 0 3px ${clubColor}, 0 0 22px ${clubColor}, 0 0 44px ${clubColor}AA`,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
                title={club.nombre}
              >
                <img
                  src={club.logo}
                  alt={`Escudo ${club.nombre}`}
                  className="h-20 md:h-28 lg:h-32 w-auto object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]"
                />
              </div>
            )}
          </div>

          {/* Píldora central (móvil) */}
          {club && (
            <div className="md:hidden mt-3 flex justify-center">
              <div
                className="mega-pill"
                style={{
                  border: `2px solid ${clubColor}`,
                  color: brand.text,
                  boxShadow: `0 0 0 2px ${clubColor}22, 0 0 20px ${clubColor}66, inset 0 0 10px rgba(255,255,255,0.06)`,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                }}
              >
                <span className="text-lg">🏆</span>
                <span className="font-extrabold uppercase tracking-wide text-base">
                  {club.mensajeCorto || 'AYUDA A TU CLUB'}
                </span>
              </div>
            </div>
          )}

          {/* Contador de aportación */}
          {club && (
            <div ref={counterRef} className="mt-3 md:mt-4 flex justify-center">
              <div
                className="counter-pill"
                style={{
                  border: `2px solid ${clubColor}`,
                  color: brand.text,
                  boxShadow: `0 0 0 2px ${clubColor}22, 0 0 22px ${clubColor}77`,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                }}
              >
                <span className="text-sm md:text-base opacity-85">Aportados al club</span>
                <span className="text-xl md:text-2xl font-extrabold tabular-nums">
                  € {fmt(aportDisplay)}
                </span>
              </div>
            </div>
          )}

          {/* Título */}
          <h1 className="mt-4 md:mt-5 text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: brand.text }}>
            Ofertas <span style={wavy}>REALES</span> y <span style={wavy}>EXCLUSIVAS</span> para <span style={wavy}>AHORRAR</span> y <span style={wavy}>GANAR COMISIONES YA</span>
          </h1>
        </div>
      </section>

      {/* BANNER full-width */}
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
            style={{ boxShadow: 'inset 0 -24px 40px rgba(14,38,49,0.55), inset 0 24px 40px rgba(14,38,49,0.30)' }}
          />
        </div>
      </section>

      {/* BLOQUE texto + CTAs + ticks */}
      <section className="container mx-auto px-6 pt-6 pb-8">
        <p className="text-lg md:text-xl" style={{ color: '#d9d2b5' }}>
          <b>Y mucho más:</b> Telefonía, Viajes, Inmobiliaria, Seguros, Repuestos y otros servicios para tu día a día.
          <br /><b>Desbloquea tus descuentos en 60 segundos.</b>
        </p>

        {club && (
          <p className="mt-2 text-sm" style={{ color: '#f0ead0' }}>
            <b>Impacto directo:</b> con cada servicio contratado, <b>{club.nombre}</b> recibe una aportación económica.
          </p>
        )}

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

      {/* Secciones */}
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
              <span className="text-sm font-semibold text-center" style={{ color: brand.text }}>{label}</span>
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

      {/* TEASERS */}
      <section className="container mx-auto px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6" style={{ color: brand.text }}>
          Ofertas destacadas {leadOK ? '(desbloqueadas)' : '(bloqueadas)'}
        </h2>
        {loadingTeasers && <div className="text-sm" style={{ color: '#c9c2a5' }}>Cargando ofertas…</div>}
        {!loadingTeasers && (
          <div className="grid md:grid-cols-2 gap-6">
            {teasers.map((o, i) => (
              <div key={i} className="group relative rounded-2xl p-[2px]"
                   style={{ background: `linear-gradient(135deg, ${brand.accent}, ${brand.accent2})`,
                            boxShadow: `0 0 10px ${brand.accent}66, 0 0 24px ${brand.accent2}55` }}>
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
                  {!leadOK ? (
                    <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center p-6"
                         style={{ background: '#0E2631dd', backdropFilter: 'blur(2px)', color: brand.text }}>
                      <Lock size={32} className="lock-anim" />
                      <div className="font-bold mt-2">Contenido exclusivo</div>
                      <div className="text-sm opacity-90 mt-1">Regístrate para ver precio, condiciones y contratar</div>
                      <a href="#form" className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2 font-semibold neon-glow"
                         style={{ background: `linear-gradient(90deg, ${brand.accent}, ${brand.accent2})`, color: '#0b1e27' }}>
                        Desbloquear ahora <ChevronRight size={16} />
                      </a>
                    </div>
                  ) : (
                    <div className="mt-5">
                      <a href={comparadorHref} className="inline-flex items-center gap-2 rounded-full px-5 py-2 font-semibold neon-glow"
                         style={{ background: `linear-gradient(90deg, ${brand.accent}, ${brand.accent2})`, color: '#0b1e27' }}>
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
          <a href="#form" className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-lg neon-glow"
             style={{ background: `linear-gradient(90deg, ${brand.accent}, ${brand.accent2})`, color: '#0b1e27' }}>
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
        .neon-frame { animation: glowPulse 2.6s ease-in-out infinite; }
        .neon-frame-impulso { animation: glowPulse 2.2s ease-in-out infinite; }

        .mega-pill {
          display: inline-flex;
          align-items: center;
          gap: .7rem;
          padding: .6rem 1.1rem;
          border-radius: 9999px;
          text-shadow: 0 2px 10px rgba(0,0,0,.35);
          backdrop-filter: blur(2px);
        }
        .counter-pill {
          display: inline-flex;
          align-items: center;
          gap: .8rem;
          padding: .4rem .9rem;
          border-radius: 9999px;
          backdrop-filter: blur(2px);
        }
      `}</style>
    </div>
  );
}
