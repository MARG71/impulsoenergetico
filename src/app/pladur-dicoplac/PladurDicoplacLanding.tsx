// src/app/pladur-dicoplac/PladurDicoplacLanding.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function useBuildQuery() {
  const searchParams = useSearchParams();

  return (extra?: Record<string, string>) => {
    const p = new URLSearchParams();

    const nombre = searchParams.get("nombre");
    const agenteId = searchParams.get("agenteId");
    const lugarId = searchParams.get("lugarId");

    if (nombre) p.set("nombre", nombre);
    if (agenteId) p.set("agenteId", agenteId);
    if (lugarId) p.set("lugarId", lugarId);

    if (extra) {
      Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    }

    const qs = p.toString();
    return qs ? `?${qs}` : "";
  };
}

export default function PladurDicoplacLanding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildQuery = useBuildQuery();

  const nombre = searchParams.get("nombre");

  // Estado formulario
  const [formNombre, setFormNombre] = useState(nombre || "");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoTrabajo, setTipoTrabajo] = useState("Reforma integral de vivienda");
  const [mensaje, setMensaje] = useState("");
  const [preferencia, setPreferencia] = useState<"telefono" | "email">(
    "telefono"
  );
  const [aceptaContacto, setAceptaContacto] = useState(true);

  const [enviando, setEnviando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const agenteId = searchParams.get("agenteId");
  const lugarId = searchParams.get("lugarId");

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setMensajeOk(null);
    setMensajeError(null);

    try {
      const res = await fetch("/api/contacto-pladur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formNombre,
          email,
          telefono,
          tipoTrabajo,
          mensaje,
          preferenciaContacto: preferencia,
          aceptaContacto,
          agenteId,
          lugarId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.message || "No se pudo enviar la solicitud. Inténtalo de nuevo."
        );
      }

      setMensajeOk(
        "¡Solicitud enviada! Te contactaremos lo antes posible para ver tu obra o preparar un presupuesto."
      );
      setMensajeError(null);
      setMensaje("");
    } catch (err: any) {
      setMensajeError(err?.message || "Ha ocurrido un error al enviar el formulario.");
      setMensajeOk(null);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-8">
        {/* CABECERA + VOLVER */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[11px] md:text-xs uppercase tracking-[0.22em] text-emerald-300 font-semibold">
              IMPULSO ENERGÉTICO · ESPECIAL PLADUR
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight">
              Pladur{" "}
              <span className="text-amber-300">
                DICOPLAC
              </span>{" "}
              — trabajos profesionales en obra nueva y reforma.
            </h1>
            {nombre && (
              <p className="mt-1 text-sm text-slate-300">
                {nombre}, cuéntanos qué obra necesitas y preparamos tu presupuesto sin compromiso.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
            <button
              type="button"
              onClick={() => router.push(`/bienvenida${buildQuery()}`)}
              className="px-4 py-2 rounded-full border border-slate-600 text-xs md:text-sm text-slate-100 hover:bg-slate-800/80"
            >
              ← Volver a la pantalla principal
            </button>
          </div>
        </header>

        {/* HERO / DESCRIPCIÓN */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)] items-start">
          <div className="space-y-4">
            <div className="rounded-3xl bg-slate-950/90 border border-emerald-500/40 p-5 md:p-6 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
              <h2 className="text-lg md:text-xl font-bold mb-2">
                Especialistas en soluciones de pladur y acabados interiores
              </h2>
              <p className="text-sm md:text-base text-slate-200/90">
                DICOPLAC realiza trabajos profesionales de{" "}
                <span className="font-semibold text-emerald-300">
                  tabiquería, techos, aislamientos, diseños decorativos y reformas integrales
                </span>{" "}
                tanto en viviendas particulares como en locales comerciales, oficinas y naves
                industriales.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-200/90">
                <li>• Tabiques y distribuciones interiores en pladur.</li>
                <li>• Techos registrables y fijos, con soluciones acústicas.</li>
                <li>• Aislamientos térmicos y acústicos para mejorar confort y eficiencia.</li>
                <li>• Falsos techos, foseados, luces indirectas y diseño decorativo.</li>
                <li>• Reformas completas de pisos, locales y oficinas.</li>
              </ul>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/40 px-4 py-3 text-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-emerald-300 font-semibold">
                  Garantía
                </div>
                <p className="mt-1 font-semibold text-emerald-50">
                  Equipo profesional, acabados de alta calidad y plazos cerrados.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/40 px-4 py-3 text-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-amber-300 font-semibold">
                  Presupuesto
                </div>
                <p className="mt-1 font-semibold text-amber-50">
                  Presupuestos a medida según plano, m2 o visita a la obra.
                </p>
              </div>
              <div className="rounded-2xl bg-sky-500/10 border border-sky-500/40 px-4 py-3 text-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-sky-300 font-semibold">
                  Seguimiento
                </div>
                <p className="mt-1 font-semibold text-sky-50">
                  Te acompañamos desde el diseño hasta la finalización de la obra.
                </p>
              </div>
            </div>
          </div>

          {/* Bloque “Trabajos que realizamos” */}
          <div className="rounded-3xl bg-slate-950/90 border border-slate-700/80 p-5 md:p-6 space-y-4">
            <h2 className="text-base md:text-lg font-semibold">
              Tipos de trabajos que realizamos
            </h2>
            <ul className="space-y-3 text-sm text-slate-200/90">
              <li>
                <span className="font-semibold text-emerald-300">
                  Viviendas y reformas integrales:
                </span>{" "}
                redistribución de espacios, creación de habitaciones, vestidores, salones abiertos…
              </li>
              <li>
                <span className="font-semibold text-emerald-300">
                  Locales comerciales:
                </span>{" "}
                escaparates, salas de venta, trasdosados, decoración de techos y paredes.
              </li>
              <li>
                <span className="font-semibold text-emerald-300">
                  Oficinas y despachos:
                </span>{" "}
                mamparas, salas de reuniones, panelados acústicos y soluciones de confort.
              </li>
              <li>
                <span className="font-semibold text-emerald-300">
                  Naves y espacios industriales:
                </span>{" "}
                separación de zonas, oficinas interiores, aislamientos térmicos y acústicos.
              </li>
              <li>
                <span className="font-semibold text-emerald-300">
                  Detalles decorativos:
                </span>{" "}
                focos, bandejas de luz, foseados, estanterías integradas, paredes de TV, etc.
              </li>
            </ul>

            <p className="text-xs text-slate-400/90">
              Si quieres ver ejemplos concretos de obra, indícanoslo en el mensaje del formulario
              y te enviaremos fotos o proyectos similares a lo que necesitas.
            </p>
          </div>
        </section>

        {/* FORMULARIO DE CONTACTO */}
        <section className="rounded-3xl bg-slate-950/95 border border-emerald-500/50 p-5 md:p-6 lg:p-7 shadow-[0_0_40px_rgba(16,185,129,0.45)] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                Solicita tu presupuesto o información de una obra
              </h2>
              <p className="text-sm text-slate-300">
                Déjanos tus datos y cuéntanos qué necesitas: reforma, tabiques, techo, aislamiento…
              </p>
            </div>
            <div className="text-xs text-right text-slate-400">
              {agenteId && (
                <p>
                  Agente: <span className="font-semibold text-emerald-300">{agenteId}</span>
                </p>
              )}
              {lugarId && (
                <p>
                  Lugar: <span className="font-semibold text-emerald-300">{lugarId}</span>
                </p>
              )}
            </div>
          </div>

          <form
            onSubmit={manejarSubmit}
            className="mt-3 grid gap-4 md:grid-cols-2"
          >
            {/* Columna izquierda */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Tipo de trabajo
                </label>
                <select
                  value={tipoTrabajo}
                  onChange={(e) => setTipoTrabajo(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                >
                  <option>Reforma integral de vivienda</option>
                  <option>Tabiques y distribución interior</option>
                  <option>Techo registrable o falso techo</option>
                  <option>Aislamiento térmico / acústico</option>
                  <option>Local comercial / oficina</option>
                  <option>Ver ejemplos de una obra similar</option>
                  <option>Otros trabajos de pladur</option>
                </select>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Cuéntanos tu obra (metros aprox., localidad, plazos, etc.)
                </label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={6}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80 resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-4 items-center text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Preferencia de contacto:</span>
                  <button
                    type="button"
                    onClick={() => setPreferencia("telefono")}
                    className={`px-3 py-1.5 rounded-full border text-[11px] ${
                      preferencia === "telefono"
                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                        : "bg-slate-900 border-slate-600 text-slate-100"
                    }`}
                  >
                    Teléfono
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferencia("email")}
                    className={`px-3 py-1.5 rounded-full border text-[11px] ${
                      preferencia === "email"
                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                        : "bg-slate-900 border-slate-600 text-slate-100"
                    }`}
                  >
                    Email
                  </button>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={aceptaContacto}
                    onChange={(e) => setAceptaContacto(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                  />
                  <span>
                    Acepto que me contacten para esta solicitud de obra / presupuesto.
                  </span>
                </label>
              </div>

              {mensajeError && (
                <p className="text-xs text-red-300">{mensajeError}</p>
              )}
              {mensajeOk && (
                <p className="text-xs text-emerald-300">{mensajeOk}</p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-emerald-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {enviando ? "Enviando solicitud..." : "Enviar solicitud de obra / presupuesto"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <footer className="pt-2 text-[11px] text-slate-500 flex flex-col md:flex-row items-center justify-between gap-2">
          <span>© 2025 Impulso Energético · Servicio Pladur DICOPLAC</span>
          <span className="text-slate-400">
            Trabajos de pladur, techos, aislamientos y reformas integrales.
          </span>
        </footer>
      </div>
    </div>
  );
}
