"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Lead = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado?: string | null;
  creadoEn: string;
  proximaAccion?: string | null;
  proximaAccionEn?: string | null;
  agente?: { id: number; nombre: string | null } | null;
  lugar?: { id: number; nombre: string | null } | null;
};

type Tareas = {
  vencidos: Lead[];
  hoy: Lead[];
  nuevos: Lead[];
  todos: Lead[];
};

type LeadStats = {
  total: number;
  estados: {
    pendiente: number;
    contactado: number;
    comparativa: number;
    contrato: number;
    cerrado: number;
    perdido: number;
  };
  ratios: Record<string, number>;
  topAgentes: { agenteId: number | null; nombre: string; total: number }[];
  topLugares: { lugarId: number | null; nombre: string; total: number }[];
};

const ESTADOS = [
  "pendiente",
  "contactado",
  "comparativa",
  "contrato",
  "cerrado",
  "perdido",
] as const;

function badgeEstado(estado?: string | null) {
  const s = (estado || "pendiente").toLowerCase();
  const base =
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border";
  if (s === "pendiente")
    return `${base} bg-slate-900/70 text-slate-200 border-slate-700`;
  if (s === "contactado")
    return `${base} bg-blue-900/40 text-blue-100 border-blue-500/40`;
  if (s === "comparativa")
    return `${base} bg-amber-900/40 text-amber-100 border-amber-500/40`;
  if (s === "contrato")
    return `${base} bg-emerald-900/40 text-emerald-100 border-emerald-500/40`;
  if (s === "cerrado")
    return `${base} bg-green-900/50 text-green-100 border-green-500/50`;
  if (s === "perdido")
    return `${base} bg-red-900/40 text-red-100 border-red-500/40`;
  return `${base} bg-slate-900/70 text-slate-200 border-slate-700`;
}

function prioridad(lead: Lead) {
  const now = Date.now();
  const creado = new Date(lead.creadoEn).getTime();
  const ageHours = (now - creado) / (1000 * 60 * 60);

  const pa = lead.proximaAccionEn ? new Date(lead.proximaAccionEn).getTime() : null;
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);

  const vencido = pa !== null && pa < inicioHoy.getTime();
  const esHoy = pa !== null && pa >= inicioHoy.getTime() && pa <= finHoy.getTime();

  if (vencido) return "ALTA";
  if (ageHours <= 24) return "ALTA";
  if (esHoy) return "MEDIA";
  return "NORMAL";
}

function badgePrioridad(p: string) {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold border";
  if (p === "ALTA") return `${base} bg-red-900/40 text-red-100 border-red-500/40`;
  if (p === "MEDIA")
    return `${base} bg-amber-900/40 text-amber-100 border-amber-500/40`;
  return `${base} bg-slate-900/60 text-slate-200 border-slate-700`;
}

