"use client";

import Image from "next/image";
import Link from "next/link";

export default function RepuestosCochesContenido() {
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
            Repuestos de coche{" "}
            <span className="text-emerald-400">en confianza</span>
          </h1>
          <p className="text-slate-200/85 max-w-2xl mx-auto text-sm md:text-base">
            Te ayudamos a conseguir los{" "}
            <span className="font-semibold">repuestos que necesita tu coche</span>:
            frenos, filtros, aceites, suspensión, electricidad…  
            Mismo estilo Impulso: claridad, buen precio y acompañamiento.
          </p>
        </div>

        {/* Bloque principal */}
        <section className="grid md:grid-cols-2 gap-8 mb-12 items-start">
          <div className="bg-slate-900/80 border border-emerald-500/40 rounded-3xl p-6 shadow-xl shadow-black/50">
            <h2 className="text-xl font-bold mb-3 text-emerald-400">
              ¿Qué tipo de repuestos trabajamos?
            </h2>
            <ul className="space-y-2 text-sm text-slate-100/90">
              <li>• Frenos (discos, pastillas, kits completos)</li>
              <li>• Mantenimiento: aceites, filtros, líquidos</li>
              <li>• Suspensión, dirección y amortiguadores</li>
              <li>• Baterías, alternadores y componentes eléctricos</li>
              <li>• Iluminación, retrovisores y pequeños golpes</li>
              <li>• Accesorios interiores y exteriores</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              Cuanto más detalle nos des del vehículo (marca, modelo, año, motor,
              o incluso VIN), mejor afinamos el presupuesto.
            </p>
          </div>

          {/* CTA lateral */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900/60 border border-slate-700/80 rounded-3xl p-5">
              <h3 className="text-lg font-semibold mb-2">
                Mismo espíritu que en el comparador de energía
              </h3>
              <p className="text-sm text-slate-200/85">
                Te buscamos la{" "}
                <span className="font-semibold">opción más eficiente</span> en
                calidad/precio para el repuesto, explicando siempre alternativas:
                original, equivalente o calidad superior si compensa.
              </p>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-slate-900 border border-emerald-500/50 rounded-3xl p-5">
              <h3 className="text-lg font-semibold mb-3">
                ¿Quieres que busquemos el repuesto por ti?
              </h3>
              <div className="flex flex-col gap-3">
                <a
                  href="https://wa.me/34600000000?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20repuestos%20de%20coche"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition"
                >
                  Pedir presupuesto por WhatsApp
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

        {/* Extra info en 3 columnas */}
        <section className="mb-6">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4">
              <h4 className="font-semibold mb-2 text-emerald-300 text-sm">
                Para particulares
              </h4>
              <p className="text-xs text-slate-200/85">
                Si tu taller te pide la pieza, te ayudamos a conseguirla a buen
                precio y con las referencias correctas.
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4">
              <h4 className="font-semibold mb-2 text-emerald-300 text-sm">
                Para talleres y flotas
              </h4>
              <p className="text-xs text-slate-200/85">
                Podemos estudiar condiciones especiales si tienes varios vehículos
                o trabajas como taller profesional.
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4">
              <h4 className="font-semibold mb-2 text-emerald-300 text-sm">
                Transparencia total
              </h4>
              <p className="text-xs text-slate-200/85">
                Te explicamos qué marcas te ofrecemos y por qué, igual que hacemos
                con tus tarifas de luz, gas y otros servicios.
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
