"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Lugar = {
  id: number;
  nombre: string;
  direccion: string;
};

type Lead = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado: string;
  creadoEn: string;
  lugar?: {
    id: number;
    nombre: string;
  } | null;
};

type Comparativa = {
  id: number;
  tipoServicio: string;
  tipoTarifa: string;
  nombreTarifa: string;
  fecha: string;
  ahorro: number;
  comision: number;
  cliente?: {
    nombre: string;
  } | null;
  lugar?: {
    nombre: string;
  } | null;
};

type Agente = {
  id: number;
  nombre: string;
  email: string;
  telefono?: string | null;
  lugares: Lugar[];
  leads: Lead[];
  comparativas: Comparativa[];
};

type Stats = {
  totalComparativas: number;
  ahorroTotal: number;
  comisionTotal: number;
  totalLeads: number;
  totalLugares: number;
};

type PanelResponse = {
  agente: Agente;
  stats: Stats;
  error?: string;
};

export default function PanelAgenteContenido() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<PanelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setError("Debes iniciar sesión como agente para ver este panel.");
      setLoading(false);
      return;
    }

    const rol = (session.user as any)?.role;
    if (rol !== "AGENTE") {
      setError("Este panel es solo para usuarios con rol AGENTE.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/panel-agente");
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Error al cargar los datos del agente");
        }
        const json = (await res.json()) as PanelResponse;
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar el panel del agente");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-300">Cargando panel del agente…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl bg-red-900/60 border border-red-500/60 px-6 py-4">
          <h1 className="text-lg font-bold mb-2">Panel del agente</h1>
          <p className="text-sm">{error || "No se han podido cargar los datos."}</p>
        </div>
      </div>
    );
  }

  const { agente, stats } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-4 py-8">
      {/* CABECERA */}
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
          Zona del Agente
        </h1>
        <p className="text-sm text-slate-400">
          Aquí puedes ver tus lugares, leads y comparativas generadas con tus QRs y enlaces.
        </p>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* TARJETA PRINCIPAL AGENTE + KPIs */}
        <section className="rounded-3xl border border-emerald-500/60 bg-slate-950/90 shadow-[0_0_40px_rgba(16,185,129,0.45)] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.3em] text-emerald-300 uppercase mb-2">
                IMPULSO ENERGÉTICO · ZONA DEL AGENTE
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1">
                {agente.nombre}
              </h2>
              <p className="text-sm text-slate-300">
                Usuario: <span className="font-semibold">{agente.email}</span>
              </p>
              {agente.telefono && (
                <p className="text-sm text-slate-300">
                  Teléfono: <span className="font-semibold">{agente.telefono}</span>
                </p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Lugares asignados:{" "}
                <span className="font-semibold text-emerald-300">
                  {stats.totalLugares}
                </span>{" "}
                · Leads:{" "}
                <span className="font-semibold text-emerald-300">
                  {stats.totalLeads}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
              <KpiCard
                label="Comparativas"
                value={stats.totalComparativas}
                accent="border-emerald-400/70"
              />
              <KpiCard
                label="Ahorro estimado"
                value={`${stats.ahorroTotal.toFixed(2)} €`}
                accent="border-cyan-400/70"
              />
              <KpiCard
                label="Comisiones"
                value={`${stats.comisionTotal.toFixed(2)} €`}
                accent="border-yellow-400/70"
              />
            </div>
          </div>
        </section>

        {/* LUGARES DEL AGENTE */}
        <section className="rounded-3xl bg-slate-950/80 border border-sky-500/60 p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-bold">Tus lugares con QR</h3>
            <span className="text-xs text-slate-400">
              {agente.lugares.length} lugar(es)
            </span>
          </div>

          {agente.lugares.length === 0 ? (
            <p className="text-sm text-slate-400">
              Todavía no tienes lugares asignados. Cuando el administrador te asigne
              lugares con QR, aparecerán aquí.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/90">
                  <tr className="text-left text-xs text-slate-400 uppercase">
                    <th className="px-4 py-2">Lugar</th>
                    <th className="px-4 py-2">Dirección</th>
                    <th className="px-4 py-2 w-40">Acceso rápido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agente.lugares.map((lugar) => (
                    <tr key={lugar.id} className="hover:bg-slate-900/60">
                      <td className="px-4 py-2 font-semibold">{lugar.nombre}</td>
                      <td className="px-4 py-2 text-slate-300">
                        {lugar.direccion}
                      </td>
                      <td className="px-4 py-2">
                        {/* Enlace típico al flujo del cliente vía QR */}
                        <a
                          href={`/registro?agenteId=${agente.id}&lugarId=${lugar.id}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                        >
                          Abrir flujo de cliente
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* LEADS DEL AGENTE */}
        <section className="rounded-3xl bg-slate-950/80 border border-purple-500/70 p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-bold">Personas interesadas (leads)</h3>
            <span className="text-xs text-slate-400">
              {stats.totalLeads} registro(s)
            </span>
          </div>

          {agente.leads.length === 0 ? (
            <p className="text-sm text-slate-400">
              Todavía no tienes leads registrados desde tus QRs o enlaces.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/90">
                  <tr className="text-left text-xs text-slate-400 uppercase">
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Teléfono</th>
                    <th className="px-4 py-2">Lugar</th>
                    <th className="px-4 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agente.leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-900/60">
                      <td className="px-4 py-2 text-slate-300">
                        {new Date(lead.creadoEn).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-2 font-semibold">{lead.nombre}</td>
                      <td className="px-4 py-2 text-slate-300">{lead.email}</td>
                      <td className="px-4 py-2 text-slate-300">{lead.telefono}</td>
                      <td className="px-4 py-2 text-slate-300">
                        {lead.lugar?.nombre || "-"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 border border-slate-700 text-slate-200">
                          {lead.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* COMPARATIVAS DEL AGENTE */}
        <section className="rounded-3xl bg-slate-950/80 border border-orange-500/70 p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-bold">Tus últimas comparativas</h3>
            <span className="text-xs text-slate-400">
              {stats.totalComparativas} comparativa(s)
            </span>
          </div>

          {agente.comparativas.length === 0 ? (
            <p className="text-sm text-slate-400">
              Todavía no tienes comparativas registradas. Cuando hagas estudios con el
              comparador asociados a tus QRs, aparecerán aquí.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/90">
                  <tr className="text-left text-xs text-slate-400 uppercase">
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">Lugar</th>
                    <th className="px-4 py-2">Servicio</th>
                    <th className="px-4 py-2">Tarifa</th>
                    <th className="px-4 py-2">Ahorro</th>
                    <th className="px-4 py-2">Comisión</th>
                    <th className="px-4 py-2 w-32">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agente.comparativas.map((comp) => (
                    <tr key={comp.id} className="hover:bg-slate-900/60">
                      <td className="px-4 py-2 text-slate-300">
                        {new Date(comp.fecha).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-2 font-semibold">
                        {comp.cliente?.nombre || "-"}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {comp.lugar?.nombre || "-"}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {comp.tipoServicio}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {comp.nombreTarifa}
                      </td>
                      <td className="px-4 py-2 text-emerald-300">
                        {comp.ahorro.toFixed(2)} €
                      </td>
                      <td className="px-4 py-2 text-yellow-300">
                        {comp.comision.toFixed(2)} €
                      </td>
                      <td className="px-4 py-2">
                        <a
                          href={`/comparador?id=${comp.id}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900 border border-slate-600 hover:border-emerald-400 hover:text-emerald-300"
                        >
                          Ver / editar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div
      className={`rounded-2xl border bg-slate-950/90 px-4 py-3 flex flex-col justify-center ${accent || "border-slate-700"}`}
    >
      <span className="text-[11px] text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-lg font-extrabold mt-1">{value}</span>
    </div>
  );
}
