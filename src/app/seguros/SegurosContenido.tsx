"use client";

import Image from "next/image";
import Link from "next/link";

export default function SegurosContenido() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        {/* Logo Impulso */}
        <div className="flex justify-center mb-8">
          <Image
            src="/impulso-logo.png" // AJUSTA ESTA RUTA AL NOMBRE REAL DEL LOGO
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
            Seguros de{" "}
            <span className="text-amber-400">todo tipo</span> con varias compañías
          </h1>
          <p className="text-slate-200/85 max-w-2xl mx-auto text-sm md:text-base">
            Revisamos tus pólizas actuales y las comparamos con{" "}
            <span className="font-semibold">varias aseguradoras</span> para que
            pagues solo por lo que necesitas, con un interlocutor único: Impulso
            Energético.
          </p>
        </div>

        {/* Bloque principal */}
        <section className="grid md:grid-cols-2 gap-8 mb-12 items-start">
          <div className="bg-slate-900/80 border border-amber-400/50 rounded-3xl p-6 shadow-xl shadow-black/50">
            <h2 className="text-xl font-bold mb-3 text-amber-300">
              Tipos de seguros que podemos revisar
            </h2>
            <ul className="space-y-2 text-sm text-slate-100/90">
              <li>• Hogar y comunidades</li>
              <li>• Coche, moto, furgoneta y flotas</li>
              <li>• Comercio, nave industrial y oficinas</li>
              <li>• Responsabilidad civil (autónomos y empresas)</li>
              <li>• Vida, salud y accidentes</li>
              <li>• Seguros ligados a instalaciones de energía y renovables</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              Nuestra idea es la misma que en las facturas de luz y gas:
              detectar sobrecostes, coberturas duplicadas o carencias importantes.
            </p>
          </div>

          {/* CTA lateral */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900/60 border border-slate-700/80 rounded-3xl p-5">
              <h3 className="text-lg font-semibold mb-2">
                Filosofía Impulso aplicada a tus seguros
              </h3>
              <p className="text-sm text-slate-200/85">
                Analizamos lo que tienes contratado, lo comparamos con varias
                compañías y te explicamos con calma{" "}
                <span className="font-semibold">
                  qué coberturas tienes, cuáles faltan y dónde puedes ahorrar
                </span>
                .
              </p>
            </div>

            <div className="bg-gradient-to-r from-amber-400/20 via-emerald-500/10 to-slate-900 border border-amber-400/60 rounded-3xl p-5">
              <h3 className="text-lg font-semibold mb-3">
                ¿Empezamos revisando tus pólizas?
              </h3>
              <div className="flex flex-col gap-3">
                <a
                  href="https://wa.me/34600000000?text=Hola%2C%20quiero%20revisar%20mis%20seguros%20con%20Impulso%20Energ%C3%A9tico"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center px-4 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-semibold shadow-lg shadow-amber-400/40 transition"
                >
                  Hablar por WhatsApp
                </a>
                <Link
                  href="/registro"
                  className="text-center px-4 py-3 rounded-full border border-slate-600 hover:border-amber-400 hover:text-amber-200 text-sm font-semibold transition"
                >
                  Dejar mis datos para que me llaméis
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Extra info en 3 bloques */}
        <section className="mb-6">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4">
              <h4 className="font-semibold mb-2 text-amber-300 text-sm">
                Sin letra pequeña
              </h4>
              <p className="text-xs text-slate-200/85">
                Te resumimos las condiciones de manera comprensible: coberturas,
                franquicias y exclusiones importantes.
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4">
              <h4 className="font-semibold mb-2 text-amber-300 text-sm">
                Multi-compañía
              </h4>
              <p className="text-xs text-slate-200/85">
                Trabajamos con varias aseguradoras para encontrar el mejor
                equilibrio entre precio y protección.
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4">
              <h4 className="font-semibold mb-2 text-amber-300 text-sm">
                Acompañamiento real
              </h4>
              <p className="text-xs text-slate-200/85">
                No te dejamos solo cuando hay un siniestro importante: estamos
                a tu lado para que el seguro responda.
              </p>
            </div>
          </div>
        </section>

        {/* Botón volver */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/bienvenida"
            className="text-xs md:text-sm px-4 py-2 rounded-full border border-slate-600 hover:border-amber-400 hover:text-amber-200 transition"
          >
            Volver a la pantalla de bienvenida
          </Link>
        </div>
      </div>
    </div>
  );
}
