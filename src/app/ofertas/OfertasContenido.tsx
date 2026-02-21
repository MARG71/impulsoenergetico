"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  qs: string;
  lugarNombre: string | null;
  fondoUrl: string | null;

  // ✅ Logo del club/asociación (opcional por query)
  partnerLogoUrl?: string | null;

  // ✅ Ruta de Home pública (por defecto "/")
  //    Si tu Home pública es "/home", pásalo desde el server: homePath="/home"
  homePath?: string;
};

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

const IMPULSO_LOGO = "/logo-impulso-definitivo.png"; // ✅ TU LOGO (renombrado recomendado)

function withQS(path: string, qs: string) {
  if (!qs) return path;
  return path.includes("?") ? `${path}&${qs}` : `${path}?${qs}`;
}

export default function OfertasContenido({
  qs,
  lugarNombre,
  fondoUrl,
  partnerLogoUrl,
  homePath = "/", // ✅ HOME pública por defecto
}: Props) {
  const router = useRouter();

  // qs viene sin "?" (ej: "agenteId=1&lugarId=2&qr=xxx&v=1")
  const qsFinal = useMemo(() => (qs ? `?${qs}` : ""), [qs]);

  // ✅ Botón 1
  const irRegistro = () => router.push(`/registro${qsFinal}`);

  // ✅ Botón 2 (ANTES lo tenías a /bienvenida, ahora a HOME pública)
  const irVerOfertas = () => router.push(withQS(homePath, qs));

  // Splash (logo al inicio)
  const [showSplash, setShowSplash] = useState(true);

  // Modal imagen
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 850);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen text-white">
      {/* Fondo ULTRA PRO */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.20),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.18),transparent_55%)]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {/* Splash */}
      {showSplash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="absolute -inset-10 rounded-full bg-emerald-400/20 blur-3xl" />
              <Image
                src={IMPULSO_LOGO}
                alt="Impulso Energético"
                width={190}
                height={190}
                priority
              />
            </div>

            {/* Partner (si viene de sitio especial) */}
            {partnerLogoUrl ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={partnerLogoUrl}
                  alt="Logo del lugar"
                  className="h-8 w-8 object-contain rounded"
                />
                <div className="text-xs font-extrabold text-slate-200">
                  Acceso desde un lugar autorizado
                </div>
              </div>
            ) : null}

            <div className="text-center">
              <div className="text-sm tracking-[0.32em] uppercase text-slate-200 font-extrabold">
                Impulso Energético
              </div>
              <div className="mt-2 text-slate-400 text-xs font-semibold">
                Preparando ofertas y registro…
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-4 sm:px-8 pt-6">
        <div className="mx-auto w-full max-w-[1500px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-emerald-400/15 blur-2xl" />
              <Image
                src={IMPULSO_LOGO}
                alt="Impulso Energético"
                width={70}
                height={70}
                priority
                className="relative"
              />
            </div>

            <div className="leading-tight">
              <div className="text-xs sm:text-sm font-extrabold tracking-[0.28em] uppercase text-slate-200">
                Impulso Energético
              </div>

              <div className="text-[12px] sm:text-sm text-slate-300 font-semibold">
                Ofertas reales · Atención rápida · Ahorro
              </div>
            </div>
          </div>

          {/* Partner logo en header (si existe) */}
          {partnerLogoUrl ? (
            <div className="hidden md:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={partnerLogoUrl}
                alt="Logo del lugar"
                className="h-8 w-8 object-contain rounded"
              />
              <div className="text-xs font-extrabold text-slate-200">
                Lugar autorizado
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {/* Main */}
      <main className="px-4 sm:px-8 pb-28 sm:pb-10 pt-6">
        <div className="mx-auto w-full max-w-[1500px] grid lg:grid-cols-[1.55fr,0.85fr] gap-6 items-start">
          {/* Izquierda */}
          <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.45)] overflow-hidden">
            <div className="p-6 sm:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs sm:text-sm font-extrabold text-slate-200">
                ⚡ Acceso rápido desde QR / Enlace
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
                Ahorra en tu factura{" "}
                <span className="text-emerald-300">desde hoy</span>
              </h1>

              <p className="mt-4 text-base sm:text-lg lg:text-xl text-slate-200/90 font-semibold">
                {lugarNombre ? (
                  <>
                    Estás accediendo desde:{" "}
                    <span className="text-white font-extrabold">
                      {lugarNombre}
                    </span>
                    . Te ayudamos en 1 minuto.
                  </>
                ) : (
                  <>
                    Regístrate en 1 minuto y te buscamos la mejor opción en{" "}
                    <span className="font-extrabold text-white">
                      Luz, Gas y Telefonía
                    </span>
                    .
                  </>
                )}
              </p>

              {/* Chips */}
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "✅ Estudio gratis",
                  "🔥 Mejor precio",
                  "📞 Atención rápida",
                  "🎁 Recompensas por contratar",
                  "🔒 100% seguro",
                ].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-extrabold text-slate-100"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* CTAs (desktop) */}
              <div className="mt-8 hidden sm:grid grid-cols-2 gap-4">
                {/* REGISTRO (verde) */}
                <button
                  onClick={irRegistro}
                  className={cx(
                    "relative overflow-hidden rounded-2xl",
                    "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
                    "font-extrabold px-6 py-5 text-lg lg:text-xl",
                    "shadow-xl active:scale-[0.99] transition",
                    "hover:shadow-[0_0_0_6px_rgba(16,185,129,0.15)]"
                  )}
                >
                  <span className="relative z-10">✅ Registrarme (1 minuto)</span>
                  <span className="absolute inset-0 opacity-0 hover:opacity-100 transition">
                    <span className="absolute -inset-12 bg-white/20 blur-2xl animate-pulse" />
                  </span>
                </button>

                {/* VER OFERTAS (HOME pública) */}
                <button
                  onClick={irVerOfertas}
                  className={cx(
                    "relative overflow-hidden rounded-2xl",
                    "bg-amber-400 hover:bg-amber-300 text-slate-950",
                    "font-extrabold px-6 py-5 text-lg lg:text-xl",
                    "shadow-xl active:scale-[0.99] transition",
                    "hover:shadow-[0_0_0_6px_rgba(251,191,36,0.18)]"
                  )}
                >
                  <span className="relative z-10">👀 Ver ofertas primero</span>
                  <span className="absolute inset-0 opacity-0 hover:opacity-100 transition">
                    <span className="absolute -inset-12 bg-white/25 blur-2xl animate-pulse" />
                  </span>
                </button>
              </div>
            </div>

            {/* Cartel */}
            <div className="px-6 sm:px-10 pb-8">
              {fondoUrl ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="w-full text-left group"
                  aria-label="Ver cartel en grande"
                >
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/25 shadow-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fondoUrl}
                      alt="Cartel"
                      className="w-full h-auto max-h-[640px] object-contain bg-black/30"
                    />

                    {/* overlay hint */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-white">
                          Toca para verlo en grande
                        </span>
                        <span className="text-sm font-extrabold text-emerald-300 animate-bounce">
                          🔍 Zoom
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 font-extrabold">
                  ⚠️ No hay imagen activa. Activa una en “Fondos carteles”.
                </div>
              )}

              <p className="mt-4 text-sm text-slate-300 font-semibold">
                Tu acceso queda asociado al lugar/agente para trazabilidad y
                atención prioritaria.
              </p>
            </div>
          </section>

          {/* Derecha */}
          <aside className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.45)] p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Empieza ahora
            </h2>
            <p className="mt-2 text-base sm:text-lg text-slate-200/90 font-semibold">
              Consejo: regístrate primero para guardar tu acceso y desbloquear
              ofertas personalizadas.
            </p>

            <div className="mt-6 grid gap-4">
              <button
                onClick={irRegistro}
                className={cx(
                  "relative overflow-hidden rounded-2xl",
                  "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
                  "font-extrabold px-6 py-5 text-xl",
                  "shadow-2xl active:scale-[0.99] transition",
                  "hover:shadow-[0_0_0_7px_rgba(16,185,129,0.16)]"
                )}
              >
                <span className="relative z-10">✅ Registrarme gratis</span>
                <span className="absolute -inset-10 bg-white/20 blur-2xl opacity-60 animate-pulse" />
              </button>

              <button
                onClick={irVerOfertas}
                className={cx(
                  "relative overflow-hidden rounded-2xl",
                  "bg-amber-400 hover:bg-amber-300 text-slate-950",
                  "font-extrabold px-6 py-5 text-xl",
                  "shadow-2xl active:scale-[0.99] transition",
                  "hover:shadow-[0_0_0_7px_rgba(251,191,36,0.18)]"
                )}
              >
                <span className="relative z-10">👀 Ver ofertas</span>
                <span className="absolute -inset-10 bg-white/25 blur-2xl opacity-60 animate-pulse" />
              </button>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-base font-extrabold text-white">
                  Promesa Impulso
                </div>
                <p className="mt-2 text-sm text-slate-300 font-semibold">
                  Si hay mejora, te la ofrecemos. Si no, te lo decimos claro.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Sticky CTA móvil */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3">
        <div className="mx-auto max-w-[1500px] rounded-3xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl p-3 flex gap-2">
          <button
            onClick={irRegistro}
            className="flex-1 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold py-3 text-base active:scale-[0.99] transition"
          >
            Registrarme
          </button>
          <button
            onClick={irVerOfertas}
            className="flex-1 rounded-2xl bg-amber-400 text-slate-950 font-extrabold py-3 text-base active:scale-[0.99] transition"
          >
            Ver ofertas
          </button>
        </div>
      </div>

      {/* Modal imagen */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-6xl rounded-3xl border border-white/10 bg-slate-950/70 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="text-sm font-extrabold text-slate-100">
                Cartel promocional
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-extrabold text-white"
              >
                Cerrar ✕
              </button>
            </div>

            <div className="p-3 sm:p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fondoUrl ?? ""}
                alt="Cartel en grande"
                className="w-full h-auto object-contain rounded-2xl bg-black/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
