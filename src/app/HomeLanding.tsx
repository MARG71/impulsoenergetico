// src/app/HomeLanding.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

const HomeLanding: React.FC = () => {
  const router = useRouter();

  // AJUSTA ESTAS RUTAS SI EN TU PROYECTO SON OTRAS
  const irAlCRM = () => router.push("/login");      // o "/dashboard"
  const irARegistro = () => router.push("/registro");
  const irAAfiliados = () => router.push("/afiliados"); // futura página programa afiliados
  const irAComparador = (tipo?: string) =>
    router.push(tipo ? `/comparador?tipo=${tipo}` : "/comparador");
  const irAGanaderia = () => router.push("/ganaderia");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-12">
        {/* CABECERA */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-impulso.png" // usa aquí tu logo; asegúrate de que existe en /public
              alt="Impulso Energético"
              width={120}
              height={120}
              className="h-12 w-auto md:h-14"
              priority
            />
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs font-semibold tracking-[0.25em] text-amber-300 uppercase">
                Impulso Energético
              </span>
              <span className="text-[11px] text-slate-300">
                Plataforma de energía inteligente para agentes, clientes y lugares
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={irAlCRM}
              className="hidden sm:inline-flex px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold shadow-md shadow-amber-500/40 transition"
            >
              Acceder al CRM
            </button>
            <button
              onClick={irARegistro}
              className="px-4 py-2 rounded-full border border-amber-300 text-amber-200 font-semibold hover:bg-amber-300/10 transition"
            >
              Área clientes
            </button>
          </div>
        </header>

        {/* HERO PRINCIPAL (inspirado en /registro, pero como landing) */}
        <section className="grid gap-10 md:grid-cols-[1.7fr,1.3fr] items-center">
          {/* Texto principal */}
          <div className="space-y-5">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
              Plataforma de{" "}
              <span className="text-amber-300">ahorro energético</span> y{" "}
              <span className="text-amber-300">comisiones reales</span> para
              clientes, agentes y afiliados
            </h1>

            <p className="text-sm md:text-base text-slate-200/85 max-w-xl">
              Centraliza en un solo sitio la optimización de luz, gas, telefonía,
              energía solar, batería <span className="font-semibold">HERMES-IA</span>,
              seguros, viajes, productos ganaderos y más.  
              Escanea un QR, regístrate o entra al CRM y empieza a mover tu energía.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={irARegistro}
                className="px-6 py-2.5 rounded-full bg-amber-300 hover:bg-amber-200 text-slate-950 text-sm font-semibold shadow-lg shadow-amber-400/40 transition"
              >
                Soy cliente – ver ofertas
              </button>
              <button
                onClick={irAlCRM}
                className="px-6 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white shadow-lg shadow-sky-500/40 transition"
              >
                Soy agente – acceder al CRM
              </button>
              <button
                onClick={irAAfiliados}
                className="px-6 py-2.5 rounded-full border border-amber-300 text-amber-200 text-sm font-semibold hover:bg-amber-300/10 transition"
              >
                Quiero programa de afiliados
              </button>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              Estudio gratuito · Ofertas negociadas con compañías · Gestión
              completa de altas y portabilidades · Seguimiento desde tu panel.
            </p>
          </div>

          {/* Tarjeta lateral tipo “panel” */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-700/80 p-5 md:p-6 shadow-2xl shadow-black/60 space-y-4">
            <h2 className="text-base md:text-lg font-semibold">
              Elige cómo quieres usar Impulso Energético
            </h2>
            <div className="grid gap-3 text-xs md:text-sm">
              <div className="rounded-2xl bg-slate-950/70 border border-slate-700 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-200">
                    Clientes y empresas
                  </span>
                  <span className="text-[10px] text-amber-200/90">👤</span>
                </div>
                <p className="text-slate-300/90">
                  Regístrate en segundos, sube tus datos y accede a ofertas
                  reales en luz, gas, telefonía, solar y más.
                </p>
                <button
                  onClick={irARegistro}
                  className="mt-2 inline-flex px-3 py-1 rounded-full bg-amber-300 text-slate-950 text-[11px] font-semibold hover:bg-amber-200 transition"
                >
                  Entrar como cliente
                </button>
              </div>

              <div className="rounded-2xl bg-slate-950/70 border border-slate-700 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-200">
                    Agentes y comerciales
                  </span>
                  <span className="text-[10px] text-sky-200/90">💼</span>
                </div>
                <p className="text-slate-300/90">
                  Gestiona leads, comparativas, lugares, carteles con QR y comisiones
                  desde tu CRM profesional.
                </p>
                <button
                  onClick={irAlCRM}
                  className="mt-2 inline-flex px-3 py-1 rounded-full border border-sky-400 text-sky-200 text-[11px] font-semibold hover:bg-sky-500/10 transition"
                >
                  Entrar al CRM
                </button>
              </div>

              <div className="rounded-2xl bg-slate-950/70 border border-slate-700 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-200">
                    Afiliados y recomendadores
                  </span>
                  <span className="text-[10px] text-emerald-200/90">⚡</span>
                </div>
                <p className="text-slate-300/90">
                  Comparte tu enlace o QR y gana comisiones por cada cliente que
                  contrate luz, gas, telefonía o cualquier producto vinculado.
                </p>
                <button
                  onClick={irAAfiliados}
                  className="mt-2 inline-flex px-3 py-1 rounded-full border border-emerald-300 text-emerald-200 text-[11px] font-semibold hover:bg-emerald-400/10 transition"
                >
                  Ver programa de afiliados
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* QUÉ PRODUCTOS GESTIONA IMPULSO ENERGÉTICO */}
        <section className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">
            ¿Qué puedes gestionar desde Impulso Energético?
          </h2>
          <p className="text-sm text-slate-200/80 max-w-3xl">
            La misma filosofía que ves al escanear un QR y entrar en{" "}
            <span className="font-semibold">/registro</span> la llevamos ahora
            a toda la plataforma: varios proyectos, una sola puerta de entrada.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs md:text-sm">
            <button
              onClick={() => irAComparador("luz")}
              className="text-left rounded-2xl bg-slate-900/80 border border-amber-400/30 p-4 hover:border-amber-300 hover:bg-slate-900 transition"
            >
              <div className="text-xl mb-1">💡</div>
              <div className="font-semibold text-amber-200">
                Luz y electricidad
              </div>
              <p className="text-slate-300/90 mt-1">
                Comparador avanzado, optimización de potencia, estudios con HERMES-IA
                y ofertas negociadas.
              </p>
            </button>

            <button
              onClick={() => irAComparador("gas")}
              className="text-left rounded-2xl bg-slate-900/80 border border-orange-400/30 p-4 hover:border-orange-300 hover:bg-slate-900 transition"
            >
              <div className="text-xl mb-1">🔥</div>
              <div className="font-semibold text-orange-200">Gas</div>
              <p className="text-slate-300/90 mt-1">
                Estudio completo de tarifas y consumos para hogares, negocios e industria.
              </p>
            </button>

            <button
              onClick={() => irAComparador("telefonia")}
              className="text-left rounded-2xl bg-slate-900/80 border border-sky-400/40 p-4 hover:border-sky-300 hover:bg-slate-900 transition"
            >
              <div className="text-xl mb-1">📶</div>
              <div className="font-semibold text-sky-200">
                Telefonía e internet
              </div>
              <p className="text-slate-300/90 mt-1">
                Móvil, fibra y datos para empresas, con seguimiento de consumos y costes.
              </p>
            </button>

            <button
              onClick={() => router.push("/solar")}
              className="text-left rounded-2xl bg-slate-900/80 border border-yellow-300/40 p-4 hover:border-yellow-200 hover:bg-slate-900 transition"
            >
              <div className="text-xl mb-1">☀️</div>
              <div className="font-semibold text-yellow-100">
                Energía solar y autoconsumo
              </div>
              <p className="text-slate-300/90 mt-1">
                Estudios de placas, kits solares, monitorización y financiación.
              </p>
            </button>

            <button
              onClick={() => router.push("/bateria-hermes")}
              className="text-left rounded-2xl bg-slate-900/80 border border-purple-300/40 p-4 hover:border-purple-200 hover:bg-slate-900 transition"
            >
              <div className="text-xl mb-1">🔋</div>
              <div className="font-semibold text-purple-100">
                Batería HERMES-IA
              </div>
              <p className="text-slate-300/90 mt-1">
                Sistema de acumulación inteligente con IA, para maximizar tu
                autoconsumo y autonomía.
              </p>
            </button>

            <button
              onClick={irAGanaderia}
              className="text-left rounded-2xl bg-slate-900/80 border border-emerald-300/40 p-4 hover:border-emerald-200 hover:bg-slate-900 transition"
            >
              <div className="text-xl mb-1">🐄</div>
              <div className="font-semibold text-emerald-100">
                Productos ganaderos
              </div>
              <p className="text-slate-300/90 mt-1">
                Plásticos de ensilaje G700, mallas, ventilación, ordeños y catálogo
                completo para explotaciones.
              </p>
            </button>

            <button
              onClick={() => router.push("/seguros")}
              className="text-left rounded-2xl bg-slate-900/80 border border-slate-300/40 p-4 hover:border-slate-200 hover:bg-slate-900 transition"
            >
              <div className="text-xl mb-1">🛡️</div>
              <div className="font-semibold text-slate-100">
                Seguros, viajes y más
              </div>
              <p className="text-slate-300/90 mt-1">
                Acceso a proyectos complementarios: seguros, viajes, repuestos,
                ferretería y servicios adicionales.
              </p>
            </button>
          </div>
        </section>

        {/* CÓMO FUNCIONA / PASOS */}
        <section className="border-t border-slate-800 pt-8 space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-slate-50 text-center">
            ¿Cómo funciona Impulso Energético?
          </h2>
          <div className="grid md:grid-cols-4 gap-4 text-xs md:text-sm">
            {[
              {
                num: "01",
                titulo: "Escanea o entra",
                texto:
                  "Llegas desde un QR, un enlace o directamente a impulsoenergetico.es.",
              },
              {
                num: "02",
                titulo: "Regístrate o inicia sesión",
                texto:
                  "Clientes se registran en /registro; agentes y afiliados acceden a su CRM.",
              },
              {
                num: "03",
                titulo: "Comparamos y negociamos",
                texto:
                  "El comparador, HERMES-IA y el equipo revisan tus opciones reales de ahorro.",
              },
              {
                num: "04",
                titulo: "Ahorras y ganas comisiones",
                texto:
                  "Aplicamos los cambios, controlamos tus suministros y tú puedes ganar dinero recomendando.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="text-center rounded-2xl bg-slate-900/80 border border-slate-700 p-4 space-y-2"
              >
                <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-amber-300/20 text-amber-200 text-xs font-bold">
                  {step.num}
                </div>
                <div className="font-semibold text-slate-50">
                  {step.titulo}
                </div>
                <p className="text-slate-300 text-[11px] md:text-xs">
                  {step.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pt-6 border-t border-slate-800 mt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} Impulso Energético</span>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/legal")}
              className="hover:text-amber-200 transition"
            >
              Aviso legal
            </button>
            <button
              onClick={() => router.push("/privacidad")}
              className="hover:text-amber-200 transition"
            >
              Privacidad
            </button>
            <button
              onClick={() => router.push("/cookies")}
              className="hover:text-amber-200 transition"
            >
              Cookies
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomeLanding;
