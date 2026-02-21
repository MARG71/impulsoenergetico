"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  qs: string;
  lugarNombre: string | null;
  fondoUrl: string | null;

  partnerLogoUrl?: string | null;

  // ✅ HOME pública ("/" o "/home")
  homePath?: string;
};

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

const IMPULSO_LOGO = "/logo-impulso-definitivo.png";

function withQS(path: string, qs: string) {
  if (!qs) return path;
  return path.includes("?") ? `${path}&${qs}` : `${path}?${qs}`;
}

export default function OfertasContenido({
  qs,
  lugarNombre,
  fondoUrl,
  partnerLogoUrl,
  homePath = "/",
}: Props) {
  const router = useRouter();

  const qsFinal = useMemo(() => (qs ? `?${qs}` : ""), [qs]);

  const irRegistro = () => router.push(`/registro${qsFinal}`);
  const irVerOfertas = () => router.push(withQS(homePath, qs));

  const [showSplash, setShowSplash] = useState(true);
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.22),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.20),transparent_55%)]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {/* Splash */}
      {showSplash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="absolute -inset-12 rounded-full bg-emerald-400/25 blur-3xl" />
              <Image
                src={IMPULSO_LOGO}
                alt="Impulso Energético"
                width={230}
                height={230}
                priority
              />
            </div>

            {partnerLogoUrl ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={partnerLogoUrl}
                  alt="Logo del lugar"
                  className="h-10 w-10 object-contain rounded bg-white/90 p-1"
                />
                <div className="text-sm font-extrabold text-slate-100">
                  Acceso desde un lugar autorizado
                </div>
              </div>
            ) : null}

            <div className="text-center">
              <div className="text-base tracking-[0.35em] uppercase text-slate-100 font-extrabold">
                Impulso Energético
              </div>
              <div className="mt-2 text-slate-300 text-sm font-semibold">
                Preparando ofertas y registro…
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-4 sm:px-8 pt-6">
        <div className="mx-auto w-full max-w-[1500px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-5 rounded-full bg-emerald-400/20 blur-2xl" />
              <Image
                src={IMPULSO_LOGO}
                alt="Impulso Energético"
                width={110}
                height={110}
                priority
                className="relative"
              />
            </div>

            <div className="leading-tight">
              <div className="text-sm sm:text-base font-extrabold tracking-[0.32em] uppercase text-slate-100">
                Impulso Energético
              </div>

              {/* Subrayado animado pro */}
              <div className="relative mt-1 inline-block">
                <div className="text-[13px] sm:text-base text-slate-200 font-semibold">
                  Ofertas reales · Atención rápida · Ahorro
                </div>
                <div className="mt-1 h-[3px] w-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300 opacity-80 animate-pulse" />
              </div>
            </div>
          </div>

          {partnerLogoUrl ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={partnerLogoUrl}
                alt="Logo del lugar"
                className="h-10 w-10 object-contain rounded bg-white/90 p-1"
              />
              <div className="text-sm font-extrabold text-slate-100">
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
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm font-extrabold text-slate-100">
                ⚡ Acceso rápido desde QR / Enlace
              </div>

              <h1 className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.04]">
                Ahorra en tu factura{" "}
                <span className="text-emerald-300 drop-shadow-[0_0_18px_rgba(16,185,129,0.35)]">
                  desde hoy
                </span>
              </h1>

              <p className="mt-4 text-lg sm:text-xl lg:text-2xl text-slate-100/95 font-semibold">
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
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-slate-100"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* CTAs (desktop) */}
              <div className="mt-8 hidden sm:grid grid-cols-2 gap-4">
                <button
                  onClick={irRegistro}
                  className={cx(
                    "relative overflow-hidden rounded-2xl",
                    "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
                    "font-extrabold px-6 py-5 text-xl lg:text-2xl",
                    "shadow-2xl active:scale-[0.99] transition",
                    "hover:shadow-[0_0_0_8px_rgba(16,185,129,0.16)]"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    ✅ Registrarme (1 minuto){" "}
                    <span className="animate-bounce">👇</span>
                  </span>
                  <span className="absolute -inset-16 bg-white/25 blur-3xl opacity-70 animate-pulse" />
                </button>

                <button
                  onClick={irVerOfertas}
                  className={cx(
                    "relative overflow-hidden rounded-2xl",
                    "bg-amber-400 hover:bg-amber-300 text-slate-950",
                    "font-extrabold px-6 py-5 text-xl lg:text-2xl",
                    "shadow-2xl active:scale-[0.99] transition",
                    "hover:shadow-[0_0_0_8px_rgba(251,191,36,0.20)]"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    👀 Ver ofertas primero <span className="animate-bounce">👇</span>
                  </span>
                  <span className="absolute -inset-16 bg-white/30 blur-3xl opacity-70 animate-pulse" />
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
                  <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-black/25 shadow-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fondoUrl}
                      alt="Imagen activa"
                      className="w-full h-auto max-h-[680px] object-contain bg-black/30"
                    />

                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="text-base font-extrabold text-white">
                          Toca para verlo en grande
                        </span>
                        <span className="text-base font-extrabold text-emerald-300 animate-bounce">
                          🔍 Zoom
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-200 font-extrabold text-lg">
                  ⚠️ No hay imagen activa. Activa una en “Marketing / Fondos”.
                </div>
              )}

              <p className="mt-4 text-base text-slate-200 font-semibold">
                Tu acceso queda asociado al lugar/agente para trazabilidad y
                atención prioritaria.
              </p>
            </div>
          </section>

          {/* Derecha */}
          <aside className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.45)] p-6 sm:p-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Empieza ahora
            </h2>
            <p className="mt-2 text-lg sm:text-xl text-slate-100/95 font-semibold">
              Consejo: regístrate primero para guardar tu acceso y desbloquear
              ofertas personalizadas.
            </p>

            <div className="mt-6 grid gap-4">
              <button
                onClick={irRegistro}
                className={cx(
                  "relative overflow-hidden rounded-2xl",
                  "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
                  "font-extrabold px-6 py-5 text-2xl",
                  "shadow-2xl active:scale-[0.99] transition",
                  "hover:shadow-[0_0_0_10px_rgba(16,185,129,0.18)]"
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  ✅ Registrarme gratis <span className="animate-bounce">👇</span>
                </span>
                <span className="absolute -inset-12 bg-white/20 blur-3xl opacity-70 animate-pulse" />
              </button>

              <button
                onClick={irVerOfertas}
                className={cx(
                  "relative overflow-hidden rounded-2xl",
                  "bg-amber-400 hover:bg-amber-300 text-slate-950",
                  "font-extrabold px-6 py-5 text-2xl",
                  "shadow-2xl active:scale-[0.99] transition",
                  "hover:shadow-[0_0_0_10px_rgba(251,191,36,0.22)]"
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  👀 Ver ofertas <span className="animate-bounce">👇</span>
                </span>
                <span className="absolute -inset-12 bg-white/25 blur-3xl opacity-70 animate-pulse" />
              </button>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                <div className="text-xl sm:text-2xl font-extrabold text-white">
                  Promesa Impulso
                </div>
                <p className="mt-3 text-base sm:text-lg text-slate-200 font-semibold">
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
            className="flex-1 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold py-4 text-lg shadow-lg active:scale-[0.99] transition animate-pulse"
          >
            Registrarme 👇
          </button>
          <button
            onClick={irVerOfertas}
            className="flex-1 rounded-2xl bg-amber-400 text-slate-950 font-extrabold py-4 text-lg shadow-lg active:scale-[0.99] transition animate-pulse"
          >
            Ver ofertas 👇
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
              <div className="text-base font-extrabold text-slate-100">
                Imagen activa (redes / WhatsApp)
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-extrabold text-white"
              >
                Cerrar ✕
              </button>
            </div>

            <div className="p-3 sm:p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fondoUrl ?? ""}
                alt="Imagen en grande"
                className="w-full h-auto object-contain rounded-2xl bg-black/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
