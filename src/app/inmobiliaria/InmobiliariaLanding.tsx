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

export default function InmobiliariaLanding() {
  const router = useRouter();
  const { nombre, agenteId, lugarId, buildQuery } = useBuildQuery();

  const irBienvenida = () => router.push(`/bienvenida${buildQuery()}`);

  const irRegistroTasacion = () =>
    router.push(`/registro${buildQuery({ origen: "inmobiliaria" })}`);

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
                className="object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.8)]"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] md:text-xs tracking-[0.30em] uppercase text-sky-300 font-semibold">
                IMPULSO ENERGÉTICO · INMOBILIARIA
              </span>
              <span className="text-xs text-slate-300">
                Venta, compra y alquiler con visión energética y financiera
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
        <section className="relative overflow-hidden rounded-3xl border border-sky-500/70 bg-gradient-to-br from-sky-500/25 via-sky-400/5 to-slate-950/95 p-6 md:p-10 shadow-[0_0_40px_rgba(56,189,248,0.7)] mb-8 md:mb-10">
          <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-500/30 blur-3xl" />
          <span className="pointer-events-none absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)] items-center relative z-10">
            <div className="space-y-4">
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-sky-100 uppercase">
                INMOBILIARIA IMPULSO
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                {nombre && (
                  <>
                    Hola,{" "}
                    <span className="text-sky-100 font-extrabold">
                      {nombre}
                    </span>
                    ,{" "}
                  </>
                )}
                te ayudamos a{" "}
                <span className="text-emerald-300">
                  vender, comprar o alquilar
                </span>{" "}
                tu vivienda, conectando{" "}
                <span className="text-amber-300">
                  ahorro energético y rentabilidad
                </span>
                .
              </h1>

              <p className="text-sm md:text-base text-slate-100/90 max-w-2xl">
                Combinamos estudio inmobiliario y estudio energético: analizamos
                el valor de tu vivienda, su potencial de reforma, consumo
                energético y opciones de financiación para que tomes decisiones
                con todos los datos.
              </p>

              {(agenteId || lugarId) && (
                <p className="text-[11px] text-sky-100/90">
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

              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  onClick={irRegistroTasacion}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-emerald-500/60 hover:bg-emerald-400"
                >
                  Solicitar valoración gratuita de mi vivienda
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/registro${buildQuery({ origen: "inmobiliaria-inversor" })}`
                    )
                  }
                  className="inline-flex items-center justify-center rounded-full border border-sky-300/70 bg-slate-950/70 px-5 py-2.5 text-xs md:text-sm font-semibold text-sky-100 hover:bg-slate-900"
                >
                  Quiero ver opciones para invertir en vivienda
                </button>
              </div>
            </div>

            {/* Tarjeta resumen proyecto */}
            <div className="relative h-52 sm:h-60 lg:h-72">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-sky-400/60 shadow-[0_0_35px_rgba(8,47,73,0.9)] flex flex-col justify-between p-5">
                <div className="flex items-center justify-between text-xs text-slate-200">
                  <span className="font-semibold">
                    Proyecto tipo: vender para mejorar
                  </span>
                  <span className="text-emerald-300 text-[11px]">
                    enfoque ahorro + valor
                  </span>
                </div>

                <ul className="text-[11px] text-slate-200 space-y-1.5">
                  <li>• Valoración de mercado realista y actualizada.</li>
                  <li>
                    • Estimación de mejoras energéticas para la nueva vivienda.
                  </li>
                  <li>
                    • Simulación de cuota + facturas de luz/gas tras el cambio.
                  </li>
                  <li>• Acompañamiento legal y financiero en todo el proceso.</li>
                </ul>

                <p className="text-[10px] text-slate-500">
                  Cada operación se estudia de forma individual: zona, ingresos,
                  tipo de vivienda, consumo energético y objetivos familiares.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUES */}
        <section className="grid gap-5 lg:grid-cols-3 mb-8 md:mb-10">
          <div className="rounded-2xl border border-emerald-500/80 bg-slate-950/90 p-5 shadow-lg shadow-emerald-900/50">
            <h2 className="text-sm md:text-base font-semibold mb-2">
              🏠 Venta de vivienda con estrategia
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Análisis de precio objetivo y tiempos de venta.</li>
              <li>• Propuesta de mejoras o home staging.</li>
              <li>• Coordinación con tu agente IMPULSO o de confianza.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/80 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 p-5 shadow-lg shadow-amber-900/50">
            <h2 className="text-sm md:text-base font-semibold mb-2">
              📈 Compra e inversión
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>
                • Búsqueda de vivienda según presupuesto, zona y perfil de
                riesgo.
              </li>
              <li>• Cálculo de rentabilidad esperada en alquiler.</li>
              <li>• Análisis de hipoteca + costes + facturas energéticas.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-sky-500/80 bg-slate-950/95 p-5 shadow-lg shadow-sky-900/40">
            <h2 className="text-sm md:text-base font-semibold mb-2">
              🌿 Vivienda eficiente y reforma
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Estudio de mejora energética de tu vivienda actual.</li>
              <li>• Coordinación con solar, baterías, aerotermia, aislamientos.</li>
              <li>• Plan paso a paso adaptado a tu economía real.</li>
            </ul>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-slate-800 pt-4 text-[11px] md:text-xs text-slate-400">
          <span>© 2025 Impulso Energético · Inmobiliaria IMPULSO</span>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={irRegistroTasacion}
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Solicitar estudio inmobiliario + energético
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
