"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";

const HomeContenido: React.FC = () => {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ Capturamos trazabilidad si viene de /share/lugar/[id]
  const agenteId = sp.get("agenteId") ?? "";
  const lugarId = sp.get("lugarId") ?? "";
  const qr = sp.get("qr") ?? "";
  const v = sp.get("v") ?? "";

  // ✅ Helper: crea querystring manteniendo trazabilidad
  const qsBase = useMemo(() => {
    const qs = new URLSearchParams();
    if (agenteId) qs.set("agenteId", agenteId);
    if (lugarId) qs.set("lugarId", lugarId);
    if (qr) qs.set("qr", qr);
    if (v) qs.set("v", v);
    return qs;
  }, [agenteId, lugarId, qr, v]);

  function pushWithQS(path: string, extra?: Record<string, string>) {
    const qs = new URLSearchParams(qsBase.toString());
    if (extra) {
      for (const [k, val] of Object.entries(extra)) {
        if (val) qs.set(k, val);
      }
    }
    const url = qs.toString() ? `${path}?${qs.toString()}` : path;
    router.push(url);
  }

  const irAlCRM = () => router.push("/login");

  const irARegistro = () => pushWithQS("/registro");

  const irAComparador = (tipo?: "luz" | "gas" | "telefonia") => {
    if (tipo) pushWithQS("/comparador", { tipo });
    else pushWithQS("/comparador");
  };

  const irAGanaderia = () => pushWithQS("/ganaderia");

  const vieneDeQR = Boolean(lugarId || agenteId || qr);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* CABECERA */}
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/LOGO-DEFINITIVO-IMPULSO-ENERGETICO.png"
              alt="Impulso Energético"
              width={70}
              height={70}
              className="h-12 w-auto"
              priority
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-[0.25em] text-sky-800 uppercase">
                Impulso Energético
              </span>
              <span className="text-[11px] text-slate-500">
                Ahorra en Luz, Gas y Telefonía · Ofertas reales · Atención rápida
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
              Ver ofertas y registrarme
            </button>
          </div>
        </div>
      </header>

      {/* BLOQUE PRO “GANCHO” (muy importante en móvil) */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-sm md:text-base font-extrabold text-slate-900">
                ✅ Estudio gratuito en 1 minuto
              </div>
              <div className="text-xs md:text-sm text-slate-600 font-semibold mt-1">
                Te buscamos la mejor opción y gestionamos el cambio por ti. Sin compromiso.
              </div>

              {vieneDeQR ? (
                <div className="mt-2 text-[11px] text-slate-500 font-semibold">
                  (Acceso desde QR / invitación) · Tu solicitud quedará asociada al lugar/agente.
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-slate-500 font-semibold">
                  Accede como cliente para ver ofertas y registrarte en segundos.
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={irARegistro}
                className="px-5 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-extrabold transition shadow-md shadow-emerald-200/60"
              >
                ✅ Registrarme ahora
              </button>
              <button
                onClick={() => irAComparador("luz")}
                className="px-5 h-11 rounded-full border border-sky-700 text-sky-800 text-sm font-extrabold hover:bg-sky-50 transition"
              >
                Ver comparador
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HERO CENTRAL */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-12">
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
            Ahorra en tu factura y mejora tus condiciones
          </h1>

          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-600">
            En Impulso Energético comparamos y negociamos ofertas de{" "}
            <span className="font-bold">Luz, Gas y Telefonía</span>. Te ayudamos a
            elegir y gestionamos el alta o el cambio por ti.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={irARegistro}
              className="px-6 py-2.5 rounded-full bg-sky-700 hover:bg-sky-800 text-white text-sm font-extrabold shadow-md shadow-sky-300/40 transition"
            >
              ✅ Ver ofertas y registrarme
            </button>
            <button
              onClick={irAlCRM}
              className="px-6 py-2.5 rounded-full border border-sky-700 text-sky-800 text-sm font-extrabold hover:bg-sky-50 transition"
            >
              Soy agente – acceder al CRM
            </button>
          </div>

          <p className="text-[11px] text-slate-500 font-semibold">
            Estudio gratuito · Atención rápida · Gestión completa de altas y portabilidades
          </p>
        </section>

        {/* BLOQUE DE ACCESO RÁPIDO A SECCIONES */}
        <section className="grid md:grid-cols-[1.6fr,1.4fr] gap-8 items-start">
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800">
              Elige qué quieres optimizar
            </h2>
            <p className="text-sm text-slate-600 max-w-xl">
              Te llevamos directo a lo que necesitas. Si vienes desde QR, tu trazabilidad se mantiene.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <button
                onClick={() => irAComparador("luz")}
                className="text-left p-4 rounded-2xl border border-sky-100 hover:border-sky-300 hover:shadow-sm transition bg-sky-50"
              >
                <div className="text-xl mb-1">💡</div>
                <div className="font-extrabold text-sky-900">Luz y electricidad</div>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  Compara tarifas y potencia. Te ayudamos a pagar menos.
                </p>
              </button>

              <button
                onClick={() => irAComparador("gas")}
                className="text-left p-4 rounded-2xl border border-orange-100 hover:border-orange-300 hover:shadow-sm transition bg-orange-50"
              >
                <div className="text-xl mb-1">🔥</div>
                <div className="font-extrabold text-orange-900">Gas</div>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  Ajustamos tu tarifa y condiciones para ahorrar.
                </p>
              </button>

              <button
                onClick={() => irAComparador("telefonia")}
                className="text-left p-4 rounded-2xl border border-sky-100 hover:border-sky-300 hover:shadow-sm transition bg-sky-50"
              >
                <div className="text-xl mb-1">📶</div>
                <div className="font-extrabold text-sky-900">Telefonía y datos</div>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  Fibra y móvil con mejores precios y condiciones.
                </p>
              </button>

              <button
                onClick={irAGanaderia}
                className="text-left p-4 rounded-2xl border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition bg-emerald-50"
              >
                <div className="text-xl mb-1">🐄</div>
                <div className="font-extrabold text-emerald-900">Productos ganaderos</div>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  Plásticos, mallas, ventilación, ordeños y más.
                </p>
              </button>
            </div>
          </div>

          {/* Lateral CTA */}
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800">
              Empieza en 1 minuto
            </h2>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm">
              <div className="space-y-1">
                <div className="font-extrabold text-slate-800">Clientes</div>
                <p className="text-xs text-slate-600 font-semibold">
                  Regístrate y te contactamos para darte la mejor oferta.
                </p>
                <button
                  onClick={irARegistro}
                  className="mt-2 inline-flex items-center px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition"
                >
                  ✅ Ver ofertas y registrarme
                </button>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="space-y-1">
                <div className="font-extrabold text-slate-800">Agentes / comerciales</div>
                <p className="text-xs text-slate-600 font-semibold">
                  Accede al CRM para gestionar leads, lugares, carteles con QR y comisiones.
                </p>
                <button
                  onClick={irAlCRM}
                  className="mt-2 inline-flex items-center px-4 py-2 rounded-full border border-sky-700 text-sky-800 text-xs font-extrabold hover:bg-sky-50 transition"
                >
                  Entrar al CRM
                </button>
              </div>
            </div>

            {vieneDeQR ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs">
                <div className="font-extrabold text-emerald-900">
                  ✅ Acceso verificado desde QR / enlace autorizado
                </div>
                <div className="mt-1 text-emerald-800 font-semibold">
                  Tu registro quedará asociado correctamente para atención prioritaria.
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="border-t border-slate-200 pt-8 space-y-4">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-800 text-center">
            ¿Cómo funciona?
          </h2>

          <div className="grid md:grid-cols-4 gap-4 text-xs md:text-sm">
            {[
              {
                n: 1,
                t: "Accede desde QR o enlace",
                d: "Entra desde un QR autorizado o un enlace directo.",
              },
              {
                n: 2,
                t: "Regístrate en segundos",
                d: "Nombre, email y teléfono. ¡Listo!",
              },
              {
                n: 3,
                t: "Recibes ofertas reales",
                d: "Te damos la mejor opción según tu caso.",
              },
              {
                n: 4,
                t: "Gestionamos el cambio",
                d: "Alta, portabilidad y seguimiento completo.",
              },
            ].map((x) => (
              <div key={x.n} className="text-center space-y-2">
                <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-sky-100 text-sky-800 font-extrabold">
                  {x.n}
                </div>
                <div className="font-extrabold">{x.t}</div>
                <p className="text-slate-600 font-semibold">{x.d}</p>
              </div>
            ))}
          </div>

          <div className="pt-6 flex justify-center">
            <button
              onClick={irARegistro}
              className="px-7 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-extrabold transition shadow-md shadow-emerald-200/60"
            >
              ✅ Quiero mis ofertas – Registrarme
            </button>
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
