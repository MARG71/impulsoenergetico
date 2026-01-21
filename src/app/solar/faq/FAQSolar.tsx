"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SolarHeader from "../_shared/SolarHeader";
import SolarFooter from "../_shared/SolarFooter";
import SolarHeroImage from "../_shared/SolarHeroImage";
import { useBuildQuery } from "../_shared/useBuildQuery";

type FaqItem = {
  q: string;
  a: string;
  tags: string[];
};

const FAQS: FaqItem[] = [
  {
    q: "¿Cuánto puedo ahorrar con placas solares?",
    a: "Depende de tu consumo, horario, orientación y sombras. En muchos casos se reduce gran parte del consumo de red. Hacemos un estudio personalizado para estimarlo con más precisión.",
    tags: ["ahorro", "consumo", "estudio"],
  },
  {
    q: "¿Necesito batería sí o sí?",
    a: "No. La batería aumenta autonomía y puede mejorar el aprovechamiento, pero no siempre compensa. Te proponemos opciones: sin batería, con batería o escalable a futuro.",
    tags: ["batería", "autonomía"],
  },
  {
    q: "¿Qué mantenimiento requiere una instalación solar?",
    a: "Normalmente es bajo: revisiones periódicas básicas y limpieza ocasional según entorno (polvo, salinidad). Además, monitorizamos para detectar anomalías.",
    tags: ["mantenimiento", "monitorización"],
  },
  {
    q: "¿Qué pasa con los excedentes de energía?",
    a: "Si produces más de lo que consumes, puedes verter a red y estudiar compensación según condiciones de tu contrato/comercializadora. Te orientamos según tu caso.",
    tags: ["excedentes", "compensación"],
  },
  {
    q: "¿En cuánto tiempo se amortiza?",
    a: "Varía por coste, consumo, precios y diseño. Lo habitual es analizar retorno en un rango razonable, con un plan ajustado a tu perfil. Te damos estimación en el estudio.",
    tags: ["retorno", "amortización"],
  },
  {
    q: "¿Es necesario pedir permisos o licencias?",
    a: "Depende del municipio y del tipo de instalación. Nosotros te guiamos con una checklist clara y la documentación habitual para tramitarlo correctamente.",
    tags: ["licencias", "tramitación"],
  },
  {
    q: "¿Funciona si hay sombras o el tejado no está perfecto?",
    a: "Las sombras influyen, pero hay soluciones: optimizadores, microinversores, rediseño del campo fotovoltaico o ajuste de potencia. Se valora en la visita/estudio.",
    tags: ["sombras", "diseño"],
  },
  {
    q: "¿Puedo combinar placas solares con aerotermia o coche eléctrico?",
    a: "Sí. De hecho, es una combinación muy potente. Diseñamos pensando en cargas futuras y en gestión inteligente para maximizar autoconsumo.",
    tags: ["aerotermia", "vehículo eléctrico", "gestión"],
  },
];

export default function FAQSolar() {
  const router = useRouter();
  const { buildQuery } = useBuildQuery();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter((x) => {
      const hay =
        x.q.toLowerCase().includes(q) ||
        x.a.toLowerCase().includes(q) ||
        x.tags.some((t) => t.toLowerCase().includes(q));
      return hay;
    });
  }, [query]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 md:py-10">
        <SolarHeader />

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start mb-10">
          <div className="rounded-3xl border border-emerald-500/25 bg-slate-950/70 p-6 md:p-8 shadow-[0_0_40px_rgba(16,185,129,0.18)]">
            <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
              Preguntas frecuentes · Solar Impulso
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Resolvemos tus dudas antes de decidir
            </h1>

            <p className="text-sm text-slate-200 mt-2 max-w-2xl">
              Busca por “batería”, “ahorro”, “excedentes”, “sombras”… y si lo prefieres,
              te llamamos para un estudio rápido.
            </p>

            <div className="mt-5">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en FAQ: batería, ahorro, retorno, excedentes…"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div className="mt-6 space-y-3">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
                  No hay resultados. Prueba con otra palabra.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isOpen = open === idx;
                  return (
                    <div
                      key={item.q}
                      className="rounded-3xl border border-slate-700 bg-slate-950/55 overflow-hidden"
                    >
                      <button
                        onClick={() => setOpen(isOpen ? null : idx)}
                        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-900/40"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-100">
                            {item.q}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-emerald-300 text-xs mt-1">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5">
                          <p className="text-sm text-slate-200 leading-relaxed">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-6">
              <button
                onClick={() => router.push(`/solar/estudio${buildQuery()}`)}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-emerald-500/50 hover:bg-emerald-400"
              >
                Quiero estudio gratuito
              </button>

              <button
                onClick={() => router.push(`/solar/subvenciones${buildQuery()}`)}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/60 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                Ver subvenciones y trámites
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
            <SolarHeroImage src="/solar/faq.jpg" alt="FAQ Solar Impulso" />
            <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5 text-xs text-slate-200">
              <p className="font-semibold text-emerald-200">¿No lo tienes claro?</p>
              <p className="mt-2">
                Te ayudamos a decidir: potencia, batería, excedentes y retorno, con un estudio rápido.
              </p>
            </div>
          </div>
        </section>

        <SolarFooter />
      </div>
    </div>
  );
}
