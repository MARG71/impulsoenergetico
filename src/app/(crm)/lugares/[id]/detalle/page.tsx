/* src/app/(crm)/lugares/[id]/detalle/page.tsx */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

/** =========================
 *  Tipos (ajusta si tu API difiere)
 *  ========================= */
type TipoServicio = "LUZ" | "GAS" | "TELEFONIA" | "SEGUROS" | "OTROS";

type Kpi = {
  leads7d: number;
  comparativasMes: number;
  ahorroTotal: number; // €
  comisionTotal: number; // €
};

type KpisPorTipo = Record<TipoServicio, Kpi>;

type Comparativa = {
  id: string | number;
  creadaEn?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  tipoServicio: TipoServicio;
  ahorro?: number; // €
  comision?: number; // €
  estado?: string;
  lugarNombre?: string;
};

type Lugar = {
  id: string | number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  agenteNombre?: string;
  activo?: boolean;
};

type DetalleLugarUI = {
  lugar: Lugar;
  kpisGlobal: Kpi;
  kpisPorTipo: KpisPorTipo;
  comparativas: Comparativa[];
};

/** =========================
 *  Helpers
 *  ========================= */
const TIPOS: { key: TipoServicio; label: string; colorClass: string; icon: string }[] = [
  { key: "LUZ", label: "Luz", colorClass: "bg-emerald-50 border-emerald-200", icon: "⚡" },
  { key: "GAS", label: "Gas", colorClass: "bg-orange-50 border-orange-200", icon: "🔥" },
  { key: "TELEFONIA", label: "Telefonía", colorClass: "bg-sky-50 border-sky-200", icon: "📱" },
  { key: "SEGUROS", label: "Seguros", colorClass: "bg-violet-50 border-violet-200", icon: "🛡️" },
  { key: "OTROS", label: "Otros", colorClass: "bg-slate-50 border-slate-200", icon: "📌" },
];

function eur(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "2-digit" });
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** =========================
 *  Normalizador de payload (solo toca aquí si tu API difiere)
 *  ========================= */
function normalizeDetalle(raw: any): DetalleLugarUI {
  const lugar: Lugar = {
    id: raw?.lugar?.id ?? raw?.id ?? "",
    nombre: raw?.lugar?.nombre ?? raw?.nombre ?? "Lugar",
    direccion: raw?.lugar?.direccion ?? raw?.direccion ?? "",
    telefono: raw?.lugar?.telefono ?? raw?.telefono ?? "",
    email: raw?.lugar?.email ?? raw?.email ?? "",
    agenteNombre: raw?.lugar?.agente?.nombre ?? raw?.agente?.nombre ?? raw?.agenteNombre ?? "",
    activo: raw?.lugar?.activo ?? raw?.activo ?? true,
  };

  const empty: Kpi = { leads7d: 0, comparativasMes: 0, ahorroTotal: 0, comisionTotal: 0 };

  const kpisGlobal: Kpi = {
    leads7d: safeNum(raw?.kpisGlobal?.leads7d ?? raw?.kpis?.leads7d),
    comparativasMes: safeNum(raw?.kpisGlobal?.comparativasMes ?? raw?.kpis?.comparativasMes),
    ahorroTotal: safeNum(raw?.kpisGlobal?.ahorroTotal ?? raw?.kpis?.ahorroTotal),
    comisionTotal: safeNum(raw?.kpisGlobal?.comisionTotal ?? raw?.kpis?.comisionTotal),
  };

  const kpisPorTipo: KpisPorTipo = {
    LUZ: { ...empty },
    GAS: { ...empty },
    TELEFONIA: { ...empty },
    SEGUROS: { ...empty },
    OTROS: { ...empty },
  };

  // Si viene ya por tipo:
  const fromApi = raw?.kpisPorTipo ?? raw?.kpis_por_tipo ?? raw?.kpisByTipo;
  if (fromApi) {
    (Object.keys(kpisPorTipo) as TipoServicio[]).forEach((t) => {
      const src = fromApi?.[t] ?? fromApi?.[t.toLowerCase()];
      if (src) {
        kpisPorTipo[t] = {
          leads7d: safeNum(src.leads7d),
          comparativasMes: safeNum(src.comparativasMes),
          ahorroTotal: safeNum(src.ahorroTotal),
          comisionTotal: safeNum(src.comisionTotal),
        };
      }
    });
  }

  const comparativas: Comparativa[] =
    (raw?.comparativas ?? raw?.detalle?.comparativas ?? raw?.data?.comparativas ?? []).map((c: any) => ({
      id: c?.id ?? "",
      creadaEn: c?.creadaEn ?? c?.createdAt ?? c?.fecha ?? "",
      clienteNombre: c?.clienteNombre ?? c?.cliente?.nombre ?? "",
      clienteTelefono: c?.clienteTelefono ?? c?.cliente?.telefono ?? "",
      clienteEmail: c?.clienteEmail ?? c?.cliente?.email ?? "",
      tipoServicio: (c?.tipoServicio ?? c?.tipo ?? "OTROS") as TipoServicio,
      ahorro: safeNum(c?.ahorro ?? c?.resultado?.ahorro ?? 0),
      comision: safeNum(c?.comision ?? c?.resultado?.comision ?? 0),
      estado: c?.estado ?? "",
      lugarNombre: c?.lugarNombre ?? c?.lugar?.nombre ?? "",
    }));

  // Si NO viene kpisPorTipo, lo calculamos rápido desde comparativas (fallback)
  const hasRealByType =
    fromApi &&
    (Object.keys(kpisPorTipo) as TipoServicio[]).some(
      (t) => kpisPorTipo[t].leads7d || kpisPorTipo[t].comparativasMes || kpisPorTipo[t].ahorroTotal || kpisPorTipo[t].comisionTotal
    );

  if (!hasRealByType && comparativas.length) {
    (Object.keys(kpisPorTipo) as TipoServicio[]).forEach((t) => {
      const list = comparativas.filter((x) => x.tipoServicio === t);
      kpisPorTipo[t] = {
        leads7d: 0, // no lo puedo inferir sin leads, lo dejo a 0
        comparativasMes: list.length,
        ahorroTotal: list.reduce((acc, x) => acc + safeNum(x.ahorro), 0),
        comisionTotal: list.reduce((acc, x) => acc + safeNum(x.comision), 0),
      };
    });
  }

  return { lugar, kpisGlobal, kpisPorTipo, comparativas };
}

