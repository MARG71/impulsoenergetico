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

export default function ViajesLanding() {
  const router = useRouter();
  const { nombre, agenteId, lugarId, buildQuery } = useBuildQuery();

  const irBienvenida = () => router.push(`/bienvenida${buildQuery()}`);

  const irRegistroViaje = () =>
    router.push(`/registro${buildQuery({ origen: "viajes" })}`);

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
                className="object-contain drop-shadow-[0_0_24px_rgba(129,140,248,0.8)]"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] md:text-xs tracking-[0.30em] uppercase text-indigo-300 font-semibold">
                IMPULSO ENERGÉTICO · VIAJANDO CON MERY
              </span>
              <span className="text-xs text-slate-300">
                Viajes a medida, escapadas y grandes experiencias
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
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/70 bg-gradient-to-br from-indigo-600/30 via-indigo-500/10 to-slate-950/95 p-6 md:p-10 shadow-[0_0_40px_rgba(79,70,229,0.7)] mb-8 md:mb-10">
          <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/35 blur-3xl" />
          <span className="pointer-events-none absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-fuchsia-400/25 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)] items-center relative z-10">
            <div className="space-y-4">
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-indigo-100 uppercase">
                VIAJANDO CON MERY
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                {nombre && (
                  <>
                    Hola,{" "}
                    <span className="text-indigo-100 font-extrabold">
                      {nombre}
                    </span>
                    ,{" "}
                  </>
                )}
                prepara tu{" "}
                <span className="text-fuchsia-300">próximo viaje o escapada</span>{" "}
                con acompañamiento{" "}
                <span className="text-amber-300">desde la idea hasta la vuelta</span>
                .
              </h1>

              <p className="text-sm md:text-base text-slate-100/90 max-w-2xl">
                VIAJANDO CON MERY es la parte del proyecto que te ayuda a
                desconectar: escapadas, viajes en familia, grandes rutas,
                cruceros, experiencias especiales… Siempre con alguien al otro
                lado que te escucha y diseña el viaje contigo.
              </p>

              {(agenteId || lugarId) && (
                <p className="text-[11px] text-indigo-100/90">
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
                  onClick={irRegistroViaje}
                  className="inline-flex items-center justify-center rounded-full bg-fuchsia-400 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-fuchsia-500/60 hover:bg-fuchsia-300"
                >
                  Quiero que me preparen un viaje a medida
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/registro${buildQuery({ origen: "viajes-escapada" })}`
                    )
                  }
                  className="inline-flex items-center justify-center rounded-full border border-indigo-300/70 bg-slate-950/70 px-5 py-2.5 text-xs md:text-sm font-semibold text-indigo-100 hover:bg-slate-900"
                >
                  Estoy pensando en una escapada corta
                </button>
              </div>
            </div>

            {/* Tarjeta tipos de viaje */}
            <div className="relative h-52 sm:h-60 lg:h-72">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 border border-indigo-400/60 shadow-[0_0_35px_rgba(49,46,129,0.9)] flex flex-col justify-between p-5">
                <div className="flex items-center justify-between text-xs text-slate-200">
                  <span className="font-semibold">
                    Ideas de viaje con Mery
                  </span>
                  <span className="text-fuchsia-300 text-[11px]">
                    asesoramiento cercano
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-100">
                  <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2">
                    👨‍👩‍👧‍👦 Familia
                    <p className="text-[10px] text-slate-400 mt-1">
                      Parques, playas, ciudades cómodas para niños.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2">
                    ❤️ Parejas
                    <p className="text-[10px] text-slate-400 mt-1">
                      Escapadas románticas y destinos especiales.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2">
                    🌍 Grandes viajes
                    <p className="text-[10px] text-slate-400 mt-1">
                      Rutas largas, viajes soñados, experiencias únicas.
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2">
                    🚢 Cruceros & grupos
                    <p className="text-[10px] text-slate-400 mt-1">
                      Viajes organizados, grupos reducidos, acompañamiento.
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  Cuéntanos presupuesto aproximado, fechas y tipo de viaje, y te
                  proponemos opciones reales y claras, sin letra pequeña.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUES VENTAJA */}
        <section className="grid gap-5 lg:grid-cols-3 mb-8 md:mb-10">
          <div className="rounded-2xl border border-fuchsia-400/80 bg-slate-950/90 p-5 shadow-lg shadow-fuchsia-900/50">
            <h2 className="text-sm md:text-base font-semibold mb-2">
              🙋‍♀️ Trato cercano y acompañamiento
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Hablas con una persona, no con un robot.</li>
              <li>• Te ayudamos a decidir destino según lo que buscas.</li>
              <li>• Seguimiento antes, durante y después del viaje.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-400/80 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 p-5 shadow-lg shadow-amber-900/50">
            <h2 className="text-sm md:text-base font-semibold mb-2">
              🧮 Presupuesto claro
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Desglose de precios y qué incluye cada opción.</li>
              <li>• Ajuste del viaje a tu presupuesto real.</li>
              <li>• Posibilidad de varias propuestas comparadas.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-indigo-400/80 bg-slate-950/95 p-5 shadow-lg shadow-indigo-900/40">
            <h2 className="text-sm md:text-base font-semibold mb-2">
              ✈️ Integrado con tu plan de vida
            </h2>
            <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
              <li>• Pensamos el viaje en tu contexto económico global.</li>
              <li>• Coordinable con vacaciones escolares y trabajo.</li>
              <li>• Posible combinación con otros servicios IMPULSO.</li>
            </ul>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-slate-800 pt-4 text-[11px] md:text-xs text-slate-400">
          <span>© 2025 Impulso Energético · Viajes VIAJANDO CON MERY</span>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={irRegistroViaje}
              className="rounded-full bg-fuchsia-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-fuchsia-300"
            >
              Empezar a diseñar mi próximo viaje
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
