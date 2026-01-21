"use client";

import React from "react";
import { useRouter } from "next/navigation";
import SolarHeader from "../_shared/SolarHeader";
import SolarFooter from "../_shared/SolarFooter";
import SolarHeroImage from "../_shared/SolarHeroImage";
import { useBuildQuery } from "../_shared/useBuildQuery";

export default function Subvenciones() {
  const router = useRouter();
  const { buildQuery } = useBuildQuery();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 md:py-10">
        <SolarHeader />

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start mb-10">
          <div className="rounded-3xl border border-emerald-500/25 bg-slate-950/70 p-6 md:p-8 shadow-[0_0_40px_rgba(16,185,129,0.18)]">
            <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
              Subvenciones · Legalización · Excedentes
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Te ayudamos con ayudas, trámites y legalización
            </h1>

            <p className="text-sm text-slate-200 mt-2 max-w-2xl">
              Cada comunidad y municipio puede tener programas distintos. En Solar Impulso te guiamos
              para que tengas una ruta clara: licencias, legalización y, si aplica, opciones de ayuda.
            </p>

            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <Card
                title="🏛️ Tramitación y licencias"
                items={[
                  "Revisión de documentación necesaria.",
                  "Orientación sobre licencias/permiso de obra (según tu municipio).",
                  "Gestión ordenada para evitar retrasos.",
                ]}
              />
              <Card
                title="🧾 Legalización de la instalación"
                items={[
                  "Memoria técnica / boletines según proceda.",
                  "Alta y registro para autoconsumo (según normativa aplicable).",
                  "Preparación para monitorización y seguimiento.",
                ]}
              />
              <Card
                title="⚡ Compensación de excedentes"
                items={[
                  "Si viertes energía a red, te explicamos opciones.",
                  "Revisión de tarifa y encaje con tu comercializadora.",
                  "Optimización: más autoconsumo vs. excedentes.",
                ]}
              />
              <Card
                title="💶 Subvenciones y bonificaciones"
                items={[
                  "Te indicamos qué mirar y cómo solicitarlo si existe.",
                  "Checklist de documentación para no perder oportunidades.",
                  "Planificación para no frenar la instalación.",
                ]}
              />
            </div>

            <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-900/55 p-5">
              <p className="text-xs text-slate-200">
                <span className="text-emerald-200 font-semibold">Importante:</span>{" "}
                las ayudas/bonificaciones cambian por zona y convocatorias. Te damos un
                <b> asesoramiento claro</b> según tu provincia y el tipo de instalación.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-6">
              <button
                onClick={() => router.push(`/solar/estudio${buildQuery()}`)}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-emerald-500/50 hover:bg-emerald-400"
              >
                Quiero estudio gratuito (y revisión de ayudas)
              </button>

              <button
                onClick={() => router.push(`/solar/faq${buildQuery()}`)}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/60 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                Ver preguntas frecuentes
              </button>

              <button
                onClick={() => router.push(`/solar/tienda${buildQuery()}`)}
                className="inline-flex items-center justify-center rounded-full border border-emerald-300/70 bg-slate-950/60 px-5 py-2.5 text-xs md:text-sm font-semibold text-emerald-100 hover:bg-slate-900"
              >
                Ir a la tienda solar
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <SolarHeroImage
              src="/solar/hero.jpg"
              alt="Legalización, tramitación y subvenciones solar"
            />

            <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5 text-xs text-slate-200">
              <p className="font-semibold text-emerald-200">Checklist rápido</p>
              <ul className="mt-2 space-y-1.5">
                <li>• Provincia y municipio</li>
                <li>• Tipo: vivienda / empresa</li>
                <li>• Tejado: sombras y orientación (aprox.)</li>
                <li>• Factura de luz (si la tienes)</li>
              </ul>
              <p className="text-[11px] text-slate-400 mt-3">
                Con esto te hacemos una orientación inicial y te guiamos en pasos.
              </p>
            </div>
          </div>
        </section>

        <SolarFooter />
      </div>
    </div>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-950/55 p-5">
      <h2 className="text-sm font-semibold text-slate-100 mb-2">{title}</h2>
      <ul className="text-xs md:text-sm text-slate-200 space-y-1.5">
        {items.map((t) => (
          <li key={t}>• {t}</li>
        ))}
      </ul>
    </div>
  );
}