export default function LeadsContenido() {
  const [tareas, setTareas] = useState<Tareas | null>(null);
  const [stats, setStats] = useState<LeadStats | null>(null);

  const [rango, setRango] = useState<"hoy" | "7d" | "30d">("7d");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"vencidos" | "hoy" | "nuevos" | "todos">("vencidos");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>("todos");

  const cargar = async () => {
    setLoading(true);
    try {
      // ✅ TAREAS
      const res = await fetch("/api/leads/tareas", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cargar leads");
      }
      const data = (await res.json()) as Tareas;
      setTareas(data);

      // ✅ STATS
      const resStats = await fetch(`/api/leads/stats?rango=${rango}`, {
        cache: "no-store",
      });
      if (resStats.ok) {
        const st = (await resStats.json()) as LeadStats;
        setStats(st);
      } else {
        setStats(null);
      }

      setError(null);
    } catch (e: any) {
      setError(e?.message || "Error al cargar leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // cuando cambias rango recargamos stats+tareas
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango]);

  const lista = useMemo(() => {
    if (!tareas) return [];
    return tareas[tab] || [];
  }, [tareas, tab]);

  const filtrados = useMemo(() => {
    const query = q.trim().toLowerCase();

    return lista
      .filter((l) => {
        const est = (l.estado || "pendiente").toLowerCase();
        if (estado !== "todos" && est !== estado) return false;

        if (!query) return true;
        return (
          l.nombre?.toLowerCase().includes(query) ||
          l.email?.toLowerCase().includes(query) ||
          l.telefono?.toLowerCase().includes(query) ||
          (l.agente?.nombre || "").toLowerCase().includes(query) ||
          (l.lugar?.nombre || "").toLowerCase().includes(query) ||
          String(l.id).includes(query)
        );
      })
      .sort((a, b) => {
        const pa = prioridad(a);
        const pb = prioridad(b);
        const score = (x: string) => (x === "ALTA" ? 2 : x === "MEDIA" ? 1 : 0);
        if (score(pb) !== score(pa)) return score(pb) - score(pa);

        const da = a.proximaAccionEn ? new Date(a.proximaAccionEn).getTime() : Infinity;
        const db = b.proximaAccionEn ? new Date(b.proximaAccionEn).getTime() : Infinity;
        if (da !== db) return da - db;

        return new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime();
      });
  }, [lista, q, estado]);

  if (loading) {
    return <div className="p-6 text-slate-200 text-sm">Cargando Lead Center…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-red-900/70 border border-red-500/70 text-red-50 rounded-2xl px-5 py-4 text-sm">
          <p className="font-semibold mb-1">Error al cargar Leads</p>
          <p>{error}</p>
          <button
            onClick={cargar}
            className="mt-3 inline-flex px-3 py-1.5 rounded-full bg-slate-950 border border-slate-600 text-slate-100 text-xs hover:border-emerald-400"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const cV = tareas?.vencidos.length || 0;
  const cH = tareas?.hoy.length || 0;
  const cN = tareas?.nuevos.length || 0;
  const cT = tareas?.todos.length || 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Lead Center</h1>
          <p className="text-sm text-slate-300">
            Tu bandeja comercial diaria. Prioriza, contacta y convierte.
          </p>

          {/* Selector rango */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setRango("hoy")}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
                rango === "hoy"
                  ? "bg-emerald-600/20 border-emerald-400 text-emerald-100"
                  : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
              }`}
            >
              Hoy
            </button>

            <button
              onClick={() => setRango("7d")}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
                rango === "7d"
                  ? "bg-emerald-600/20 border-emerald-400 text-emerald-100"
                  : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
              }`}
            >
              7 días
            </button>

            <button
              onClick={() => setRango("30d")}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
                rango === "30d"
                  ? "bg-emerald-600/20 border-emerald-400 text-emerald-100"
                  : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
              }`}
            >
              30 días
            </button>
          </div>
        </div>

        <button
          onClick={cargar}
          className="px-3 py-1.5 rounded-full text-xs font-bold border bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400 w-fit"
        >
          Actualizar
        </button>
      </div>

      {/* Métricas */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-5">
            <p className="text-xs text-slate-400 font-bold">TOTAL EN RANGO</p>
            <p className="text-3xl text-white font-extrabold mt-1">{stats.total}</p>
            <p className="text-xs text-slate-400 mt-1">Leads filtrados</p>
          </div>

          <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-5">
            <p className="text-xs text-slate-400 font-bold">TOP AGENTES</p>
            <div className="mt-2 space-y-1">
              {stats.topAgentes.slice(0, 3).map((a, i) => (
                <div key={i} className="flex justify-between text-sm text-slate-200">
                  <span className="truncate">{a.nombre}</span>
                  <span className="font-bold">{a.total}</span>
                </div>
              ))}
              {stats.topAgentes.length === 0 && (
                <p className="text-sm text-slate-400 mt-2">Sin datos</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-5">
            <p className="text-xs text-slate-400 font-bold">TOP LUGARES</p>
            <div className="mt-2 space-y-1">
              {stats.topLugares.slice(0, 3).map((l, i) => (
                <div key={i} className="flex justify-between text-sm text-slate-200">
                  <span className="truncate">{l.nombre}</span>
                  <span className="font-bold">{l.total}</span>
                </div>
              ))}
              {stats.topLugares.length === 0 && (
                <p className="text-sm text-slate-400 mt-2">Sin datos</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("vencidos")}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
            tab === "vencidos"
              ? "bg-red-600/20 border-red-400 text-red-100"
              : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
          }`}
        >
          ⚠️ Vencidos <span className="ml-2 opacity-90">({cV})</span>
        </button>

        <button
          onClick={() => setTab("hoy")}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
            tab === "hoy"
              ? "bg-amber-600/20 border-amber-400 text-amber-100"
              : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
          }`}
        >
          📅 Hoy <span className="ml-2 opacity-90">({cH})</span>
        </button>

        <button
          onClick={() => setTab("nuevos")}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
            tab === "nuevos"
              ? "bg-emerald-600/20 border-emerald-400 text-emerald-100"
              : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
          }`}
        >
          🆕 Nuevos 24h <span className="ml-2 opacity-90">({cN})</span>
        </button>

        <button
          onClick={() => setTab("todos")}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
            tab === "todos"
              ? "bg-blue-600/20 border-blue-400 text-blue-100"
              : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
          }`}
        >
          📦 Todos <span className="ml-2 opacity-90">({cT})</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-4 flex flex-col md:flex-row md:items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono, agente, lugar o ID…"
          className="w-full md:flex-1 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm outline-none focus:border-emerald-400"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="w-full md:w-56 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm outline-none focus:border-emerald-400"
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className="rounded-3xl bg-slate-950/85 border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-100">
            {tab.toUpperCase()} ({filtrados.length})
          </p>
          <p className="text-xs text-slate-400">
            Prioridad automática + próxima acción para no perder ventas
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-bold">Lead</th>
                <th className="text-left px-5 py-3 font-bold">Prioridad</th>
                <th className="text-left px-5 py-3 font-bold">Próxima acción</th>
                <th className="text-left px-5 py-3 font-bold">Estado</th>
                <th className="text-left px-5 py-3 font-bold">Agente / Lugar</th>
                <th className="text-right px-5 py-3 font-bold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtrados.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-300" colSpan={6}>
                    No hay leads en esta bandeja con esos filtros.
                  </td>
                </tr>
              ) : (
                filtrados.map((l) => {
                  const p = prioridad(l);
                  return (
                    <tr key={l.id} className="hover:bg-slate-900/40">
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-white">{l.nombre}</div>
                        <div className="text-xs text-slate-300">{l.email}</div>
                        <div className="text-xs text-slate-400">{l.telefono}</div>
                        <div className="text-[11px] text-slate-500 mt-1">ID: {l.id}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={badgePrioridad(p)}>{p}</span>
                      </td>

                      <td className="px-5 py-4 text-slate-200">
                        <div className="font-semibold">{l.proximaAccion || "—"}</div>
                        <div className="text-xs text-slate-400">
                          {l.proximaAccionEn
                            ? new Date(l.proximaAccionEn).toLocaleString("es-ES")
                            : "Sin fecha"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={badgeEstado(l.estado)}>
                          {(l.estado || "pendiente").toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-200 text-xs">
                        <div>
                          <span className="text-slate-400">Agente:</span>{" "}
                          {l.agente?.nombre || "—"}
                        </div>
                        <div>
                          <span className="text-slate-400">Lugar:</span>{" "}
                          {l.lugar?.nombre || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/leads/${l.id}`}
                          className="inline-flex px-3 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-400 text-emerald-100 text-xs font-bold hover:bg-emerald-600/30"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota */}
      <div className="rounded-3xl bg-slate-950/60 border border-slate-800 p-5">
        <p className="text-sm text-slate-200 font-bold mb-1">Regla de oro</p>
        <p className="text-sm text-slate-300">
          Si un lead tiene <span className="font-semibold">próxima acción</span>, nunca se pierde.
          Si no la tiene, se olvida. Este Lead Center está hecho para cerrar ventas, no para almacenar contactos.
        </p>
      </div>
    </div>
  );
}
