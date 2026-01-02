/* src/app/(crm)/lugares/[id]/detalle/page.tsx */
/* src/app/(crm)/lugares/[id]/detalle/page.tsx */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
const TIPOS: {
  key: TipoServicio;
  label: string;
  icon: string;
  // tarjetas “director” por servicio (dark)
  cardClass: string;
  chipClass: string;
}[] = [
  {
    key: "LUZ",
    label: "Luz",
    icon: "⚡",
    cardClass: "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15",
    chipClass: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  },
  {
    key: "GAS",
    label: "Gas",
    icon: "🔥",
    cardClass: "border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/15",
    chipClass: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  },
  {
    key: "TELEFONIA",
    label: "Telefonía",
    icon: "📱",
    cardClass: "border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/15",
    chipClass: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  },
  {
    key: "SEGUROS",
    label: "Seguros",
    icon: "🛡️",
    cardClass: "border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15",
    chipClass: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  },
  {
    key: "OTROS",
    label: "Otros",
    icon: "📌",
    cardClass: "border-slate-500/30 bg-slate-500/10 hover:bg-slate-500/15",
    chipClass: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  },
];

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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

  // Fallback: si no viene kpisPorTipo, lo calculamos desde comparativas
  const hasRealByType =
    fromApi &&
    (Object.keys(kpisPorTipo) as TipoServicio[]).some(
      (t) =>
        kpisPorTipo[t].leads7d ||
        kpisPorTipo[t].comparativasMes ||
        kpisPorTipo[t].ahorroTotal ||
        kpisPorTipo[t].comisionTotal
    );

  if (!hasRealByType && comparativas.length) {
    (Object.keys(kpisPorTipo) as TipoServicio[]).forEach((t) => {
      const list = comparativas.filter((x) => x.tipoServicio === t);
      kpisPorTipo[t] = {
        leads7d: 0,
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
      base[t].sort(
        (a, b) => new Date(b.creadaEn || 0).getTime() - new Date(a.creadaEn || 0).getTime()
      );
    });
    return base;
  }, [data]);

  function goTipo(t: TipoServicio) {
    setActiveTipo(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tipo", t);
    router.replace(url.toString());

    const el = document.getElementById("kpis-por-tipo");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goSeccionServicio(t: TipoServicio) {
    // Ajusta rutas destino si quieres: historial / comparador / etc.
    const map: Record<TipoServicio, string> = {
      LUZ: `/historial-comparativas?lugarId=${lugarId}&tipo=LUZ`,
      GAS: `/historial-comparativas?lugarId=${lugarId}&tipo=GAS`,
      TELEFONIA: `/historial-comparativas?lugarId=${lugarId}&tipo=TELEFONIA`,
      SEGUROS: `/historial-comparativas?lugarId=${lugarId}&tipo=SEGUROS`,
      OTROS: `/historial-comparativas?lugarId=${lugarId}&tipo=OTROS`,
    };
    router.push(map[t] || map.OTROS);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 md:px-8 py-8 text-slate-50">
      {/* Tipografía general más grande */}
      <div className="w-full max-w-[1700px] mx-auto space-y-8 text-[15px] md:text-[16px] font-medium">
        {/* CABECERA estilo /lugares */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-fuchsia-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-6 md:px-8 py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <Image
                src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                alt="Impulso Energético"
                width={150}
                height={44}
                className="hidden md:block"
              />

              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 truncate">
                  {loading ? "Cargando detalle…" : data?.lugar?.nombre || "Detalle del lugar"}
                </h1>

                <p className="text-sm md:text-base text-slate-300 font-semibold truncate">
                  {data?.lugar?.direccion || "—"}
                  {data?.lugar?.agenteNombre ? ` · Agente: ${data.lugar.agenteNombre}` : ""}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border border-slate-700 bg-slate-900/60 text-slate-200">
                    ID: <span className="font-mono text-slate-100">#{String(lugarId)}</span>
                  </span>

                  <span
                    className={classNames(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border",
                      data?.lugar?.activo === false
                        ? "bg-red-500/15 text-red-200 border-red-500/30"
                        : "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
                    )}
                  >
                    {data?.lugar?.activo === false ? "⛔ Inactivo" : "✅ Activo"}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones cabecera */}
            <div className="flex flex-col items-start lg:items-end gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.back()}
                  className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-100 font-extrabold"
                >
                  ← Volver
                </button>

                <button
                  onClick={() => router.push(`/lugares`)}
                  className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-100 font-extrabold"
                >
                  📍 Lugares
                </button>

                <button
                  onClick={() => router.push(`/dashboard`)}
                  className="h-10 px-4 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold"
                >
                  🏠 Dashboard
                </button>

                <button
                  onClick={() => router.push(`/lugares?editId=${lugarId}`)}
                  className="h-10 px-4 rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400 font-extrabold"
                  title="Abrir edición desde la lista (si lo activamos)"
                >
                  ✏️ Editar
                </button>
              </div>

              <div className="text-sm text-slate-300 font-semibold">
                Vista “nivel director” · KPIs y comparativas por servicio
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="text-sm md:text-base font-extrabold text-red-200">{error}</p>
          </div>
        )}

        {/* KPI Global “Director” */}
        <section>
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-white">Panel Directivo</h2>
                <p className="text-sm md:text-base text-slate-300 font-semibold">
                  Resumen ejecutivo del lugar · KPIs globales (últimos 7 días / mes / acumulado)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.push(`/leads?lugarId=${lugarId}`)}
                  className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-100 font-extrabold"
                >
                  Ver leads
                </button>
                <button
                  onClick={() => router.push(`/historial-comparativas?lugarId=${lugarId}`)}
                  className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-100 font-extrabold"
                >
                  Ver comparativas
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
              <KpiCardDark title="Leads (7 días)" value={safeNum(data?.kpisGlobal?.leads7d)} hint="Captación reciente" />
              <KpiCardDark title="Comparativas (mes)" value={safeNum(data?.kpisGlobal?.comparativasMes)} hint="Actividad mensual" />
              <KpiCardDark title="Ahorro total" value={eur(safeNum(data?.kpisGlobal?.ahorroTotal))} hint="Acumulado (€)" />
              <KpiCardDark title="Comisión total" value={eur(safeNum(data?.kpisGlobal?.comisionTotal))} hint="Acumulado (€)" />
            </div>
          </div>
        </section>

        {/* KPIs por tipo (clicables) */}
        <section id="kpis-por-tipo">
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-white">KPIs por Servicio</h2>
                <p className="text-sm md:text-base text-slate-300 font-semibold">
                  Desglose ejecutivo por línea de negocio (clic para abrir sección)
                </p>
              </div>

              {/* Selector tipo */}
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => goTipo(t.key)}
                    className={classNames(
                      "h-10 px-4 rounded-xl border text-sm font-extrabold transition",
                      activeTipo === t.key
                        ? "bg-slate-100 text-slate-950 border-slate-100"
                        : "bg-slate-900/60 text-slate-100 border-slate-700 hover:bg-slate-900"
                    )}
                  >
                    <span className="mr-2">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid tarjetas por servicio */}
            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-5">
              {TIPOS.map((t) => {
                const k = data?.kpisPorTipo?.[t.key] || {
                  leads7d: 0,
                  comparativasMes: 0,
                  ahorroTotal: 0,
                  comisionTotal: 0,
                };

                return (
                  <button
                    key={t.key}
                    onClick={() => goSeccionServicio(t.key)}
                    className={classNames(
                      "text-left rounded-3xl border p-4 transition shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                      t.cardClass
                    )}
                    title={`Abrir sección: ${t.label}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-base font-extrabold text-slate-50">
                        <span className="mr-2">{t.icon}</span>
                        {t.label}
                      </div>
                      <span className={classNames("text-xs font-extrabold border px-2 py-1 rounded-full", t.chipClass)}>
                        Abrir →
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <MiniStatDark label="Leads 7d" value={safeNum(k.leads7d)} />
                      <MiniStatDark label="Comparativas mes" value={safeNum(k.comparativasMes)} />
                      <MiniStatDark label="Ahorro" value={eur(safeNum(k.ahorroTotal))} />
                      <MiniStatDark label="Comisión" value={eur(safeNum(k.comisionTotal))} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* KPI activo (panel destacado) */}
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base md:text-lg font-extrabold text-white">
                    Vista activa: {TIPOS.find((x) => x.key === activeTipo)?.label}
                  </h3>
                  <p className="text-sm md:text-base text-slate-300 font-semibold">
                    KPIs focalizados para decisión rápida.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/historial-comparativas?lugarId=${lugarId}&tipo=${activeTipo}`)}
                    className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-100 font-extrabold"
                  >
                    Ver comparativas
                  </button>
                  <button
                    onClick={() => goSeccionServicio(activeTipo)}
                    className="h-10 px-4 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold"
                  >
                    Ir a sección
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                <KpiCardDark title="Leads (7 días)" value={safeNum(data?.kpisPorTipo?.[activeTipo]?.leads7d)} hint="Captación" />
                <KpiCardDark title="Comparativas (mes)" value={safeNum(data?.kpisPorTipo?.[activeTipo]?.comparativasMes)} hint="Actividad" />
                <KpiCardDark title="Ahorro total" value={eur(safeNum(data?.kpisPorTipo?.[activeTipo]?.ahorroTotal))} hint="Acumulado" />
                <KpiCardDark title="Comisión total" value={eur(safeNum(data?.kpisPorTipo?.[activeTipo]?.comisionTotal))} hint="Acumulado" />
              </div>
            </div>
          </div>
        </section>

        {/* Listado inferior comparativas agrupadas */}
        <section className="pb-6">
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-white">Comparativas por Servicio</h2>
                <p className="text-sm md:text-base text-slate-300 font-semibold">
                  Listado agrupado · más recientes primero · enfoque operativo.
                </p>
              </div>

              <button
                onClick={() => router.push(`/historial-comparativas?lugarId=${lugarId}`)}
                className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-100 font-extrabold"
              >
                Abrir historial completo
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {TIPOS.map((t) => {
                const rows = comparativasPorTipo[t.key] || [];

                return (
                  <div key={t.key} className="rounded-3xl border border-slate-800 bg-slate-900/35 overflow-hidden">
                    <div className={classNames("flex items-center justify-between gap-3 p-4 border-b border-slate-800", t.cardClass)}>
                      <div className="text-base md:text-lg font-extrabold text-white">
                        <span className="mr-2">{t.icon}</span>
                        {t.label}
                        <span className="ml-2 text-sm font-semibold text-slate-300">({rows.length})</span>
                      </div>

                      <button
                        onClick={() => router.push(`/historial-comparativas?lugarId=${lugarId}&tipo=${t.key}`)}
                        className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-950/40 hover:bg-slate-950 text-slate-100 font-extrabold"
                      >
                        Ver todas →
                      </button>
                    </div>

                    {rows.length === 0 ? (
                      <div className="p-5">
                        <p className="text-sm md:text-base font-semibold text-slate-300">
                          Sin comparativas registradas.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[14px] md:text-[15px]">
                          <thead className="bg-slate-950/40">
                            <tr className="text-left text-xs font-extrabold text-slate-300">
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
                              <tr key={String(c.id)} className="border-t border-slate-800/70 hover:bg-slate-950/30">
                                <td className="px-4 py-3 font-semibold text-slate-200">{fmtDate(c.creadaEn)}</td>

                                <td className="px-4 py-3">
                                  <div className="font-extrabold text-white">{c.clienteNombre || "—"}</div>
                                  <div className="text-xs font-semibold text-slate-400">
                                    {c.clienteTelefono || c.clienteEmail || ""}
                                  </div>
                                </td>

                                <td className="px-4 py-3 font-extrabold text-emerald-300">{eur(safeNum(c.ahorro))}</td>
                                <td className="px-4 py-3 font-extrabold text-emerald-300">{eur(safeNum(c.comision))}</td>

                                <td className="px-4 py-3">
                                  <span className="inline-flex rounded-full border border-slate-700 bg-slate-950/40 px-2.5 py-1 text-xs font-extrabold text-slate-200">
                                    {c.estado || "—"}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => router.push(`/comparador?id=${c.id}`)}
                                    className="h-9 px-4 rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400 text-xs md:text-sm font-extrabold"
                                  >
                                    Cargar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {rows.length > 10 && (
                          <div className="border-t border-slate-800 p-4 text-right">
                            <button
                              onClick={() => router.push(`/historial-comparativas?lugarId=${lugarId}&tipo=${t.key}`)}
                              className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-950/40 hover:bg-slate-950 text-slate-100 font-extrabold"
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

            {loading && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-sm md:text-base font-semibold text-slate-300">
                  Cargando detalle del lugar…
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/** =========================
 *  UI Components (Impulso dark director style)
 *  ========================= */
function KpiCardDark({ title, value, hint }: { title: string; value: any; hint?: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value ?? "—"}</div>
      <div className="mt-1 text-xs font-semibold text-slate-400">{hint || ""}</div>
    </div>
  );
}

function MiniStatDark({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2">
      <span className="text-xs font-extrabold text-slate-300">{label}</span>
      <span className="text-sm font-extrabold text-white">{value ?? "—"}</span>
    </div>
  );
}
