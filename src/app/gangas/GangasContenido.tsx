"use client";

import Image from "next/image";
import Link from "next/link";

export default function GangasContenido() {
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
            La Tienda de las{" "}
            <span className="text-emerald-400">Gangas</span>
          </h1>
          <p className="text-slate-200/85 max-w-2xl mx-auto text-sm md:text-base">
            Un espacio donde reunir{" "}
            <span className="font-semibold">ofertas, chollos y productos a precios muy ajustados</span>,
            con la garantía de que detrás hay personas de confianza.
            Tu lugar para encontrar “gangas” con el sello de Impulso.
          </p>
        </div>

        {/* Bloque principal */}
        <section className="grid md:grid-cols-2 gap-8 mb-12 items-start">
          {/* Info izquierda */}
          <div className="bg-slate-900/80 border border-emerald-500/40 rounded-3xl p-6 shadow-xl shadow-black/50">
            <h2 className="text-xl font-bold mb-3 text-emerald-400">
              ¿Qué es La Tienda de las Gangas?
            </h2>
            <p className="text-sm text-slate-100/90 mb-3">
              Es un escaparate online donde vamos seleccionando productos con
              buena relación calidad/precio: tecnología, hogar, herramientas,
              gadgets… lo que encaje con ahorrar y aprovechar oportunidades.
            </p>
            <ul className="space-y-2 text-sm text-slate-100/90">
              <li>• Ofertas especiales y liquidaciones puntuales</li>
              <li>• Productos pensados para el día a día</li>
              <li>• Selección basada en utilidad y precio</li>
              <li>• La misma filosofía de ahorro que en el resto de Impulso</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              El catálogo y las promociones pueden ir cambiando con el tiempo:
              por eso siempre es buena idea pasarse y echar un vistazo.
            </p>
          </div>

          {/* CTA derecha */}
          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-slate-900 border border-emerald-500/60 rounded-3xl p-5">
              <h3 className="text-lg font-semibold mb-3">
                Entra ahora en La Tienda de las Gangas
              </h3>
              <p className="text-sm text-slate-100/90 mb-4">
                Haz clic en el botón y te llevamos directamente a la web con todas
                las ofertas activas en este momento.
              </p>
              <a
                href="https://latiendadelasgangas.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition"
              >
                Ir a La Tienda de las Gangas
              </a>
            </div>

            <div className="bg-slate-900/70 border border-slate-700/80 rounded-3xl p-5">
              <h3 className="text-lg font-semibold mb-2">
                ¿Necesitas ayuda con algún producto o pedido?
              </h3>
              <p className="text-sm text-slate-200/85 mb-3">
                Si quieres que te asesoremos sobre alguna compra, producto o
                promoción concreta, puedes dejarnos tus datos y te llamamos.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://wa.me/34600000000?text=Hola%2C%20quiero%20informaci%C3%B3n%20de%20La%20Tienda%20de%20las%20Gangas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center px-4 py-3 rounded-full border border-slate-600 hover:border-emerald-400 hover:text-emerald-300 text-sm font-semibold transition"
                >
                  Consultar por WhatsApp
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