/** =========================
 *  Page
 *  ========================= */
export default function DetalleLugarPage() {
  const params = useParams<{ id: string }>();
  const lugarId = params?.id;
  const router = useRouter();
  const sp = useSearchParams();
  const tabFromUrl = (sp.get("tipo") || "LUZ").toUpperCase() as TipoServicio;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DetalleLugarUI | null>(null);
  const [activeTipo, setActiveTipo] = useState<TipoServicio>(
    (["LUZ", "GAS", "TELEFONIA", "SEGUROS", "OTROS"].includes(tabFromUrl) ? tabFromUrl : "LUZ") as TipoServicio
  );

  useEffect(() => {
    let ok = true;
    async function run() {
      try {
        setLoading(true);
        setError(null);

        // ✅ Ajusta esta URL si tu endpoint difiere:
        const res = await fetch(`/api/lugares/${lugarId}/detalle`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Error cargando detalle (${res.status})`);
        const raw = await res.json();

        if (!ok) return;
        setData(normalizeDetalle(raw));
      } catch (e: any) {
        if (!ok) return;
        setError(e?.message || "Error inesperado");
      } finally {
        if (!ok) return;
        setLoading(false);
      }
    }
    if (lugarId) run();
    return () => {
      ok = false;
    };
  }, [lugarId]);

  // Sync URL -> estado
  useEffect(() => {
    const t = (sp.get("tipo") || "").toUpperCase();
    if (t && (["LUZ", "GAS", "TELEFONIA", "SEGUROS", "OTROS"] as string[]).includes(t)) {
      setActiveTipo(t as TipoServicio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const comparativasPorTipo = useMemo(() => {
    const base: Record<TipoServicio, Comparativa[]> = {
      LUZ: [],
      GAS: [],
      TELEFONIA: [],
      SEGUROS: [],
      OTROS: [],
    };
    (data?.comparativas || []).forEach((c) => {
      const t = (c.tipoServicio || "OTROS") as TipoServicio;
      (base[t] ||= []).push(c);
    });
    // más reciente primero
    (Object.keys(base) as TipoServicio[]).forEach((t) => {
      base[t].sort((a, b) => (new Date(b.creadaEn || 0).getTime() - new Date(a.creadaEn || 0).getTime()));
    });
    return base;
  }, [data]);

  function goTipo(t: TipoServicio) {
    setActiveTipo(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tipo", t);
    router.replace(url.toString());
    // scroll suave a KPIs por tipo (opcional)
    const el = document.getElementById("kpis-por-tipo");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goSeccionServicio(t: TipoServicio) {
    // ✅ Ajusta rutas destino según tu CRM real:
    // - Puede ser /comparativas?lugarId=...&tipo=...
    // - O /historial-comparativas?...
    const map: Record<TipoServicio, string> = {
      LUZ: `/comparador?tipo=luz&lugarId=${lugarId}`,
      GAS: `/comparador?tipo=gas&lugarId=${lugarId}`,
      TELEFONIA: `/comparador?tipo=telefonia&lugarId=${lugarId}`,
      SEGUROS: `/seguros?lugarId=${lugarId}`,
      OTROS: `/otros?lugarId=${lugarId}`,
    };
    router.push(map[t] || map.OTROS);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header director */}
      <div className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.back()}
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  ← Volver
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold text-slate-900">{loading ? "Cargando…" : data?.lugar?.nombre}</h1>
                  <p className="truncate text-sm font-semibold text-slate-600">
                    {data?.lugar?.direccion || "—"} {data?.lugar?.agenteNombre ? `· Agente: ${data.lugar.agenteNombre}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/lugares`}
                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Ver todos
              </Link>
              <Link
                href={`/lugares/${lugarId}/editar`}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Editar
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        {/* KPI Global “Director” */}
        <section className="mb-6">
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Panel Directivo</h2>
                <p className="text-sm font-semibold text-slate-600">
                  Resumen ejecutivo del lugar · KPIs globales (últimos 7 días / mes / acumulado)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.push(`/leads?lugarId=${lugarId}`)}
                  className="rounded-2xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Ver leads
                </button>
                <button
                  onClick={() => router.push(`/historial-comparativas?lugarId=${lugarId}`)}
                  className="rounded-2xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Ver comparativas
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <KpiCard title="Leads (7 días)" value={safeNum(data?.kpisGlobal?.leads7d)} hint="Captación reciente" />
              <KpiCard title="Comparativas (mes)" value={safeNum(data?.kpisGlobal?.comparativasMes)} hint="Actividad mensual" />
              <KpiCard title="Ahorro total" value={eur(safeNum(data?.kpisGlobal?.ahorroTotal))} hint="Acumulado (€)" />
              <KpiCard title="Comisión total" value={eur(safeNum(data?.kpisGlobal?.comisionTotal))} hint="Acumulado (€)" />
            </div>
          </div>
        </section>

        {/* KPIs por tipo (clicables) */}
        <section id="kpis-por-tipo" className="mb-6">
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">KPIs por Servicio</h2>
                <p className="text-sm font-semibold text-slate-600">
                  Desglose ejecutivo por línea de negocio (clic para abrir sección)
                </p>
              </div>

              {/* Selector tipo “director” */}
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => goTipo(t.key)}
                    className={[
                      "rounded-2xl border px-3 py-2 text-sm font-bold transition",
                      activeTipo === t.key ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span className="mr-2">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid tarjetas por servicio (todas visibles, enfoque director) */}
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
              {TIPOS.map((t) => {
                const k = data?.kpisPorTipo?.[t.key] || { leads7d: 0, comparativasMes: 0, ahorroTotal: 0, comisionTotal: 0 };
                return (
                  <button
                    key={t.key}
                    onClick={() => goSeccionServicio(t.key)}
                    className={[
                      "text-left rounded-3xl border p-4 shadow-sm hover:shadow transition",
                      t.colorClass,
                    ].join(" ")}
                    title={`Abrir sección: ${t.label}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-base font-bold text-slate-900">
                        <span className="mr-2">{t.icon}</span>
                        {t.label}
                      </div>
                      <span className="text-xs font-bold text-slate-600">Abrir →</span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <MiniStat label="Leads 7d" value={safeNum(k.leads7d)} />
                      <MiniStat label="Comparativas mes" value={safeNum(k.comparativasMes)} />
                      <MiniStat label="Ahorro" value={eur(safeNum(k.ahorroTotal))} />
                      <MiniStat label="Comisión" value={eur(safeNum(k.comisionTotal))} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* KPI activo (panel destacado) */}
            <div className="mt-4 rounded-3xl border bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Vista activa: {TIPOS.find((x) => x.key === activeTipo)?.label}
                  </h3>
                  <p className="text-sm font-semibold text-slate-600">
                    KPIs focalizados para decisión rápida.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/historial-comparativas?lugarId=${lugarId}&tipo=${activeTipo}`)}
                    className="rounded-2xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
                  >
                    Ver comparativas
                  </button>
                  <button
                    onClick={() => goSeccionServicio(activeTipo)}
                    className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:opacity-90"
                  >
                    Ir a sección
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                <KpiCard title="Leads (7 días)" value={safeNum(data?.kpisPorTipo?.[activeTipo]?.leads7d)} hint="Captación" />
                <KpiCard title="Comparativas (mes)" value={safeNum(data?.kpisPorTipo?.[activeTipo]?.comparativasMes)} hint="Actividad" />
                <KpiCard title="Ahorro total" value={eur(safeNum(data?.kpisPorTipo?.[activeTipo]?.ahorroTotal))} hint="Acumulado" />
                <KpiCard title="Comisión total" value={eur(safeNum(data?.kpisPorTipo?.[activeTipo]?.comisionTotal))} hint="Acumulado" />
              </div>
            </div>
          </div>
        </section>

        {/* Listado inferior comparativas agrupadas */}
        <section className="mb-10">
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Comparativas por Servicio</h2>
                <p className="text-sm font-semibold text-slate-600">
                  Listado agrupado · más recientes primero · enfoque operativo.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/historial-comparativas?lugarId=${lugarId}`)}
                  className="rounded-2xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
                >
                  Abrir historial completo
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-6">
              {TIPOS.map((t) => {
                const rows = comparativasPorTipo[t.key] || [];
                return (
                  <div key={t.key} className="rounded-3xl border bg-white">
                    <div className={["flex items-center justify-between gap-3 rounded-t-3xl border-b p-4", t.colorClass].join(" ")}>
                      <div className="text-base font-bold text-slate-900">
                        <span className="mr-2">{t.icon}</span>
                        {t.label}
                        <span className="ml-2 text-sm font-semibold text-slate-600">({rows.length})</span>
                      </div>
                      <button
                        onClick={() => router.push(`/historial-comparativas?lugarId=${lugarId}&tipo=${t.key}`)}
                        className="rounded-2xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
                      >
                        Ver todas →
                      </button>
                    </div>

                    {rows.length === 0 ? (
                      <div className="p-4">
                        <p className="text-sm font-semibold text-slate-600">Sin comparativas registradas.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr className="text-left text-xs font-bold text-slate-700">
                              <th className="px-4 py-3">Fecha</th>
                              <th className="px-4 py-3">Cliente</th>
                              <th className="px-4 py-3">Ahorro</th>
                              <th className="px-4 py-3">Comisión</th>
                              <th className="px-4 py-3">Estado</th>
                              <th className="px-4 py-3 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(0, 10).map((c) => (
                              <tr key={String(c.id)} className="border-t text-sm">
                                <td className="px-4 py-3 font-semibold text-slate-700">{fmtDate(c.creadaEn)}</td>
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900">{c.clienteNombre || "—"}</div>
                                  <div className="text-xs font-semibold text-slate-600">
                                    {c.clienteTelefono || c.clienteEmail || ""}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-900">{eur(safeNum(c.ahorro))}</td>
                                <td className="px-4 py-3 font-bold text-slate-900">{eur(safeNum(c.comision))}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex rounded-full border bg-white px-2 py-1 text-xs font-bold text-slate-700">
                                    {c.estado || "—"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => router.push(`/comparador?id=${c.id}`)}
                                    className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:opacity-90"
                                  >
                                    Cargar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {rows.length > 10 && (
                          <div className="border-t p-3 text-right">
                            <button
                              onClick={() => router.push(`/historial-comparativas?lugarId=${lugarId}&tipo=${t.key}`)}
                              className="rounded-2xl border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"
                            >
                              Ver {rows.length - 10} más →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">Cargando detalle del lugar…</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** =========================
 *  UI Components (director style)
 *  ========================= */
function KpiCard({ title, value, hint }: { title: string; value: any; hint?: string }) {
  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value ?? "—"}</div>
      <div className="mt-1 text-xs font-semibold text-slate-600">{hint || ""}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white px-3 py-2">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <span className="text-sm font-extrabold text-slate-900">{value ?? "—"}</span>
    </div>
  );
}
