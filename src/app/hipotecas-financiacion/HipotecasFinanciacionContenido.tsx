"use client";

import Image from "next/image";
import Link from "next/link";

export default function HipotecasFinanciacionContenido() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        {/* Logo Impulso */}
        <div className="flex justify-center mb-8">
          <Image
            src="/impulso-logo.png" // ⬅️ AJUSTA AL NOMBRE REAL DEL LOGO
            alt="Impulso Energético"
            width={260}
            height={80}
            className="h-auto w-auto max-h-20 object-contain drop-shadow-lg"
            priority
          />
        </div>

        {/* Título / intro */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
            Hipotecas y Financiación{" "}
            <span className="text-emerald-400">IMPULSO</span>
          </h1>
          <p className="text-slate-200/85 max-w-2xl mx-auto text-sm md:text-base">
            Revisamos tu hipoteca actual, estudiamos opciones de mejora y
            buscamos la financiación adecuada para tus proyectos: vivienda,
            reformas, instalaciones solares, baterías, eficiencia energética y más.
          </p>
        </div>

        {/* Bloque principal */}
        <section className="grid md:grid-cols-2 gap-8 mb-12 items-start">
          {/* Info izquierda */}
          <div className="bg-slate-900/80 border border-emerald-500/50 rounded-3xl p-6 shadow-xl shadow-black/50">
            <h2 className="text-xl font-bold mb-3 text-emerald-300">
              ¿En qué podemos ayudarte?
            </h2>
            <ul className="space-y-2 text-sm text-slate-100/90">
              <li>• Revisión de tu hipoteca actual (tipo, diferenciales, comisiones)</li>
              <li>• Estudio de subrogación o cambio de banco</li>
              <li>• Financiación para instalaciones solares y baterías</li>
              <li>• Préstamos para reformas y eficiencia energética</li>
              <li>• Financiación para negocios y proyectos profesionales</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              Nuestro objetivo es que entiendas bien tus condiciones actuales y
              veas, con números, si tiene sentido cambiar, negociar o mantener.
            </p>
          </div>

          {/* CTA derecha */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900/60 border border-slate-700/80 rounded-3xl p-5">
              <h3 className="text-lg font-semibold mb-2">
                La misma filosofía que en el comparador de energía
              </h3>
              <p className="text-sm text-slate-200/85">
                Todo se basa en{" "}
                <span className="font-semibold">
                  claridad, números y ahorro a largo plazo
                </span>
                . Revisamos tus condiciones, te explicamos las alternativas y
                te ayudamos a decidir con calma.
              </p>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/20 via-blue-500/10 to-slate-900 border border-emerald-500/60 rounded-3xl p-5">
              <h3 className="text-lg font-semibold mb-3">
                ¿Quieres que estudiemos tu caso?
              </h3>
              <p className="text-sm text-slate-100/90 mb-3">
                Podemos empezar con tus últimas escrituras, recibos de hipoteca
                o presupuestos de la inversión que quieres hacer.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://wa.me/34600000000?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20hipotecas%20y%20financiaci%C3%B3n%20IMPULSO"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition"
                >
                  Hablar por WhatsApp
                </a>
                <Link
                  href="/registro"
                  className="text-center px-4 py-3 rounded-full border border-slate-600 hover:border-emerald-400 hover:text-emerald-300 text-sm font-semibold transition"
                >
                  Dejar mis datos para que me llaméis
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bloques extra */}
        <section className="mb-6">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4">
              <h4 className="font-semibold mb-2 text-emerald-300 text-sm">
                Para familias
              </h4>
              <p className="text-xs text-slate-200/85">
                Revisamos tu hipoteca o financiación actual para ver si puedes
                reducir cuota o años manteniendo seguridad.
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4">
              <h4 className="font-semibold mb-2 text-emerald-300 text-sm">
                Para proyectos de energía
              </h4>
              <p className="text-xs text-slate-200/85">
                Instalaciones solares, baterías, aerotermia… alineamos la forma de
                pagarlo con el ahorro que genera.
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4">
              <h4 className="font-semibold mb-2 text-emerald-300 text-sm">
                Para negocios
              </h4>
              <p className="text-xs text-slate-200/85">
                Estudiamos fórmulas de financiación para empresas y autónomos,
                conectando inversión, ahorro y flujo de caja.
              </p>
            </div>
          </div>
        </section>

        {/* Botón volver */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/bienvenida"
            className="text-xs md:text-sm px-4 py-2 rounded-full border border-slate-600 hover:border-emerald-400 hover:text-emerald-300 transition"
          >
            Volver a la pantalla de bienvenida
          </Link>
        </div>
      </div>
    </div>
  );
}
