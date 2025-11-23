"use client";

import React, { useEffect, useState } from "react";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface Lugar {
  id: number;
  nombre: string;
  direccion: string;
  creadoEn: string;
}

interface Agente {
  id: number;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
}

interface Comparativa {
  id: number;
  tipoServicio: string;
  tipoTarifa: string;
  nombreTarifa: string;
  consumoAnual: number;
  importeFactura: number;
  ahorro: number;
  comision: number;
  fecha: string;
}

interface Lead {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado: string;
  creadoEn: string;
  agente?: { id: number; nombre: string } | null;
}

interface ZonaLugarData {
  usuario: Usuario | null;
  lugar: Lugar;
  agente: Agente | null;
  comparativas: Comparativa[];
  leads: Lead[];
  stats: {
    totalComparativas: number;
    ahorroTotal: number;
    comisionTotal: number;
  };
}

export default function ZonaLugarPage() {
  const [data, setData] = useState<ZonaLugarData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        setError(null);

        const res = await fetch("/api/zona-lugar", { cache: "no-store" });

        if (res.status === 401) {
          setError("Debes iniciar sesión para ver tu zona de cliente.");
          return;
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || "Error al cargar los datos.");
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err?.message || "Ha ocurrido un error.");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, []);

  const formateaFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formateaEuros = (n: number) =>
    n.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4">
          Zona del Lugar
        </h1>
        <p className="text-sm text-slate-300 mb-6">
          Aquí puedes ver tus comparativas, tus comisiones y tus contactos
          registrados.
        </p>

        {cargando && (
          <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-6 text-sm">
            Cargando tus datos…
          </div>
        )}

        {error && !cargando && (
          <div className="rounded-xl bg-red-950/70 border border-red-700 p-6 text-sm text-red-100">
            {error}
          </div>
        )}

        {!cargando && !error && data && (
          <div className="space-y-6">
            {/* RESUMEN CABECERA */}
            <section className="rounded-2xl bg-slate-950/90 border border-emerald-500/60 p-5 md:p-6 shadow-[0_0_30px_rgba(16,185,129,0.5)] flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-emerald-300 font-semibold mb-1">
                  IMPULSO ENERGÉTICO · ZONA DEL CLIENTE
                </p>
                <h2 className="text-xl md:text-2xl font-bold mb-1">
                  {data.lugar.nombre}
                </h2>
                <p className="text-sm text-slate-200 mb-1">
                  {data.lugar.direccion}
                </p>
                {data.usuario && (
                  <p className="text-xs text-slate-400">
                    Usuario:{" "}
                    <span className="font-semibold">{data.usuario.nombre}</span>{" "}
                    · {data.usuario.email}
                  </p>
                )}
                {data.agente && (
                  <p className="text-xs text-slate-400 mt-1">
                    Tu agente:{" "}
                    <span className="font-semibold">{data.agente.nombre}</span>
                    {data.agente.telefono && ` · ${data.agente.telefono}`}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs md:text-sm">
                <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                    Comparativas
                  </p>
                  <p className="text-lg md:text-xl font-bold text-emerald-400">
                    {data.stats.totalComparativas}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 border border-emerald-600/70 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                    Ahorro estimado
                  </p>
                  <p className="text-lg md:text-xl font-bold text-emerald-300">
                    {formateaEuros(data.stats.ahorroTotal)} €
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 border border-amber-500/70 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">
                    Comisiones
                  </p>
                  <p className="text-lg md:text-xl font-bold text-amber-300">
                    {formateaEuros(data.stats.comisionTotal)} €
                  </p>
                </div>
              </div>
            </section>

            {/* LISTA COMPARATIVAS */}
            <section className="rounded-2xl bg-slate-950/80 border border-slate-700 p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base md:text-lg font-semibold">
                  Tus últimas comparativas
                </h3>
                <span className="text-xs text-slate-400">
                  {data.comparativas.length} registro(s)
                </span>
              </div>

              {data.comparativas.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Todavía no tienes comparativas registradas.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="min-w-full text-xs md:text-sm">
                    <thead className="bg-slate-900/80 text-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left">Fecha</th>
                        <th className="px-3 py-2 text-left">Servicio</th>
                        <th className="px-3 py-2 text-left">Tarifa</th>
                        <th className="px-3 py-2 text-right">Ahorro (€)</th>
                        <th className="px-3 py-2 text-right">Comisión (€)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.comparativas.map((c) => (
                        <tr
                          key={c.id}
                          className="border-t border-slate-800/80 odd:bg-slate-900/40"
                        >
                          <td className="px-3 py-2">
                            {formateaFecha(c.fecha)}
                          </td>
                          <td className="px-3 py-2">{c.tipoServicio}</td>
                          <td className="px-3 py-2">
                            {c.nombreTarifa} ({c.tipoTarifa})
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formateaEuros(c.ahorro)} €
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formateaEuros(c.comision)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* LISTA LEADS */}
            <section className="rounded-2xl bg-slate-950/80 border border-slate-700 p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base md:text-lg font-semibold">
                  Personas interesadas (leads)
                </h3>
                <span className="text-xs text-slate-400">
                  {data.leads.length} registro(s)
                </span>
              </div>

              {data.leads.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Todavía no tienes leads registrados desde tu código.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="min-w-full text-xs md:text-sm">
                    <thead className="bg-slate-900/80 text-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left">Fecha</th>
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Teléfono</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leads.map((l) => (
                        <tr
                          key={l.id}
                          className="border-t border-slate-800/80 odd:bg-slate-900/40"
                        >
                          <td className="px-3 py-2">
                            {formateaFecha(l.creadoEn)}
                          </td>
                          <td className="px-3 py-2">{l.nombre}</td>
                          <td className="px-3 py-2">{l.email}</td>
                          <td className="px-3 py-2">{l.telefono}</td>
                          <td className="px-3 py-2">{l.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
