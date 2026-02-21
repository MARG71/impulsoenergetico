// src/app/ofertas/OfertasContenido.tsx

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

const HomeContenido: React.FC = () => {
  const router = useRouter();

  const irAlCRM = () => {
    // Cambia "/login" por la ruta real de acceso al CRM si es distinta
    router.push("/login");
  };

  const irARegistro = () => {
    router.push("/registro");
  };

  const irAComparador = (tipo?: "luz" | "gas" | "telefonia") => {
    if (tipo) {
      router.push(`/comparador?tipo=${tipo}`);
    } else {
      router.push("/comparador");
    }
  };

  const irAGanaderia = () => {
    router.push("/ganaderia");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* CABECERA SIMPLE */}
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Cambia la ruta del logo por la que ya usas en /registro */}
            <Image
              src="/LOGO-DEFINITIVO-IMPULSO-ENERGETICO.png"
              alt="Impulso Energético"
              width={70}
              height={70}
              className="h-12 w-auto"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-[0.25em] text-sky-800 uppercase">
                Impulso Energético
              </span>
              <span className="text-[11px] text-slate-500">
                Plataforma de energía inteligente para agentes, clientes y lugares
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={irAlCRM}
              className="hidden sm:inline-flex px-4 py-2 rounded-full bg-sky-700 hover:bg-sky-800 text-white font-semibold transition"
            >
              Acceder al CRM
            </button>
            <button
              onClick={irARegistro}
              className="px-4 py-2 rounded-full border border-sky-700 text-sky-800 font-semibold hover:bg-sky-50 transition"
            >
              Acceder a ofertas
            </button>
          </div>
        </div>
      </header>

      {/* HERO CENTRAL */}
      <main className="max-w-6xl mx-auto px-4 py-10 md:py-14 space-y-12">
        <section className="text-center space-y-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/LOGO-DEFINITIVO-IMPULSO-ENERGETICO.png"
              alt="Impulso Energético"
              width={90}
              height={90}
              className="h-16 w-auto"
            />
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-sky-800">
            Bienvenido a Impulso Energético
          </h1>

          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-600">
            Plataforma de energía inteligente para agentes, clientes y lugares.
            Escanee un código QR, regístrese como cliente o acceda al CRM como comercial
            para empezar a ahorrar y gestionar sus suministros.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={irARegistro}
              className="px-6 py-2.5 rounded-full bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold shadow-md shadow-sky-300/40 transition"
            >
              Soy cliente – ver ofertas
            </button>
            <button
              onClick={irAlCRM}
              className="px-6 py-2.5 rounded-full border border-sky-700 text-sky-800 text-sm font-semibold hover:bg-sky-50 transition"
            >
              Soy agente – acceder al CRM
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Estudio gratuito · Ofertas reales y negociadas · Gestión completa de altas y portabilidades
          </p>
        </section>

        {/* BLOQUE DE ACCESO RÁPIDO A SECCIONES */}
        <section className="grid md:grid-cols-[1.6fr,1.4fr] gap-8 items-start">
          {/* Tarjetas de secciones */}
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-800">
              Elige qué quieres optimizar
            </h2>
            <p className="text-sm text-slate-600 max-w-xl">
              Desde esta página tendrás acceso a todos los proyectos de Impulso Energético:
              comparador de luz y gas, telefonía, productos ganaderos, energía solar,
              batería HERMES-IA y mucho más.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <button
                onClick={() => irAComparador("luz")}
                className="text-left p-4 rounded-2xl border border-sky-100 hover:border-sky-300 hover:shadow-sm transition bg-sky-50"
              >
                <div className="text-xl mb-1">💡</div>
                <div className="font-semibold text-sky-900">Luz y electricidad</div>
                <p className="text-xs text-slate-600 mt-1">
                  Compara tarifas, potencia y consigue una factura optimizada.
                </p>
              </button>

              <button
                onClick={() => irAComparador("gas")}
                className="text-left p-4 rounded-2xl border border-orange-100 hover:border-orange-300 hover:shadow-sm transition bg-orange-50"
              >
                <div className="text-xl mb-1">🔥</div>
                <div className="font-semibold text-orange-900">Gas</div>
                <p className="text-xs text-slate-600 mt-1">
                  Estudia tus consumos y encuentra la mejor opción para tu negocio o vivienda.
                </p>
              </button>

              <button
                onClick={() => irAComparador("telefonia")}
                className="text-left p-4 rounded-2xl border border-sky-100 hover:border-sky-300 hover:shadow-sm transition bg-sky-50"
              >
                <div className="text-xl mb-1">📶</div>
                <div className="font-semibold text-sky-900">Telefonía y datos</div>
                <p className="text-xs text-slate-600 mt-1">
                  Móvil, fibra, datos para empresas y soluciones convergentes.
                </p>
              </button>

              <button
                onClick={irAGanaderia}
                className="text-left p-4 rounded-2xl border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition bg-emerald-50"
              >
                <div className="text-xl mb-1">🐄</div>
                <div className="font-semibold text-emerald-900">
                  Productos ganaderos
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Plásticos de ensilaje, mallas, ventilación, ordeños y más.
                </p>
              </button>
            </div>
          </div>

          {/* Bloque lateral: “Acceso directo” + mini resumen ofertas */}
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-800">
              Acceso directo para clientes y agentes
            </h2>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm">
              <div className="space-y-1">
                <div className="font-semibold text-slate-800">Clientes</div>
                <p className="text-xs text-slate-600">
                  Si has escaneado un QR o te ha invitado un comercial, empieza
                  registrándote para ver tus ofertas personalizadas.
                </p>
                <button
                  onClick={irARegistro}
                  className="mt-2 inline-flex items-center px-4 py-1.5 rounded-full bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold transition"
                >
                  Ver ofertas y registrarme
                </button>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="space-y-1">
                <div className="font-semibold text-slate-800">Agentes / comerciales</div>
                <p className="text-xs text-slate-600">
                  Accede al CRM para gestionar lugares, comparativas, leads, carteles
                  con QR y comisiones.
                </p>
                <button
                  onClick={irAlCRM}
                  className="mt-2 inline-flex items-center px-4 py-1.5 rounded-full border border-sky-700 text-sky-800 text-xs font-semibold hover:bg-sky-50 transition"
                >
                  Entrar al CRM
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
              <div className="font-semibold text-slate-800">
                Próximamente en esta página
              </div>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Carrusel de ofertas destacadas conectado al comparador.</li>
                <li>Acceso rápido a batería HERMES-IA y estudios de ahorro.</li>
                <li>Panel público de productos ganaderos y ofertas especiales.</li>
              </ul>
              <p className="text-[11px] text-slate-500 pt-1">
                Esta será la página base desde la que conectaremos todos los módulos
                de Impulso Energético.
              </p>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="border-t border-slate-200 pt-8 space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-slate-800 text-center">
            ¿Cómo funciona Impulso Energético?
          </h2>
          <div className="grid md:grid-cols-4 gap-4 text-xs md:text-sm">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-sky-100 text-sky-800 font-bold">
                1
              </div>
              <div className="font-semibold">Escanea o accede</div>
              <p className="text-slate-600">
                Escanea un QR, entra desde un enlace o accede a esta página como
                cliente o comercial.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-sky-100 text-sky-800 font-bold">
                2
              </div>
              <div className="font-semibold">Regístrate o inicia sesión</div>
              <p className="text-slate-600">
                Los clientes se registran en segundos; los agentes acceden al CRM
                con su usuario.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-sky-100 text-sky-800 font-bold">
                3
              </div>
              <div className="font-semibold">Compara y elige</div>
              <p className="text-slate-600">
                El comparador y el equipo de Impulso buscan las mejores opciones
                para cada caso.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-sky-100 text-sky-800 font-bold">
                4
              </div>
              <div className="font-semibold">Ahorra y haz seguimiento</div>
              <p className="text-slate-600">
                Gestionamos altas y cambios, y podrás hacer seguimiento desde el
                CRM y los informes.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER SIMPLE */}
        <footer className="pt-6 border-t border-slate-200 mt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Impulso Energético</span>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/legal")}
              className="hover:text-sky-700 transition"
            >
              Aviso legal
            </button>
            <button
              onClick={() => router.push("/privacidad")}
              className="hover:text-sky-700 transition"
            >
              Privacidad
            </button>
            <button
              onClick={() => router.push("/cookies")}
              className="hover:text-sky-700 transition"
            >
              Política de cookies
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default HomeContenido;
