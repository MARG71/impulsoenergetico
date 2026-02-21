// src/app/share/lugar/[id]/ShareLugarClient.tsx
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const IMPULSO_LOGO = "/logo-impulso-definitivo.png"; // usa el tuyo

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

export default function ShareLugarClient(props: {
  lugarNombre: string;
  especialMensaje: string;
  imagenUrl: string | null;
  partnerLogoUrl: string | null;
  registroHref: string;
  ofertasHref: string;
}) {
  const {
    lugarNombre,
    especialMensaje,
    imagenUrl,
    partnerLogoUrl,
    registroHref,
    ofertasHref,
  } = props;

  const [zoom, setZoom] = useState(false);

  const bullets = useMemo(
    () => [
      "✅ Estudio gratuito y sin compromiso",
      "✅ Ahorro real en tu factura",
      "✅ Recompensas por contratar servicios",
    ],
    []
  );

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Más pro que alert:
      const el = document.getElementById("toast-share");
      if (el) {
        el.classList.remove("opacity-0", "translate-y-2");
        el.classList.add("opacity-100", "translate-y-0");
        setTimeout(() => {
          el.classList.add("opacity-0", "translate-y-2");
          el.classList.remove("opacity-100", "translate-y-0");
        }, 1600);
      }
    } catch {
      alert("No se pudo copiar en este dispositivo");
    }
  }

  return (
    <main className="min-h-screen text-white">
      {/* Fondo ULTRA */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.22),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.18),transparent_55%)]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {/* Toast copiado */}
      <div
        id="toast-share"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 opacity-0 translate-y-2 transition-all duration-300"
      >
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur px-4 py-3 shadow-2xl">
          <div className="text-sm font-extrabold text-emerald-300">
            ✅ Enlace copiado
          </div>
          <div className="text-xs text-slate-300 font-semibold">
            Ya puedes pegarlo donde quieras.
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6 pb-28 md:pb-10">
        {/* HEADER PRO */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.45)] p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              {/* Logo Impulso grande */}
              <div className="relative shrink-0">
                <div className="absolute -inset-6 rounded-full bg-emerald-400/20 blur-2xl" />
                <Image
                  src={IMPULSO_LOGO}
                  alt="Impulso Energético"
                  width={110}
                  height={110}
                  priority
                  className="relative rounded-2xl"
                />
              </div>

              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs md:text-sm font-extrabold text-slate-100">
                  ⚡ Impulso Energético · Acceso rápido
                </div>

                <h1 className="mt-4 text-3xl md:text-5xl font-extrabold leading-[1.05] tracking-tight">
                  CON TU AYUDA,{" "}
                  <span className="text-emerald-300 drop-shadow-[0_0_18px_rgba(16,185,129,0.35)]">
                    NOS AYUDAS A CRECER
                  </span>
                </h1>

                <p className="mt-3 text-slate-100 font-extrabold text-base md:text-xl">
                  📍 {lugarNombre}
                </p>

                <p className="mt-2 text-slate-200/90 text-sm md:text-lg font-semibold">
                  {especialMensaje}
                </p>

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {bullets.map((b) => (
                    <div
                      key={b}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs md:text-sm font-extrabold text-slate-100"
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Partner + Copiar */}
            <div className="hidden md:flex flex-col gap-3 items-end">
              {partnerLogoUrl ? (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partnerLogoUrl}
                    alt="Logo partner"
                    className="h-12 w-12 object-contain rounded bg-white/90 p-1"
                  />
                  <div className="text-sm font-extrabold text-slate-100">
                    Lugar autorizado
                  </div>
                </div>
              ) : null}

              <button
                onClick={copiarEnlace}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 hover:bg-slate-950/65 px-5 py-3 font-extrabold text-sm shadow-xl"
                type="button"
              >
                📎 Copiar enlace
              </button>
            </div>
          </div>

          {/* Subrayado animado */}
          <div className="mt-5 h-[3px] w-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300 opacity-80 animate-pulse" />
        </div>

        {/* IMAGEN (Marketing / WhatsApp) */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 backdrop-blur overflow-hidden shadow-2xl">
          {imagenUrl ? (
            <div className="p-3 md:p-4">
              <button
                type="button"
                onClick={() => setZoom(true)}
                className="w-full text-left group"
              >
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagenUrl}
                    alt="Imagen compartida"
                    className="w-full h-auto object-contain"
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-sm md:text-base font-extrabold text-white">
                        Toca para ver en grande
                      </span>
                      <span className="text-sm md:text-base font-extrabold text-emerald-300 animate-bounce">
                        🔍 Zoom
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              <p className="mt-3 text-sm md:text-base text-slate-200 font-semibold">
                👇 Baja y elige una opción. Recomendación:{" "}
                <span className="font-extrabold text-white">regístrate</span>{" "}
                para que te atendamos más rápido.
              </p>
            </div>
          ) : (
            <div className="p-5 text-amber-200 font-extrabold text-lg">
              ⚠️ No hay imagen activa (Marketing). Activa una para compartir por
              WhatsApp/redes.
            </div>
          )}
        </div>

        {/* DECISIÓN (sin repetir pasos) */}
        <div className="mt-7 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_90px_rgba(0,0,0,0.35)] p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-extrabold">
            Elige cómo quieres empezar
          </h2>
          <p className="mt-2 text-slate-200 font-semibold text-base md:text-lg">
            (1) Registro rápido para desbloquear ofertas personalizadas, o (2)
            ver ofertas directamente.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={registroHref}
              className={cx(
                "relative overflow-hidden rounded-2xl",
                "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
                "font-extrabold px-6 py-5 text-lg md:text-xl",
                "shadow-2xl transition active:scale-[0.99]",
                "hover:shadow-[0_0_0_10px_rgba(16,185,129,0.18)]"
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                ✅ Registrarme (1 minuto) <span className="animate-bounce">👇</span>
              </span>
              <span className="absolute -inset-16 bg-white/25 blur-3xl opacity-70 animate-pulse" />
            </a>

            <a
              href={ofertasHref}
              className={cx(
                "relative overflow-hidden rounded-2xl",
                "bg-amber-400 hover:bg-amber-300 text-slate-950",
                "font-extrabold px-6 py-5 text-lg md:text-xl",
                "shadow-2xl transition active:scale-[0.99]",
                "hover:shadow-[0_0_0_10px_rgba(251,191,36,0.22)]"
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                👀 Ver ofertas ahora <span className="animate-bounce">👇</span>
              </span>
              <span className="absolute -inset-16 bg-white/30 blur-3xl opacity-70 animate-pulse" />
            </a>
          </div>

          <p className="mt-4 text-sm md:text-base text-slate-300 font-semibold">
            Tu acceso queda asociado al lugar y al agente para trazabilidad y
            atención prioritaria.
          </p>

          <button
            onClick={copiarEnlace}
            className="mt-4 md:hidden inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 hover:bg-slate-950/65 px-6 py-4 font-extrabold"
            type="button"
          >
            📎 Copiar enlace
          </button>
        </div>
      </div>

      {/* Barra inferior móvil */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <a
            href={ofertasHref}
            className="flex-1 inline-flex items-center justify-center rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-4 py-3 text-base shadow-lg"
          >
            Ver ofertas 👇
          </a>
          <a
            href={registroHref}
            className="flex-1 inline-flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-3 text-base shadow-lg"
          >
            Registrarme 👇
          </a>
        </div>
      </div>

      {/* Modal zoom */}
      {zoom && imagenUrl ? (
        <div
          className="fixed inset-0 z-50 bg-black/80 p-4 md:p-10 flex items-center justify-center"
          onClick={() => setZoom(false)}
          role="button"
        >
          <div
            className="max-w-6xl w-full rounded-3xl border border-white/10 bg-slate-950/70 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="font-extrabold text-slate-100 text-sm md:text-base">
                Imagen compartida
              </div>
              <button
                className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-extrabold"
                type="button"
                onClick={() => setZoom(false)}
              >
                ✖ Cerrar
              </button>
            </div>

            <div className="p-3 md:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagenUrl}
                alt="Imagen"
                className="w-full h-auto object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
