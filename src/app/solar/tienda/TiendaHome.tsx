"use client";

import Link from "next/link";
import SolarHeader from "../_shared/SolarHeader";
import SolarFooter from "../_shared/SolarFooter";

const productos = [
  {
    t: "Placas Solares Premium",
    d: "Paneles de última generación, alta eficiencia y garantía extendida.",
    cta: "Ver Placas",
  },
  {
    t: "Inversores Inteligentes",
    d: "Conversión avanzada y monitorización en tiempo real vía app.",
    cta: "Ver Inversores",
  },
  {
    t: "Baterías de Almacenamiento",
    d: "Aprovecha tu energía incluso de noche. Más independencia.",
    cta: "Ver Baterías",
  },
  {
    t: "Kits Solares Completos",
    d: "Soluciones integrales según consumo y presupuesto.",
    cta: "Ver Kits",
  },
];

export default function TiendaHome() {
  return (
    <div className="min-h-screen bg-[#070A16] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_10%,rgba(16,185,129,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(800px_450px_at_80%_20%,rgba(34,211,238,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A16] via-[#070A16] to-[#050712]" />
      </div>

      <SolarHeader />

      <section className="px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-400/10 px-5 py-2 text-base font-extrabold text-emerald-100">
            TIENDA ONLINE
          </div>

          <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold leading-[1.02]">
            Todo lo que necesitas para tu proyecto solar
          </h1>

          <p className="mt-6 text-xl text-white/75 leading-8 max-w-3xl">
            Catálogo orientativo. Si quieres, con el estudio te recomendamos el kit exacto para tu consumo.
          </p>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {productos.map((p) => (
              <div
                key={p.t}
                className="rounded-3xl border border-white/10 bg-white/5 p-8"
              >
                <div className="text-3xl font-extrabold">{p.t}</div>
                <div className="mt-3 text-lg leading-8 text-white/75">
                  {p.d}
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/solar/estudio"
                    className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-7 py-4 text-lg font-extrabold text-slate-950 hover:bg-emerald-300"
                  >
                    Pedir Estudio
                  </Link>
                  <Link
                    href="/solar"
                    className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-transparent px-7 py-4 text-lg font-bold text-emerald-100 hover:bg-emerald-300/10"
                  >
                    Volver a la landing
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SolarFooter />
    </div>
  );
}
