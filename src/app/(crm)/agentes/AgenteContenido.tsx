"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CRMClienteLayout from "../CRMClienteLayout";

type Lugar = { id: number; nombre: string; direccion: string; creadoEn: string };
type QR = { id: number; codigo: string; lugarId: number; agenteId?: number | null };
type Lead = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado?: string | null;
  creadoEn: string;
  lugar?: { id: number; nombre: string } | null;
};
type Comparativa = {
  id: number;
  fecha: string;
  tipoServicio: string;
  ahorro: number;
  comision: number;
  lugar?: { id: number; nombre: string } | null;
  cliente?: { id: number; nombre: string; email?: string | null; telefono?: string | null } | null;
};
type Contrato = {
  id: number;
  fechaAlta: string;
  servicio: string;
  compañia: string;
  tarifa: string;
  comision: number;
};

type PanelAgenteResponse = {
  usuario: { id: number; nombre: string; email: string; rol: string } | null;
  agente: { id: number; nombre: string; email: string; telefono?: string | null; creadoEn: string };
  lugares: Lugar[];
  qrs: QR[];
  leads: Lead[];
  comparativas: Comparativa[];
  contratos: Contrato[];
  stats: {
    totalLugares: number;
    totalLeads: number;
    totalComparativas: number;
    totalContratos: number;
    ahorroTotal: number;
    comisionTotal: number;
  };
};

function euro(n: number) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);
  } catch {
    return `${(n || 0).toFixed(2)} €`;
  }
}

export default function AgenteContenido() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [data, setData] = useState<PanelAgenteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rol = (session?.user as any)?.rol ?? (session?.user as any)?.role ?? null;
  const nombreUsuario = (session?.user as any)?.nombre ?? session?.user?.name ?? "Agente Impulso";

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setError("Debes iniciar sesión para acceder al panel del agente.");
      setLoading(false);
      return;
    }

    if (rol !== "AGENTE") {
      setError("Esta sección es solo para usuarios con rol AGENTE.");
      setLoading(false);
      return;
    }

    const cargar = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/panel-agente");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error cargando el panel del agente");
        }
        const json = (await res.json()) as PanelAgenteResponse;
        setData(json);
        setError(null);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [session, status, rol]);

  const ultimosLeads = useMemo(() => (data?.leads || []).slice(0, 8), [data]);
  const ultimasComparativas = useMemo(() => (data?.comparativas || []).slice(0, 8), [data]);

  if (loading) {
    return (
      <CRMClienteLayout>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <p className="text-sm text-slate-300">Cargando tu CRM de agente…</p>
        </div>
      </CRMClienteLayout>
    );
  }

  if (error) {
    return (
      <CRMClienteLayout>
        <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
          <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
            <h1 className="text-lg font-bold mb-2">Panel del agente</h1>
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
          No hay datos todavía.
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
                <h1 className="text-3xl font-extrabold text-white mb-1">
                  CRM del Agente
                </h1>
                <p className="text-sm text-slate-300 max-w-2xl">
                  Todo lo que entra por tus QR, tus lugares y tus clientes, organizado para trabajar rápido.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Conectado como{" "}
                  <span className="font-semibold text-emerald-300">
                    {nombreUsuario}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <Chip label={`${data.stats.totalLugares} lugares`} dot="emerald" />
                <Chip label={`${data.stats.totalLeads} leads`} dot="sky" />
                <Chip label={`${data.stats.totalComparativas} comparativas`} dot="amber" />
                <Chip label={`${data.stats.totalContratos} contratos`} dot="fuchsia" />
              </div>
            </div>
          </header>

          {/* KPIs */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard titulo="Ahorro acumulado" valor={euro(data.stats.ahorroTotal)} hint="Sumatorio de ahorro en tus comparativas" />
            <KpiCard titulo="Comisión acumulada" valor={euro(data.stats.comisionTotal)} hint="Sumatorio de comisión en tus comparativas" />
            <KpiCard titulo="QRs activos" valor={`${data.qrs.length}`} hint="QR asociados a tus lugares" />
            <KpiCard titulo="Actividad reciente" valor={`${data.leads.length + data.comparativas.length}`} hint="Leads + comparativas cargadas" />
          </section>

          {/* ACCESOS RÁPIDOS */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Acceso
              titulo="Pipeline"
              desc="Gestiona tus leads por estado"
              onClick={() => router.push("/pipeline-agentes")}
              tag="Kanban"
            />
            <Acceso
              titulo="Tus lugares"
              desc="Ver lugares y rendimiento"
              onClick={() => router.push("/agente/lugares")}
              tag="QR + métricas"
            />
            <Acceso
              titulo="Comparativas"
              desc="Listado y control"
              onClick={() => router.push("/agente/comparativas")}
              tag="Historial"
            />
            <Acceso
              titulo="Contratos"
              desc="Tus clientes cerrados"
              onClick={() => router.push("/agente/contratos")}
              tag="Cierres"
            />
          </section>

          {/* BLOQUES */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Block title="Últimos leads">
              {ultimosLeads.length === 0 ? (
                <Empty />
              ) : (
                <div className="space-y-2">
                  {ultimosLeads.map((l) => (
                    <div key={l.id} className="rounded-2xl bg-slate-900/70 border border-slate-700 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-50">{l.nombre}</p>
                          <p className="text-xs text-slate-400">
                            {l.lugar?.nombre || "Sin lugar"} · {l.estado || "SIN ESTADO"}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(l.creadoEn).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Block>

            <Block title="Últimas comparativas">
              {ultimasComparativas.length === 0 ? (
                <Empty />
              ) : (
                <div className="space-y-2">
                  {ultimasComparativas.map((c) => (
                    <div key={c.id} className="rounded-2xl bg-slate-900/70 border border-slate-700 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-50">
                            {c.cliente?.nombre || "Cliente"} · {c.tipoServicio}
                          </p>
                          <p className="text-xs text-slate-400">
                            {c.lugar?.nombre || "Sin lugar"} · {euro(c.ahorro)} ahorro · {euro(c.comision)} comisión
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(c.fecha).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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

function Chip({ label, dot }: { label: string; dot: "emerald" | "sky" | "amber" | "fuchsia" }) {
  const dotClass =
    dot === "emerald"
      ? "bg-emerald-400"
      : dot === "sky"
      ? "bg-sky-400"
      : dot === "amber"
      ? "bg-amber-300"
      : "bg-fuchsia-400";

  return (
    <div className="rounded-full bg-slate-900 border border-slate-700 px-4 py-1.5 flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
      <span className="font-semibold text-slate-100">{label}</span>
    </div>
  );
}

function KpiCard({ titulo, valor, hint }: { titulo: string; valor: string; hint: string }) {
  return (
    <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5">
      <p className="text-xs text-slate-400">{titulo}</p>
      <p className="text-2xl font-extrabold text-emerald-300 mt-1">{valor}</p>
      <p className="text-[11px] text-slate-500 mt-2">{hint}</p>
    </div>
  );
}

function Acceso({ titulo, desc, onClick, tag }: { titulo: string; desc: string; onClick: () => void; tag: string }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-3xl bg-slate-950/80 border border-slate-800 p-5 hover:border-emerald-400/60 transition"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-bold">{titulo}</p>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200">
          {tag}
        </span>
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
    <div className="rounded-2xl bg-slate-900/40 border border-slate-800 px-5 py-8 text-center text-sm text-slate-400">
      Todavía no hay datos.
    </div>
  );
}
