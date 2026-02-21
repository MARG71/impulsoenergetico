// src/app/share/lugar/[id]/ShareLugarClient.tsx
// src/app/share/lugar/[id]/ShareLugarClient.tsx
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const IMPULSO_LOGO = "/logo-impulso.png"; // ✅ pon aquí tu logo definitivo

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

export default function ShareLugarClient(props: {
  lugarNombre: string;
  especialMensaje: string;
  fondoUrl: string | null;
  fondoNombre: string | null;
  registroHref: string;
  ofertasHref: string;
  partnerLogoUrl?: string | null;
}) {
  const {
    lugarNombre,
    especialMensaje,
    fondoUrl,
    fondoNombre,
    registroHref,
    ofertasHref,
    partnerLogoUrl,
  } = props;

  const [zoom, setZoom] = useState(false);
  const [copied, setCopied] = useState(false);

  const bullets = useMemo(
    () => [
      "✅ Estudio gratis y sin compromiso",
      "✅ Ahorro real en tu factura",
      "✅ Recompensas por contratar",
    ],
    []
  );

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      alert("No se pudo copiar en este dispositivo");
    }
  }

  return (
    <main className="min-h-screen text-slate-100">
      {/* FONDO PRO */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.22),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.14),transparent_55%)]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      {/* CONTENEDOR FULL WIDTH */}
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 pt-6 pb-28 md:pb-10">
        {/* HERO CARD */}
        <section className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.55)] overflow-hidden">
          {/* Top bar + línea gruesa animada */}
          <div className="relative px-5 sm:px-7 lg:px-10 pt-6 pb-5">
            <div className="absolute inset-x-0 top-0 h-[5px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 opacity-90" />
            <div className="absolute inset-x-0 top-0 h-[5px] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)] animate-[pulse_1.6s_ease-in-out_infinite]" />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              {/* Logos grandes */}
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="absolute -inset-6 rounded-full bg-emerald-400/20 blur-2xl" />
                  <Image
                    src={IMPULSO_LOGO}
                    alt="Impulso Energético"
                    width={110}
                    height={110}
                    priority
                    className="relative h-[64px] w-[64px] sm:h-[78px] sm:w-[78px] lg:h-[92px] lg:w-[92px] object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[11px] sm:text-xs font-extrabold text-slate-200">
                    ⚡ Impulso Energético · Acceso rápido
                  </div>

                  <h1 className="mt-3 text-[30px] sm:text-[44px] lg:text-[56px] font-extrabold leading-[1.02] tracking-tight">
                    CON TU AYUDA,{" "}
                    <span className="text-emerald-300 drop-shadow">
                      NOS AYUDAS A CRECER
                    </span>
                  </h1>

                  <p className="mt-2 text-slate-200 font-extrabold text-base sm:text-lg">
                    📍 {lugarNombre}
                  </p>

                  <p className="mt-2 text-slate-300 text-sm sm:text-base lg:text-lg font-semibold max-w-[70ch]">
                    {especialMensaje}
                  </p>
                </div>
              </div>

              {/* Panel derecha: logo club + copiar */}
              <div className="flex flex-row lg:flex-col gap-3 lg:items-end">
                {partnerLogoUrl ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={partnerLogoUrl}
                      alt="Logo del lugar"
                      className="h-10 w-10 object-contain rounded bg-black/20 p-1"
                    />
                    <div className="text-xs font-extrabold text-slate-200">
                      Lugar autorizado
                    </div>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-xs font-extrabold text-slate-200">
                      Lugar autorizado
                    </span>
                  </div>
                )}

                <button
                  onClick={copiarEnlace}
                  type="button"
                  className={cx(
                    "group relative overflow-hidden rounded-2xl px-4 py-3 font-extrabold",
                    "border border-amber-300/40",
                    "bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950",
                    "shadow-[0_18px_60px_rgba(251,191,36,0.22)]",
                    "hover:shadow-[0_18px_70px_rgba(251,191,36,0.30)] transition"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    📎 {copied ? "¡Copiado!" : "Copiar enlace"}
                  </span>
                  <span className="relative z-10 block text-[11px] font-black opacity-90">
                    Compártelo y gana recompensas 🎁
                  </span>
                  <span className="absolute -inset-10 opacity-0 group-hover:opacity-100 transition">
                    <span className="absolute -inset-10 bg-white/25 blur-2xl animate-pulse" />
                  </span>
                </button>
              </div>
            </div>

            {/* Bullets grandes */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {bullets.map((b) => (
                <div
                  key={b}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm sm:text-base font-extrabold text-slate-100"
                >
                  {b}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GRID: CARTEL + CTA */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr,0.8fr] items-start">
          {/* CARTEL */}
          <section className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg sm:text-xl font-extrabold">
                  Mira esta oferta (imagen)
                </div>
                {fondoUrl ? (
                  <button
                    onClick={() => setZoom(true)}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs sm:text-sm font-extrabold text-slate-100 hover:bg-black/30 transition"
                    type="button"
                  >
                    🔍 Ver en grande
                  </button>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 bg-black/25">
                {fondoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fondoUrl}
                    alt={fondoNombre || "Imagen activa"}
                    className="w-full h-auto object-contain"
                  />
                ) : (
                  <div className="p-4 text-amber-200 font-extrabold">
                    ⚠️ No hay imagen activa. Activa una en “Fondos carteles”.
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm sm:text-base text-slate-200/90 font-semibold">
                👇 Abajo tienes los botones. Lee la imagen con calma y cuando
                quieras, sigues.
              </p>
            </div>
          </section>

          {/* CTA PRO */}
          <aside className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] p-5 sm:p-7">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Elige cómo empezar
            </h2>
            <p className="mt-2 text-base sm:text-lg text-slate-200/90 font-semibold">
              Recomendado:{" "}
              <span className="text-emerald-300 font-extrabold">
                regístrate primero
              </span>{" "}
              para guardar tu acceso y desbloquear recompensas.
            </p>

            <div className="mt-6 grid gap-4">
              <a
                href={registroHref}
                className={cx(
                  "group relative overflow-hidden rounded-2xl",
                  "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
                  "font-extrabold px-6 py-5 text-lg sm:text-xl",
                  "shadow-2xl active:scale-[0.99] transition",
                  "hover:shadow-[0_0_0_7px_rgba(16,185,129,0.16)]"
                )}
              >
                <span className="relative z-10">
                  ✅ Registrarme (1 minuto) 👇
                </span>
                <span className="absolute -inset-12 opacity-0 group-hover:opacity-100 transition">
                  <span className="absolute -inset-10 bg-white/25 blur-2xl animate-pulse" />
                </span>
              </a>

              <a
                href={ofertasHref}
                className={cx(
                  "group relative overflow-hidden rounded-2xl",
                  "bg-amber-400 hover:bg-amber-300 text-slate-950",
                  "font-extrabold px-6 py-5 text-lg sm:text-xl",
                  "shadow-2xl active:scale-[0.99] transition",
                  "hover:shadow-[0_0_0_7px_rgba(251,191,36,0.18)]"
                )}
              >
                <span className="relative z-10">👀 Ver ofertas primero 👇</span>
                <span className="absolute -inset-12 opacity-0 group-hover:opacity-100 transition">
                  <span className="absolute -inset-10 bg-white/25 blur-2xl animate-pulse" />
                </span>
              </a>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-lg font-extrabold text-white">
                  Promesa Impulso
                </div>
                <p className="mt-2 text-base text-slate-200 font-semibold">
                  Si hay mejora, te la ofrecemos. Si no, te lo decimos claro.
                </p>
              </div>

              <p className="text-sm text-slate-300 font-semibold">
                Tu acceso queda asociado al lugar para trazabilidad y atención
                prioritaria.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* BARRA INFERIOR MÓVIL (CTA) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3">
        <div className="mx-auto max-w-[1600px] rounded-3xl border border-white/10 bg-slate-950/75 backdrop-blur-xl shadow-2xl p-3 flex gap-2">
          <a
            href={ofertasHref}
            className="flex-1 rounded-2xl bg-amber-400 text-slate-950 font-extrabold py-3 text-base active:scale-[0.99] transition text-center"
          >
            Ver ofertas
          </a>
          <a
            href={registroHref}
            className="flex-1 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold py-3 text-base active:scale-[0.99] transition text-center"
          >
            Registrarme
          </a>
        </div>
      </div>

      {/* MODAL ZOOM */}
      {zoom && fondoUrl ? (
        <div
          className="fixed inset-0 z-50 bg-black/80 p-4 md:p-10 flex items-center justify-center"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-6xl w-full rounded-3xl border border-white/10 bg-slate-950/70 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="font-extrabold text-slate-200 text-sm">
                {fondoNombre ? fondoNombre : "Imagen"}
              </div>
              <button
                className="rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-extrabold text-white"
                type="button"
                onClick={() => setZoom(false)}
              >
                ✖ Cerrar
              </button>
            </div>

            <div className="p-3 md:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fondoUrl}
                alt={fondoNombre || "Imagen"}
                className="w-full h-auto object-contain rounded-2xl bg-black/20"
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
