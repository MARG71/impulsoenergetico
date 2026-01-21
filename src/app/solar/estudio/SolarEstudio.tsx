// src/app/solar/estudio/SolarEstudio.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SolarHeader from "../_shared/SolarHeader";
import SolarFooter from "../_shared/SolarFooter";
import SolarHeroImage from "../_shared/SolarHeroImage";
import { useBuildQuery } from "../_shared/useBuildQuery";

type FormState = {
  nombre: string;
  telefono: string;
  email: string;
  tipo: "vivienda" | "empresa";
  provincia: string;
  gastoMensual: string; // texto para no romper
  sombras: "no" | "si";
};

const provinciasSugeridas = [
  "Madrid","Barcelona","Valencia","Sevilla","Málaga","Zaragoza","Murcia","Alicante","Cádiz","Pontevedra"
];

export default function SolarEstudio() {
  const router = useRouter();
  const { buildQuery, nombre: nombreFromQS } = useBuildQuery();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [f, setF] = useState<FormState>({
    nombre: nombreFromQS || "",
    telefono: "",
    email: "",
    tipo: "vivienda",
    provincia: "",
    gastoMensual: "",
    sombras: "no",
  });

  const canNext1 = useMemo(() => f.nombre.trim() && f.telefono.trim() && f.email.trim(), [f]);
  const canNext2 = useMemo(() => f.provincia.trim() && f.gastoMensual.trim(), [f]);

  const onSubmit = async () => {
    setLoading(true);
    try {
      // Opción simple y segura: reusar tu /registro para guardar lead como ya lo tienes montado
      // y que mantenga agenteId/lugarId + trazabilidad.
      router.push(
        `/registro${buildQuery({
          origen: "solar",
          nombre: f.nombre,
          telefono: f.telefono,
          email: f.email,
        })}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 md:py-10">
        <SolarHeader />

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] items-start mb-8">
          <div className="rounded-3xl border border-emerald-500/25 bg-slate-950/70 p-6 md:p-8 shadow-[0_0_40px_rgba(16,185,129,0.20)]">
            <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
              Estudio gratuito · Solar Impulso
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Te llamamos y diseñamos tu instalación a medida
            </h1>
            <p className="text-sm text-slate-200 mt-2 max-w-2xl">
              En 2 minutos nos dejas tus datos y te contacta un especialista. Sin compromiso.
            </p>

            {/* Steps */}
            <div className="mt-6 flex items-center gap-2 text-xs">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`px-3 py-1 rounded-full border ${
                    step === n ? "border-emerald-300 bg-emerald-500/15 text-emerald-100" : "border-slate-700 text-slate-300"
                  }`}
                >
                  Paso {n}
                </div>
              ))}
            </div>

            <div className="mt-6">
              {step === 1 && (
                <div className="grid gap-4">
                  <Input label="Nombre" value={f.nombre} onChange={(v) => setF((s) => ({ ...s, nombre: v }))} placeholder="Ej. Miguel" />
                  <Input label="Teléfono" value={f.telefono} onChange={(v) => setF((s) => ({ ...s, telefono: v }))} placeholder="Ej. 6XX XXX XXX" />
                  <Input label="Email" value={f.email} onChange={(v) => setF((s) => ({ ...s, email: v }))} placeholder="Ej. tuemail@email.com" />
                  <div className="flex justify-end">
                    <button
                      disabled={!canNext1}
                      onClick={() => setStep(2)}
                      className="rounded-full bg-emerald-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-40"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4">
                  <Select
                    label="Tipo de instalación"
                    value={f.tipo}
                    onChange={(v) => setF((s) => ({ ...s, tipo: v as any }))}
                    options={[
                      { value: "vivienda", label: "Vivienda" },
                      { value: "empresa", label: "Empresa / negocio" },
                    ]}
                  />

                  <Select
                    label="Provincia"
                    value={f.provincia}
                    onChange={(v) => setF((s) => ({ ...s, provincia: v }))}
                    options={[
                      { value: "", label: "Selecciona..." },
                      ...provinciasSugeridas.map((p) => ({ value: p, label: p })),
                    ]}
                  />

                  <Input
                    label="Gasto mensual aproximado (€/mes)"
                    value={f.gastoMensual}
                    onChange={(v) => setF((s) => ({ ...s, gastoMensual: v }))}
                    placeholder="Ej. 80"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900"
                    >
                      ← Atrás
                    </button>
                    <button
                      disabled={!canNext2}
                      onClick={() => setStep(3)}
                      className="rounded-full bg-emerald-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-40"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-4">
                  <Select
                    label="¿Hay sombras importantes en el tejado?"
                    value={f.sombras}
                    onChange={(v) => setF((s) => ({ ...s, sombras: v as any }))}
                    options={[
                      { value: "no", label: "No / mínimas" },
                      { value: "si", label: "Sí, bastantes" },
                    ]}
                  />

                  <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-200">
                    <p className="font-semibold text-emerald-200 mb-1">Resumen</p>
                    <div className="grid gap-1">
                      <p>• Nombre: <b>{f.nombre || "—"}</b></p>
                      <p>• Tipo: <b>{f.tipo}</b></p>
                      <p>• Provincia: <b>{f.provincia || "—"}</b></p>
                      <p>• Gasto: <b>{f.gastoMensual || "—"} €/mes</b></p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Al enviar, te llevamos al registro (para guardar el lead con trazabilidad QR).
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900"
                    >
                      ← Atrás
                    </button>
                    <button
                      onClick={onSubmit}
                      disabled={loading}
                      className="rounded-full bg-emerald-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {loading ? "Enviando…" : "Enviar y recibir llamada"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <SolarHeroImage src="/solar/hero.jpg" alt="Solar Impulso - instalación profesional" priority />
            <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5 text-xs text-slate-200">
              <p className="font-semibold text-emerald-200">¿Qué obtienes?</p>
              <ul className="mt-2 space-y-1.5">
                <li>• Dimensionado de paneles e inversor</li>
                <li>• Ahorro estimado y retorno</li>
                <li>• Opciones con batería</li>
                <li>• Tramitación y ayudas (según zona)</li>
              </ul>
            </div>
          </div>
        </section>

        <SolarFooter />
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-slate-200 font-semibold">{label}</span>
      <input
        className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-slate-200 font-semibold">{label}</span>
      <select
        className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-950">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
