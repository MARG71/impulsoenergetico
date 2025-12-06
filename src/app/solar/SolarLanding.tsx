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

export default function SolarLanding() {
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
                className="object-contain drop-shadow-[0_0_24px_rgba(16,185,129,0.8)]"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] md:text-xs tracking-[0.30em] uppercase text-emerald-300 font-semibold">
                IMPULSO ENERGÉTICO · ESPECIAL SOLAR
              </span>
              <span className="text-xs text-slate-300">
                Autoconsumo, ahorro y autonomía energética
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
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-600/25 via-emerald-500/5 to-slate-950/95 p-6 md:p-10 shadow-[0_0_40px_rgba(16,185,129,0.55)] mb-8 md:mb-10">
          <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/30 blur-3xl" />
          <span className="pointer-events-none absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-yellow-300/20 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr),minmax(0,1fr)] items-center relative z-10">
            <div className="space-y-4">
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
                SOLAR IMPULSO · AUTOCONSUMO FOTOVOLTAICO
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                {nombre && (
                  <>
                    Hola,{" "}
                    <span className="text-emerald-300 font-extrabold">
                      {nombre}
                    </span>
                    ,{" "}
                  </>
                )}
                transforma tu tejado en{" "}
                <span className="text-amber-300">ahorro y autonomía</span>.
              </h1>

              <p className="text-sm md:text-base text-slate-100/90 max-w-2xl">
                Analizamos tu consumo, superficie disponible y potencia
                contratada para diseñar una instalación fotovoltaica a medida.
                Tú decides: solo autoconsumo, con batería, o solución integral
                con aerotermia y gestión inteligente.
              </p>

              {(agenteId || lugarId) && (
                <p className="text-[11px] text-emerald-100/90">
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
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-emerald-500/50 hover:bg-emerald-400"
                >
                  Estudiar ahorro en mi factura de luz
                </button>
                <button
                  onClick={() =>
                    router.push(`/registro${buildQuery({ origen: "solar" })}`)
                  }
                  className="inline-flex items-center justify-center rounded-full border border-emerald-300/70 bg-slate-950/60 px-5 py-2.5 text-xs md:text-sm font-semibold text-emerald-100 hover:bg-slate-900"
                >
                  Quiero que me llaméis para estudio solar
                </button>
              </div>
            </div>

            <div className="relative h-52 sm:h-60 lg:h-72">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-emerald-500/40 shadow-[0_0_35px_rgba(8,47,35,0.9)] flex flex-col justify-between p-5">
                <div className="flex items-center justify-between text-xs text-slate-200">
                  <span className="font-semibold">Simulación solar</span>
                  <span className="text-emerald-300 text-[11px]">
                    Ahorro estimado
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Reducción consumo red</span>
                    <span className="font-semibold text-emerald-300">
                      hasta 60–70%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Retorno estimado</span>
                    <span className="font-semibold text-amber-300">
                      5–8 años
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">CO₂ evitado</span>
                    <span className="font-semibold text-sky-300">
                      + toneladas/año
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  *Datos orientativos. Realizamos un estudio detallado según tu
                  tejado, orientación, consumo y tarifas actuales.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUES DE VENTAJAS */}
        <section className="grid gap-5 lg:grid-cols-3 mb-8 md:mb-10">
          {/* Ahorro */}
          <div className="rounded-2xl border border-emerald-700/70 bg-slate-950/80 p-5 shadow-lg shadow-emerald-900/40">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              💸 Ahorro directo en tu factura
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Produces tu propia energía a precio estable.</li>
              <li>
                • Menos dependencia de subidas de la luz y precios de mercado.
              </li>
              <li>
                • Posibilidad de compensar excedentes según la compañía
                comercializadora.
              </li>
            </ul>
          </div>

          {/* Autonomía */}
          <div className="rounded-2xl border border-amber-600/70 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 p-5 shadow-lg shadow-amber-900/40">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              🔋 Autonomía y sistema con batería
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Opciones con batería para aprovechar aún más tu producción.</li>
              <li>• Gestión inteligente de cargas: coche eléctrico, ACS, etc.</li>
              <li>• Preparado para combinar con aerotermia y otros sistemas.</li>
            </ul>
          </div>

          {/* Sostenibilidad */}
          <div className="rounded-2xl border border-sky-700/70 bg-slate-950/90 p-5 shadow-lg shadow-sky-900/40">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              🌍 Sostenibilidad y valor para tu vivienda
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Reduces tu huella de carbono año tras año.</li>
              <li>• Revalorizas la vivienda al incorporar autoconsumo.</li>
              <li>• Imagen responsable y moderna para negocios y comunidades.</li>
            </ul>
          </div>
        </section>

        {/* PASOS DEL PROCESO */}
        <section className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 md:p-7 mb-10">
          <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
            🧩 ¿Cómo trabajamos tu proyecto solar?
          </h2>

          <div className="grid gap-4 md:grid-cols-4 text-xs md:text-sm">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-emerald-300 mb-1">
                1 · Estudio de consumo
              </p>
              <p className="text-slate-200">
                Analizamos tus facturas de luz y perfil horario para dimensionar
                la instalación adecuada.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-emerald-300 mb-1">
                2 · Diseño e ingeniería
              </p>
              <p className="text-slate-200">
                Cálculo de paneles, inversores, estructura y cableado, todo
                supervisado por ingeniería especializada.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-emerald-300 mb-1">
                3 · Tramitación y ayudas
              </p>
              <p className="text-slate-200">
                Te ayudamos con licencias, legalización y posibles subvenciones
                disponibles en tu zona.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
              <p className="text-[11px] font-semibold text-emerald-300 mb-1">
                4 · Instalación y seguimiento
              </p>
              <p className="text-slate-200">
                Instalación profesional, puesta en marcha y monitorización para
                que veas tu ahorro real día a día.
              </p>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-slate-800 pt-4 text-[11px] md:text-xs text-slate-400">
          <span>© 2025 Impulso Energético · Solar IMPULSO</span>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={irComparadorLuz}
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Ver mi ahorro estimado en luz
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
