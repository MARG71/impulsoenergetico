"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  qs: string;
  lugarNombre: string | null;
  fondoUrl: string | null;
};

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

export default function OfertasContenido({ qs, lugarNombre, fondoUrl }: Props) {
  const router = useRouter();

  const qsFinal = useMemo(() => (qs ? `?${qs}` : ""), [qs]);

  const irRegistro = () => router.push(`/registro${qsFinal}`);
  const irOfertas = () => router.push(`/bienvenida${qsFinal}`); // ✅ si quieres “ofertas” a otra ruta, dime y lo ajusto

  // Splash (logo al inicio)
  const [showSplash, setShowSplash] = useState(true);

  // Modal imagen
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 900);
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.18),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.16),transparent_55%)]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {/* Splash */}
      {showSplash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-emerald-400/20 blur-2xl" />
              <Image
                src="/LOGO-DEFINITIVO-IMPULSO-ENERGETICO.png"
                alt="Impulso Energético"
                width={140}
                height={140}
                priority
              />
            </div>
            <div className="text-center">
              <div className="text-sm tracking-[0.28em] uppercase text-slate-300 font-bold">
                Impulso Energético
              </div>
              <div className="mt-1 text-slate-400 text-xs font-semibold">
                Cargando ofertas…
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-5 pt-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-emerald-400/15 blur-xl" />
              <Image
                src="/LOGO-DEFINITIVO-IMPULSO-ENERGETICO.png"
                alt="Impulso Energético"
                width={54}
                height={54}
                priority
                className="relative"
              />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-extrabold tracking-[0.24em] uppercase text-slate-200">
                Impulso Energético
              </div>
              <div className="text-[12px] text-slate-300 font-semibold">
                Ofertas reales · Ahorro inmediato
              </div>
            </div>
          </div>

          <button
            onClick={irRegistro}
            className="hidden sm:inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2"
          >
            Registrarme
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="px-5 pb-28 sm:pb-10 pt-6">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.1fr,0.9fr] gap-6 items-start">
          {/* Columna izquierda */}
          <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.45)] overflow-hidden">
            {/* Hero */}
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-slate-200">
                ⚡ Acceso rápido desde QR
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold leading-tight">
                Ahorra en tu factura{" "}
                <span className="text-emerald-300">desde hoy</span>
              </h1>

              <p className="mt-3 text-slate-200/90 font-semibold">
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
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "✅ Estudio gratis",
                  "🔥 Mejor precio",
                  "📞 Atención rápida",
                  "🎁 Recompensas por contratar",
                  "🔒 100% seguro",
                ].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-extrabold text-slate-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Cartel */}
            <div className="px-6 sm:px-8 pb-7">
              {fondoUrl ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="w-full text-left group"
                  aria-label="Ver cartel en grande"
                >
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/25 shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fondoUrl}
                      alt="Cartel"
                      className={cx(
                        "w-full h-auto",
                        "max-h-[520px] object-contain bg-black/30"
                      )}
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white">
                          Toca para ver en grande
                        </span>
                        <span className="text-xs font-extrabold text-emerald-300">
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

              <p className="mt-3 text-xs text-slate-300 font-semibold">
                Tu acceso quedará asociado al lugar/agente para trazabilidad y
                atención prioritaria.
              </p>
            </div>
          </section>

          {/* Columna derecha */}
          <aside className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.45)] p-6 sm:p-8">
            <h2 className="text-xl font-extrabold">
              ¿Qué quieres hacer ahora?
            </h2>
            <p className="mt-2 text-slate-200/90 font-semibold">
              Te recomendamos registrarte primero para guardar tu acceso y
              desbloquear ofertas personalizadas.
            </p>

            <div className="mt-5 grid gap-3">
              <button
                onClick={irRegistro}
                className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-4 text-lg shadow-xl active:scale-[0.99] transition"
              >
                ✅ Registrarme (1 minuto)
              </button>

              <button
                onClick={irOfertas}
                className="rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-extrabold px-5 py-4 text-lg active:scale-[0.99] transition"
              >
                👀 Ver ofertas primero
              </button>

              <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-extrabold text-white">
                  Promesa Impulso
                </div>
                <p className="mt-1 text-xs text-slate-300 font-semibold">
                  Si hay mejora, te la ofrecemos. Si no, te lo decimos claro.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Sticky CTA móvil */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl p-3 flex gap-2">
          <button
            onClick={irRegistro}
            className="flex-1 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold py-3"
          >
            Registrarme
          </button>
          <button
            onClick={irOfertas}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 text-white font-extrabold py-3"
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
            className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-slate-950/70 overflow-hidden shadow-2xl"
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
