"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CRMClienteLayout from "../CRMClienteLayout";

type PanelAgente = {
  agente: { id: number; nombre: string; email: string; telefono?: string | null; creadoEn: string };
  lugares: Array<{ id: number; nombre: string; direccion: string; creadoEn: string }>;
  qrs: Array<{ id: number; codigo: string; lugarId: number; agenteId?: number | null }>;
  leads: Array<{ id: number; nombre: string; email: string; telefono: string; estado: string; creadoEn: string; lugar?: { id: number; nombre: string } | null }>;
  comparativas: Array<{ id: number; fecha: string; tipoServicio: string; ahorro: number; comision: number; lugar?: { id: number; nombre: string } | null; cliente?: { id: number; nombre: string } | null }>;
  contratos: Array<{ id: number; fechaAlta: string; servicio: string; compañia: string; tarifa: string; comision: number }>;
  stats: { totalLugares: number; totalLeads: number; totalComparativas: number; totalContratos: number; ahorroTotal: number; comisionTotal: number };
};

const euro = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

export default function AgenteContenido() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<PanelAgente | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role = (session?.user as any)?.role ?? null;
  const nombre = (session?.user as any)?.name ?? "Agente";

  useEffect(() => {
    if (status === "loading") return;

    if (!session) return setError("Debes iniciar sesión.");
    if (role !== "AGENTE") return setError("Esta sección es solo para AGENTE.");

    (async () => {
      const res = await fetch("/api/panel-agente");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.error || "Error cargando panel agente");
      setData(json);
    })();
  }, [session, status, role]);

  const ultimosLeads = useMemo(() => (data?.leads || []).slice(0, 8), [data]);
  const ultimasComparativas = useMemo(() => (data?.comparativas || []).slice(0, 8), [data]);

  if (error) {
    return (
      <CRMClienteLayout>
        <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
          <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
            <h1 className="text-lg font-bold mb-2">Panel Agente</h1>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </CRMClienteLayout>
    );
  }

  if (!data) {
    return (
      <CRMClienteLayout>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          Cargando…
        </div>
      </CRMClienteLayout>
    );
  }

  return (
    <CRMClienteLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-8 text-slate-50">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* CABECERA */}
          <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-fuchsia-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <div className="rounded-3xl bg-slate-950/95 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white mb-1">Área del Agente</h1>
                <p className="text-sm text-slate-300 max-w-2xl">
                  Todo lo que entra por tus QR y tus lugares, listo para gestionar.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Conectado como <span className="font-semibold text-emerald-300">{nombre}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <Chip label={`${data.stats.totalLugares} lugares`} />
                <Chip label={`${data.stats.totalLeads} leads`} />
                <Chip label={`${data.stats.totalComparativas} comparativas`} />
                <Chip label={`${data.stats.totalContratos} contratos`} />
              </div>
            </div>
          </header>

          {/* KPIs */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Kpi titulo="Ahorro total" valor={euro(data.stats.ahorroTotal)} />
            <Kpi titulo="Comisión total" valor={euro(data.stats.comisionTotal)} />
            <Kpi titulo="QRs" valor={`${data.qrs.length}`} />
            <Kpi titulo="Actividad" valor={`${data.leads.length + data.comparativas.length}`} />
          </section>

          {/* ACCESOS RÁPIDOS */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Acceso titulo="Pipeline" desc="Gestiona leads por estado" onClick={() => router.push("/pipeline-agentes")} tag="Kanban" />
            <Acceso titulo="Lugares" desc="Tus lugares y rendimiento" onClick={() => router.push("/agente/lugares")} tag="QR" />
            <Acceso titulo="Comparativas" desc="Todas tus comparativas" onClick={() => router.push("/agente/comparativas")} tag="Historial" />
            <Acceso titulo="Contratos" desc="Cierres y comisiones" onClick={() => router.push("/agente/contratos")} tag="Cerrados" />
          </section>

          {/* ÚLTIMOS */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Block title="Últimos leads">
              {ultimosLeads.length === 0 ? <Empty /> : (
                <div className="space-y-2">
                  {ultimosLeads.map(l => (
                    <div key={l.id} className="rounded-2xl bg-slate-900/70 border border-slate-700 px-4 py-3">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold">{l.nombre}</p>
                          <p className="text-xs text-slate-400">{l.lugar?.nombre || "Sin lugar"} · {l.estado}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(l.creadoEn).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Block>

            <Block title="Últimas comparativas">
              {ultimasComparativas.length === 0 ? <Empty /> : (
                <div className="space-y-2">
                  {ultimasComparativas.map(c => (
                    <div key={c.id} className="rounded-2xl bg-slate-900/70 border border-slate-700 px-4 py-3">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold">{c.cliente?.nombre || "Cliente"} · {c.tipoServicio}</p>
                          <p className="text-xs text-slate-400">
                            {c.lugar?.nombre || "Sin lugar"} · {euro(c.ahorro)} ahorro · {euro(c.comision)} comisión
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(c.fecha).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Block>
          </section>
        </div>
      </div>
    </CRMClienteLayout>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <div className="rounded-full bg-slate-900 border border-slate-700 px-4 py-1.5 text-slate-100 font-semibold">
      {label}
    </div>
  );
}
function Kpi({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5">
      <p className="text-xs text-slate-400">{titulo}</p>
      <p className="text-2xl font-extrabold text-emerald-300 mt-1">{valor}</p>
    </div>
  );
}
function Acceso({ titulo, desc, onClick, tag }: { titulo: string; desc: string; onClick: () => void; tag: string }) {
  return (
    <button onClick={onClick} className="text-left rounded-3xl bg-slate-950/80 border border-slate-800 p-5 hover:border-emerald-400/60 transition">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-bold">{titulo}</p>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-900 border border-slate-700">{tag}</span>
      </div>
      <p className="text-sm text-slate-300 mt-1">{desc}</p>
    </button>
  );
}
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </div>
  );
}
function Empty() {
  return (
    <div className="rounded-2xl bg-slate-900/40 border border-slate-800 px-6 py-10 text-center text-slate-400">
      Todavía no hay datos.
    </div>
  );
}
