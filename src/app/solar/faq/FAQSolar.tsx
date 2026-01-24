"use client";

import Link from "next/link";
import SolarHeader from "../_shared/SolarHeader";
import SolarFooter from "../_shared/SolarFooter";

const faqs = [
  {
    q: "¿Cuánto puedo ahorrar realmente?",
    a: "El ahorro habitual ronda el 60–70% (depende de orientación, consumo, potencia y hábitos). Con buen dimensionado, el impacto se nota desde el primer mes.",
  },
  {
    q: "¿Cuánto dura la instalación?",
    a: "La instalación física suele ser 1–2 días. El proceso completo puede variar según permisos y legalización en tu zona.",
  },
  {
    q: "¿Qué pasa los días nublados?",
    a: "Los paneles siguen produciendo (menos). Con baterías aprovechas energía almacenada; si no, la red complementa automáticamente.",
  },
  {
    q: "¿Necesito permisos especiales?",
    a: "Nos encargamos de trámites, legalización y conexión con distribuidora cuando aplica. Tú no te preocupas de nada.",
  },
  {
    q: "¿Qué mantenimiento requiere?",
    a: "Mínimo. Limpieza ocasional y revisiones preventivas. Te orientamos según zona (polvo, salinidad, etc.).",
  },
  {
    q: "¿Puedo compensar excedentes?",
    a: "Sí, en modalidad de compensación, el excedente puede descontarse en factura según comercializadora y condiciones.",
  },
];

export default function FAQSolar() {
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
            PREGUNTAS FRECUENTES
          </div>

          <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold leading-[1.02]">
            Resolvemos tus dudas
          </h1>

          <p className="mt-6 text-xl text-white/75 leading-8 max-w-3xl">
            Aquí tienes respuestas claras y directas. Si quieres, también puedes pedir el estudio y te lo explicamos
            con tus datos reales.
          </p>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-3xl border border-white/10 bg-white/5 p-7"
              >
                <div className="text-2xl font-extrabold">{f.q}</div>
                <div className="mt-3 text-lg leading-8 text-white/75">
                  {f.a}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/solar/estudio"
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-7 py-4 text-lg font-extrabold text-slate-950 hover:bg-emerald-300"
            >
              Solicitar Estudio Gratis
            </Link>
            <Link
              href="/solar"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-7 py-4 text-lg font-bold text-white/80 hover:bg-white/10"
            >
              Volver a la landing
            </Link>
          </div>
        </div>
      </section>

      <SolarFooter />
    </div>
  );
}
