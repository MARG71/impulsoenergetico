"use client";

import React from "react";
import SolarHeader from "../_shared/SolarHeader";
import SolarFooter from "../_shared/SolarFooter";
import SolarHeroImage from "../_shared/SolarHeroImage";

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 md:py-10">
        <SolarHeader />

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start mb-10">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-6 md:p-8">
            <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
              Proceso · Solar Impulso
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Así trabajamos tu proyecto solar</h1>
            <p className="text-sm text-slate-200 mt-2 max-w-2xl">
              Un método claro, sin sorpresas: estudio, diseño, instalación, legalización y seguimiento.
            </p>

            <div className="grid gap-4 md:grid-cols-2 mt-6 text-sm">
              {[
                ["1 · Estudio de consumo", "Analizamos tus facturas y horarios para dimensionar correctamente."],
                ["2 · Diseño e ingeniería", "Cálculo de paneles, inversor, estructura y protecciones."],
                ["3 · Tramitación", "Licencias, legalización y ayudas según tu comunidad."],
                ["4 · Instalación", "Montaje profesional y puesta en marcha."],
                ["5 · Monitorización", "App y seguimiento para ver tu ahorro real."],
                ["6 · Optimización", "Opcional: batería, EV, aerotermia y gestión inteligente."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <p className="text-emerald-300 font-semibold text-[12px] mb-1">{t}</p>
                  <p className="text-slate-200 text-sm">{d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SolarHeroImage src="/solar/proceso.jpg" alt="Proceso de instalación solar profesional" />
            <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5 text-xs text-slate-200">
              <p className="font-semibold text-emerald-200">Tip</p>
              <p className="mt-2 text-slate-200">
                Cuanto más exacta sea tu factura (kWh y potencia), más fino sale el dimensionado.
              </p>
            </div>
          </div>
        </section>

        <SolarFooter />
      </div>
    </div>
  );
}
