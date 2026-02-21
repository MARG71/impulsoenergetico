// src/app/share/lugar/[id]/ShareLugarClient.tsx
"use client";

import { useMemo, useState } from "react";

export default function ShareLugarClient(props: {
  lugarNombre: string;
  especialMensaje: string;
  fondoUrl: string | null;
  fondoNombre: string | null;
  registroHref: string;
  ofertasHref: string;
}) {
  const { lugarNombre, especialMensaje, fondoUrl, fondoNombre, registroHref, ofertasHref } = props;

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
      alert("✅ Enlace copiado");
    } catch {
      alert("No se pudo copiar en este dispositivo");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Contenedor principal */}
      <div className="mx-auto max-w-4xl px-4 pt-6 pb-28 md:pb-10">
        {/* Header */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-xs font-extrabold text-slate-200">
                ⚡ Impulso Energético · Acceso rápido
              </div>

              <h1 className="mt-3 text-2xl md:text-4xl font-extrabold tracking-tight">
                CON TU AYUDA, NOS AYUDAS A CRECER
              </h1>

              <p className="mt-2 text-slate-200 font-bold">
                📍 {lugarNombre}
              </p>

              <p className="mt-2 text-slate-300 text-sm md:text-base font-semibold">
                {especialMensaje}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {bullets.map((b) => (
                  <div
                    key={b}
                    className="rounded-2xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs md:text-sm font-bold text-slate-200"
                  >
                    {b}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={copiarEnlace}
              className="hidden md:inline-flex items-center justify-center rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-3 font-extrabold"
              type="button"
            >
              📎 Copiar enlace
            </button>
          </div>
        </div>

        {/* Póster (se ve completo, sin recortar) */}
        <div className="mt-5 rounded-3xl border border-slate-800 bg-black/30 overflow-hidden">
          {fondoUrl ? (
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs md:text-sm font-extrabold text-slate-200">
                  {fondoNombre ? `🖼️ ${fondoNombre}` : "🖼️ Imagen informativa"}
                </div>

                <button
                  type="button"
                  onClick={() => setZoom(true)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-extrabold"
                >
                  🔍 Ver grande
                </button>
              </div>

              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fondoUrl}
                  alt={fondoNombre || "Imagen activa"}
                  className="w-full h-auto object-contain"
                />
              </div>

              <p className="mt-3 text-xs md:text-sm text-slate-300 font-semibold">
                👇 Abajo tienes los botones para continuar. Puedes leer la imagen con calma y cuando quieras, sigues.
              </p>
            </div>
          ) : (
            <div className="p-4 text-amber-200 font-extrabold">
              ⚠️ No hay imagen activa. Activa una en “Fondos carteles”.
            </div>
          )}
        </div>

        {/* Bloque PRO de decisión (debajo de la imagen) */}
        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 md:p-7">
          <h2 className="text-lg md:text-2xl font-extrabold">
            ¿Listo para ahorrar?
          </h2>
          <p className="mt-2 text-slate-300 font-semibold text-sm md:text-base">
            Elige una opción:
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={registroHref}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-4 text-base md:text-lg"
            >
              ✅ Ir al registro (1 minuto)
            </a>

            <a
              href={ofertasHref}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold px-6 py-4 text-base md:text-lg"
            >
              👀 Ver ofertas primero
            </a>
          </div>

          <p className="mt-4 text-xs md:text-sm text-slate-400 font-bold">
            Tu acceso queda asociado al lugar y al agente para mantener trazabilidad y atención prioritaria.
          </p>

          <button
            onClick={copiarEnlace}
            className="mt-4 md:hidden inline-flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/30 hover:bg-slate-950/50 px-6 py-4 font-extrabold"
            type="button"
          >
            📎 Copiar enlace
          </button>
        </div>
      </div>

      {/* Barra inferior móvil (CTA fijo) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
          <a
            href={ofertasHref}
            className="flex-1 inline-flex items-center justify-center rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold px-4 py-3 text-sm"
          >
            Ver ofertas
          </a>
          <a
            href={registroHref}
            className="flex-1 inline-flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-3 text-sm"
          >
            Registrarme
          </a>
        </div>
      </div>

      {/* Modal zoom */}
      {zoom && fondoUrl ? (
        <div
          className="fixed inset-0 z-50 bg-black/80 p-4 md:p-10 flex items-center justify-center"
          onClick={() => setZoom(false)}
          role="button"
        >
          <div
            className="max-w-5xl w-full rounded-3xl border border-slate-700 bg-slate-950/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="font-extrabold text-slate-200 text-sm">
                {fondoNombre ? fondoNombre : "Imagen"}
              </div>
              <button
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-extrabold"
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
                className="w-full h-auto object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
