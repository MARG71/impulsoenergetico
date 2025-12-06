"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

type ExtraParams = Record<string, string>;

function useBuildQuery() {
  const searchParams = useSearchParams();

  const nombre = searchParams.get("nombre") || "";
  const agenteId = searchParams.get("agenteId") || "";
  const lugarId = searchParams.get("lugarId") || "";

  const buildQuery = (extra?: ExtraParams) => {
    const p = new URLSearchParams();

    if (nombre) p.set("nombre", nombre);
    if (agenteId) p.set("agenteId", agenteId);
    if (lugarId) p.set("lugarId", lugarId);

    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        if (v != null) p.set(k, v);
      });
    }

    const qs = p.toString();
    return qs ? `?${qs}` : "";
  };

  return { nombre: nombre || null, agenteId, lugarId, buildQuery };
}

export default function BateriaHermesLanding() {
  const router = useRouter();
  const { nombre, agenteId, lugarId, buildQuery } = useBuildQuery();

  const irBienvenida = () => router.push(`/bienvenida${buildQuery()}`);
  const irSolar = () => router.push(`/solar${buildQuery()}`);
  const irComparadorLuz = () =>
    router.push(`/comparador${buildQuery({ tipo: "luz" })}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 md:py-10">
        {/* CABECERA */}
        <header className="flex items-center justify-between gap-4 mb-8 md:mb-10">
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-44 sm:h-12 sm:w-56">
              <Image
                src="/logo-impulso.png"
                alt="Impulso Energético"
                fill
                className="object-contain drop-shadow-[0_0_24px_rgba(16,185,129,0.8)]"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] md:text-xs tracking-[0.30em] uppercase text-purple-300 font-semibold">
                IMPULSO ENERGÉTICO · SISTEMA HERMES-IA
              </span>
              <span className="text-xs text-slate-300">
                Acumulación inteligente para tu energía solar
              </span>
            </div>
          </div>

          <button
            onClick={irBienvenida}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-xs md:text-sm text-slate-100 hover:bg-slate-800"
          >
            ← Volver a la pantalla principal
          </button>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-purple-500/60 bg-gradient-to-br from-purple-600/25 via-purple-500/5 to-slate-950/95 p-6 md:p-10 shadow-[0_0_40px_rgba(126,34,206,0.7)] mb-8 md:mb-10">
          <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-500/35 blur-3xl" />
          <span className="pointer-events-none absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-emerald-300/15 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)] items-center relative z-10">
            <div className="space-y-4">
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-purple-200 uppercase">
                HERMES-IA · BATERÍA INTELIGENTE
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                {nombre && (
                  <>
                    Hola,{" "}
                    <span className="text-purple-200 font-extrabold">
                      {nombre}
                    </span>
                    ,{" "}
                  </>
                )}
                guarda tu energía solar y úsala{" "}
                <span className="text-emerald-300">
                  justo cuando más te interesa
                </span>
                .
              </h1>

              <p className="text-sm md:text-base text-slate-100/90 max-w-2xl">
                El sistema HERMES-IA acumula tus excedentes solares y decide
                automáticamente cuándo usarlos para reducir al máximo tus
                compras de energía de la red, protegiéndote de las horas caras y
                de subidas de precio.
              </p>

              {(agenteId || lugarId) && (
                <p className="text-[11px] text-purple-100/90">
                  QR detectado ·{" "}
                  {agenteId && (
                    <>
                      Agente: <b>{agenteId}</b>{" "}
                    </>
                  )}
                  {lugarId && (
                    <>
                      · Lugar: <b>{lugarId}</b>
                    </>
                  )}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={irSolar}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-emerald-500/60 hover:bg-emerald-400"
                >
                  Ver opciones de solar + batería
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/registro${buildQuery({ origen: "bateria-hermes" })}`
                    )
                  }
                  className="inline-flex items-center justify-center rounded-full border border-purple-300/70 bg-slate-950/70 px-5 py-2.5 text-xs md:text-sm font-semibold text-purple-100 hover:bg-slate-900"
                >
                  Quiero un estudio de batería HERMES-IA
                </button>
              </div>
            </div>

            {/* Tarjeta simulación */}
            <div className="relative h-52 sm:h-60 lg:h-72">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-purple-400/60 shadow-[0_0_35px_rgba(76,29,149,0.9)] flex flex-col justify-between p-5">
                <div className="flex items-center justify-between text-xs text-slate-200">
                  <span className="font-semibold">Simulación HERMES-IA</span>
                  <span className="text-emerald-300 text-[11px]">
                    Optimización automática
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">
                      Ahorro adicional sobre solo solar
                    </span>
                    <span className="font-semibold text-emerald-300">
                      +15–30%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Autoconsumo real</span>
                    <span className="font-semibold text-amber-300">
                      hasta 80–90%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">
                      Protección frente a horas punta
                    </span>
                    <span className="font-semibold text-sky-300">
                      descarga inteligente
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  *Valores orientativos. El estudio real se ajusta a tus curvas
                  de consumo, potencia instalada, tamaño de batería y tarifas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUES DE BENEFICIOS */}
        <section className="grid gap-5 lg:grid-cols-3 mb-8 md:mb-10">
          <div className="rounded-2xl border border-emerald-600/80 bg-slate-950/90 p-5 shadow-lg shadow-emerald-900/50">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              🔋 Usa tu energía cuando la red está más cara
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Carga batería en horas baratas o con excedentes solares.</li>
              <li>• Descarga automática en tramos punta o caros.</li>
              <li>• Menos dependencia de cambios horarios en la tarifa.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-purple-600/80 bg-gradient-to-br from-purple-500/10 via-slate-950 to-slate-950 p-5 shadow-lg shadow-purple-900/50">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              🧠 Inteligencia artificial al servicio del ahorro
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Algoritmos que aprenden tu perfil de consumo.</li>
              <li>• Decisiones automáticas de carga/descarga.</li>
              <li>• Preparado para integrar coche eléctrico, aerotermia, etc.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-sky-700/80 bg-slate-950/95 p-5 shadow-lg shadow-sky-900/40">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              🏠 Seguridad, continuidad y monitorización
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Equipos de alta calidad y garantías del fabricante.</li>
              <li>• Monitorización para ver en tiempo real tu ahorro.</li>
              <li>• Integrable en proyectos nuevos o instalaciones existentes.</li>
            </ul>
          </div>
        </section>

        {/* PASOS */}
        <section className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 md:p-7 mb-10">
          <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
            📋 Pasos para tu proyecto HERMES-IA
          </h2>

          <div className="grid gap-4 md:grid-cols-4 text-xs md:text-sm">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-purple-300 mb-1">
                1 · Análisis de consumo y solar
              </p>
              <p className="text-slate-200">
                Estudiamos tu curva de consumo, potencia contratada e
                instalación solar (actual o prevista).
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-purple-300 mb-1">
                2 · Dimensionamiento batería
              </p>
              <p className="text-slate-200">
                Calculamos capacidad óptima para equilibrar inversión, ahorro y
                autonomía.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-purple-300 mb-1">
                3 · Instalación y configuración IA
              </p>
              <p className="text-slate-200">
                Dejamos funcionando la batería y la lógica HERMES-IA adaptada a
                tus hábitos.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-purple-300 mb-1">
                4 · Seguimiento y ajustes
              </p>
              <p className="text-slate-200">
                Revisamos los primeros meses para ajustar parámetros y maximizar
                el ahorro real.
              </p>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-slate-800 pt-4 text-[11px] md:text-xs text-slate-400">
          <span>© 2025 Impulso Energético · Sistema HERMES-IA</span>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={irComparadorLuz}
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Ver impacto de solar + batería en mi factura
            </button>
            <button
              onClick={irBienvenida}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900"
            >
              Volver a bienvenida
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
