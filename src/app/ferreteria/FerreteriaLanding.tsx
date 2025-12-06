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

export default function FerreteriaLanding() {
  const router = useRouter();
  const { nombre, agenteId, lugarId, buildQuery } = useBuildQuery();

  const irBienvenida = () => router.push(`/bienvenida${buildQuery()}`);

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
                className="object-contain drop-shadow-[0_0_24px_rgba(190,242,100,0.8)]"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] md:text-xs tracking-[0.30em] uppercase text-lime-300 font-semibold">
                IMPULSO ENERGÉTICO · FERRETERÍA BRICOTITAN
              </span>
              <span className="text-xs text-slate-300">
                Herramientas, fijación, tornillería y soluciones para reforma
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
        <section className="relative overflow-hidden rounded-3xl border border-lime-400/70 bg-gradient-to-br from-lime-500/25 via-lime-400/5 to-slate-950/95 p-6 md:p-10 shadow-[0_0_40px_rgba(101,163,13,0.7)] mb-8 md:mb-10">
          <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-lime-500/30 blur-3xl" />
          <span className="pointer-events-none absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr),minmax(0,1fr)] items-center relative z-10">
            <div className="space-y-4">
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-lime-200 uppercase">
                FERRETERÍA BRICOTITAN
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                {nombre && (
                  <>
                    Hola,{" "}
                    <span className="text-lime-200 font-extrabold">
                      {nombre}
                    </span>
                    ,{" "}
                  </>
                )}
                todo el material de ferretería y fijación que necesitas en{" "}
                <span className="text-amber-300">una sola tienda online</span>.
              </h1>

              <p className="text-sm md:text-base text-slate-100/90 max-w-2xl">
                BRICOTITAN es la tienda online donde encontrarás tornillería,
                fijación química, herramientas, EPIs, productos para obra seca,
                pladur, anclajes y mucho más, con asesoramiento profesional y
                envío a toda España.
              </p>

              {(agenteId || lugarId) && (
                <p className="text-[11px] text-lime-100/90">
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
                {/* BOTÓN PRINCIPAL: TIENDA ONLINE */}
                <a
                  href="https://www.bricotitan.es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-lime-400 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-lime-400/50 hover:bg-lime-300"
                >
                  🛒 Acceder a tienda online BRICOTITAN
                </a>

                <button
                  onClick={() =>
                    router.push(
                      `/registro${buildQuery({ origen: "ferreteria" })}`
                    )
                  }
                  className="inline-flex items-center justify-center rounded-full border border-lime-300/70 bg-slate-950/70 px-5 py-2.5 text-xs md:text-sm font-semibold text-lime-100 hover:bg-slate-900"
                >
                  Quiero que me asesoren en mi obra
                </button>
              </div>
            </div>

            {/* Tarjeta categorías */}
            <div className="relative h-52 sm:h-60 lg:h-72">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-lime-400/60 shadow-[0_0_35px_rgba(54,83,20,0.9)] flex flex-col justify-between p-5">
                <div className="flex items-center justify-between text-xs text-slate-200">
                  <span className="font-semibold">Categorías destacadas</span>
                  <span className="text-lime-300 text-[11px]">
                    BRICOTITAN.es
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-100">
                  <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2">
                    🔩 Tornillería y fijación
                    <p className="text-[10px] text-slate-400 mt-1">
                      Para madera, metal, hormigón, pladur…
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2">
                    🧱 Pladur & obra seca
                    <p className="text-[10px] text-slate-400 mt-1">
                      Perfiles, placas, pastas, cintas, accesorios.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2">
                    🧰 Herramientas y EPIs
                    <p className="text-[10px] text-slate-400 mt-1">
                      Manuales, eléctricas y protección personal.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2">
                    🔧 Anclajes y químicos
                    <p className="text-[10px] text-slate-400 mt-1">
                      Espumas, siliconas, químicos de fijación.
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  Compra directa en la web y, si lo necesitas, te ayudamos a
                  elegir el producto adecuado para tu proyecto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUES VENTAJA */}
        <section className="grid gap-5 lg:grid-cols-3 mb-8 md:mb-10">
          <div className="rounded-2xl border border-lime-500/80 bg-slate-950/90 p-5 shadow-lg shadow-lime-900/50">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              🚚 Envío a obra o almacén
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Envío a cualquier punto de España peninsular.</li>
              <li>• Posibilidad de agrupar pedidos por obra.</li>
              <li>• Stock de productos habituales de obra seca y reforma.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/80 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 p-5 shadow-lg shadow-amber-900/50">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              🧱 Pensado para profesionales y particulares exigentes
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Marcas de calidad y referencias técnicas claras.</li>
              <li>• Productos orientados a obra nueva y reforma.</li>
              <li>• Asesoramiento para elegir fijaciones y sistemas adecuados.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-sky-600/80 bg-slate-950/95 p-5 shadow-lg shadow-sky-900/40">
            <h2 className="text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
              🤝 Integrado con el ecosistema IMPULSO
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Ideal para proyectos de pladur, reformas, aislamientos.</li>
              <li>• Posible coordinación con servicios de energía y pladur.</li>
              <li>• Soporte a través de tu agente IMPULSO si lo necesitas.</li>
            </ul>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-slate-800 pt-4 text-[11px] md:text-xs text-slate-400">
          <span>© 2025 Impulso Energético · Ferretería BRICOTITAN</span>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.bricotitan.es"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-lime-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-lime-300"
            >
              🛒 Ir a tienda online BRICOTITAN
            </a>
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
