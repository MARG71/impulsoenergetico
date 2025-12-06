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

export default function AerotermiaLanding() {
  const router = useRouter();
  const { nombre, agenteId, lugarId, buildQuery } = useBuildQuery();

  const irPantallaPrincipal = () => {
    router.push(`/bienvenida${buildQuery()}`);
  };

  const irComparadorLuz = () => {
    router.push(`/comparador${buildQuery({ tipo: "luz" })}`);
  };

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
                className="object-contain drop-shadow-[0_0_24px_rgba(34,211,238,0.8)]"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] md:text-xs tracking-[0.30em] uppercase text-cyan-300 font-semibold">
                IMPULSO ENERGÉTICO · ESPECIAL AEROTERMIA
              </span>
              <span className="text-xs text-slate-300">
                Calefacción, refrigeración y ACS de alta eficiencia
              </span>
            </div>
          </div>

          <button
            onClick={irPantallaPrincipal}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-xs md:text-sm text-slate-100 hover:bg-slate-800"
          >
            ← Volver a la pantalla principal
          </button>
        </header>

        {/* HERO PRINCIPAL */}
        <section className="relative overflow-hidden rounded-3xl border border-cyan-400/60 bg-gradient-to-br from-cyan-500/25 via-cyan-500/5 to-slate-950/95 p-6 md:p-10 shadow-[0_0_40px_rgba(8,145,178,0.7)] mb-8 md:mb-10">
          <span className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-cyan-400/30 blur-3xl" />
          <span className="pointer-events-none absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-emerald-300/15 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr),minmax(0,1fr)] items-center relative z-10">
            <div className="space-y-4">
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-cyan-200 uppercase">
                AEROTERMIA IMPULSO · CLIMATIZACIÓN EFICIENTE
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                {nombre && (
                  <>
                    Hola,{" "}
                    <span className="text-cyan-200 font-extrabold">
                      {nombre}
                    </span>
                    ,{" "}
                  </>
                )}
                calienta y refrigera tu hogar{" "}
                <span className="text-emerald-300">gastando mucho menos</span>.
              </h1>

              <p className="text-sm md:text-base text-slate-100/90 max-w-2xl">
                La aerotermia extrae energía del aire exterior para producir
                calefacción, refrigeración y agua caliente sanitaria, con un
                consumo eléctrico muy reducido y un rendimiento muy superior a
                las calderas tradicionales.
              </p>

              {(agenteId || lugarId) && (
                <p className="text-[11px] text-cyan-100/90">
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
                  onClick={irComparadorLuz}
                  className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-cyan-400/50 hover:bg-cyan-300"
                >
                  Estudiar ahorro combinando luz + aerotermia
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/registro${buildQuery({ origen: "aerotermia" })}`
                    )
                  }
                  className="inline-flex items-center justify-center rounded-full border border-cyan-300/70 bg-slate-950/60 px-5 py-2.5 text-xs md:text-sm font-semibold text-cyan-100 hover:bg-slate-900"
                >
                  Quiero un estudio de aerotermia
                </button>
              </div>
            </div>

            <div className="relative h-52 sm:h-60 lg:h-72">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-cyan-400/50 shadow-[0_0_35px_rgba(8,47,73,0.9)] flex flex-col justify-between p-5">
                <div className="flex items-center justify-between text-xs text-slate-200">
                  <span className="font-semibold">Simulación aerotermia</span>
                  <span className="text-cyan-300 text-[11px]">
                    COP alto rendimiento
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">
                      Ahorro frente a caldera gas/gasoil
                    </span>
                    <span className="font-semibold text-emerald-300">
                      hasta 40–60%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Rendimiento estacional</span>
                    <span className="font-semibold text-cyan-300">
                      COP 3–5 (según modelo)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">
                      Ideal con autoconsumo solar
                    </span>
                    <span className="font-semibold text-amber-300">
                      consumo casi neutro
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  *Valores orientativos. Ajustamos el estudio a tu vivienda,
                  aislamiento, emisores (suelo radiante, radiadores, fancoils…)
                  y hábitos de uso.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUES DE VENTAJAS */}
        <section className="grid gap-5 lg:grid-cols-3 mb-8 md:mb-10">
          {/* Eficiencia */}
          <div className="rounded-2xl border border-cyan-600/80 bg-slate-950/85 p-5 shadow-lg shadow-cyan-900/50">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              ⚙️ Máxima eficiencia energética
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• COP muy superior a las calderas convencionales.</li>
              <li>• Un solo equipo para calefacción, frío y ACS.</li>
              <li>• Preparado para trabajar con suelo radiante o fancoils.</li>
            </ul>
          </div>

          {/* Confort */}
          <div className="rounded-2xl border border-emerald-600/80 bg-gradient-to-br from-emerald-500/10 via-slate-950 to-slate-950 p-5 shadow-lg shadow-emerald-900/50">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              🛋️ Confort todo el año
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Temperaturas homogéneas, sin golpes de calor.</li>
              <li>• Calefacción en invierno y refrigeración en verano.</li>
              <li>• Integración con depósitos de inercia y ACS.</li>
            </ul>
          </div>

          {/* Combinación con solar */}
          <div className="rounded-2xl border border-sky-700/80 bg-slate-950/90 p-5 shadow-lg shadow-sky-900/40">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              ☀️ + 🌬️ Solar + aerotermia
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Combinación ideal: tu propia energía alimenta la aerotermia.</li>
              <li>• Reducciones muy fuertes en el gasto anual total.</li>
              <li>• Proyectos llave en mano coordinando ambas tecnologías.</li>
            </ul>
          </div>
        </section>

        {/* PASOS DEL PROCESO */}
        <section className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 md:p-7 mb-10">
          <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
            📋 Cómo planteamos tu proyecto de aerotermia
          </h2>

          <div className="grid gap-4 md:grid-cols-4 text-xs md:text-sm">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-cyan-300 mb-1">
                1 · Estudio de vivienda
              </p>
              <p className="text-slate-200">
                Analizamos superficie, aislamiento, ubicación, emisores y
                consumos actuales de calefacción/ACS.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-cyan-300 mb-1">
                2 · Selección de equipo
              </p>
              <p className="text-slate-200">
                Dimensionamos la bomba de calor y depósitos para asegurar
                confort y rendimiento.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-cyan-300 mb-1">
                3 · Integración con instalación existente
              </p>
              <p className="text-slate-200">
                Estudiamos si aprovechamos parte de tu sistema actual o
                renovamos todo el conjunto.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-cyan-300 mb-1">
                4 · Instalación y puesta en marcha
              </p>
              <p className="text-slate-200">
                Montaje profesional, configuración y seguimiento para comprobar
                el ahorro real conseguido.
              </p>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-slate-800 pt-4 text-[11px] md:text-xs text-slate-400">
          <span>© 2025 Impulso Energético · Aerotermia IMPULSO</span>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={irComparadorLuz}
              className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Ver impacto de aerotermia en mi factura de luz
            </button>
            <button
              onClick={irPantallaPrincipal}
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
