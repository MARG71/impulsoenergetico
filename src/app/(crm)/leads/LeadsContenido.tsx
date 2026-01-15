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
  agente?: { id: number; nombre: string | null } | null;
  lugar?: { id: number; nombre: string | null } | null;
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

export default function LeadsContenido() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>("todos");
  const [rango, setRango] = useState<"hoy" | "7" | "30" | "todo">("30");

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cargar leads");
      }
      const data = await res.json();
      setLeads((data?.leads || []) as Lead[]);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Error al cargar leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const desdeFecha = useMemo(() => {
    const now = new Date();
    if (rango === "hoy") {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (rango === "7") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (rango === "30") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    return null;
  }, [rango]);

  const filtrados = useMemo(() => {
    const query = q.trim().toLowerCase();

    return leads.filter((l) => {
      // rango
      if (desdeFecha) {
        const f = new Date(l.creadoEn);
        if (f < desdeFecha) return false;
      }

      // estado
      const est = (l.estado || "pendiente").toLowerCase();
      if (estado !== "todos" && est !== estado) return false;

      // buscador
      if (!query) return true;
      const hay =
        l.nombre?.toLowerCase().includes(query) ||
        l.email?.toLowerCase().includes(query) ||
        l.telefono?.toLowerCase().includes(query) ||
        (l.agente?.nombre || "").toLowerCase().includes(query) ||
        (l.lugar?.nombre || "").toLowerCase().includes(query) ||
        String(l.id).includes(query);
      return !!hay;
    });
  }, [leads, q, estado, desdeFecha]);

  const kpis = useMemo(() => {
    const total = filtrados.length;

    const porEstado = ESTADOS.reduce((acc, s) => {
      acc[s] = filtrados.filter((l) => (l.estado || "pendiente").toLowerCase() === s).length;
      return acc;
    }, {} as Record<(typeof ESTADOS)[number], number>);

    const porAgente = new Map<string, number>();
    const porLugar = new Map<string, number>();

    for (const l of filtrados) {
      const a = l.agente?.nombre || "Sin agente";
      const g = l.lugar?.nombre || "Sin lugar";
      porAgente.set(a, (porAgente.get(a) || 0) + 1);
      porLugar.set(g, (porLugar.get(g) || 0) + 1);
    }

    const topAgentes = Array.from(porAgente.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topLugares = Array.from(porLugar.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { total, porEstado, topAgentes, topLugares };
  }, [filtrados]);

  if (loading) {
    return <div className="p-6 text-slate-200 text-sm">Cargando leads…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-red-900/70 border border-red-500/70 text-red-50 rounded-2xl px-5 py-4 text-sm">
          <p className="font-semibold mb-1">Error al cargar leads</p>
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

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Leads
          </h1>
          <p className="text-sm text-slate-300">
            Gestión comercial: filtra, prioriza y abre la ficha del lead para trabajar su estado.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRango("hoy")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              rango === "hoy"
                ? "bg-emerald-600/20 border-emerald-400 text-emerald-100"
                : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setRango("7")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              rango === "7"
                ? "bg-emerald-600/20 border-emerald-400 text-emerald-100"
                : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
            }`}
          >
            7 días
          </button>
          <button
            onClick={() => setRango("30")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              rango === "30"
                ? "bg-emerald-600/20 border-emerald-400 text-emerald-100"
                : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
            }`}
          >
            30 días
          </button>
          <button
            onClick={() => setRango("todo")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              rango === "todo"
                ? "bg-emerald-600/20 border-emerald-400 text-emerald-100"
                : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
            }`}
          >
            Todo
          </button>

          <button
            onClick={cargar}
            className="px-3 py-1.5 rounded-full text-xs font-bold border bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Total en rango</p>
          <p className="text-4xl font-extrabold text-white mt-1">{kpis.total}</p>
          <p className="text-xs text-slate-400 mt-1">Leads filtrados</p>
        </div>

        <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Top agentes</p>
          <div className="mt-3 space-y-2">
            {kpis.topAgentes.length === 0 ? (
              <p className="text-sm text-slate-300">Sin datos</p>
            ) : (
              kpis.topAgentes.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-200 font-semibold">{name}</span>
                  <span className="text-slate-300">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400">Top lugares</p>
          <div className="mt-3 space-y-2">
            {kpis.topLugares.length === 0 ? (
              <p className="text-sm text-slate-300">Sin datos</p>
            ) : (
              kpis.topLugares.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-200 font-semibold">{name}</span>
                  <span className="text-slate-300">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
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

      {/* Tabla */}
      <div className="rounded-3xl bg-slate-950/85 border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-100">
            Leads ({filtrados.length})
          </p>
          <p className="text-xs text-slate-400">
            Haz clic en “Abrir” para ver la ficha y trabajar el estado
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-bold">Lead</th>
                <th className="text-left px-5 py-3 font-bold">Agente</th>
                <th className="text-left px-5 py-3 font-bold">Lugar</th>
                <th className="text-left px-5 py-3 font-bold">Estado</th>
                <th className="text-left px-5 py-3 font-bold">Fecha</th>
                <th className="text-right px-5 py-3 font-bold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtrados.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-300" colSpan={6}>
                    No hay leads con estos filtros.
                  </td>
                </tr>
              ) : (
                filtrados.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/40">
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-white">{l.nombre}</div>
                      <div className="text-xs text-slate-300">{l.email}</div>
                      <div className="text-xs text-slate-400">{l.telefono}</div>
                      <div className="text-[11px] text-slate-500 mt-1">ID: {l.id}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-200">
                      {l.agente?.nombre || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-200">
                      {l.lugar?.nombre || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={badgeEstado(l.estado)}>{(l.estado || "pendiente").toUpperCase()}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs">
                      {new Date(l.creadoEn).toLocaleString("es-ES")}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota rápida de siguiente paso */}
      <div className="rounded-3xl bg-slate-950/60 border border-slate-800 p-5">
        <p className="text-sm text-slate-200 font-bold mb-1">Siguiente paso (para explotar Leads)</p>
        <p className="text-sm text-slate-300">
          Ahora que ya existe <span className="font-semibold">/leads</span>, lo siguiente es:
          <span className="font-semibold"> pipeline real</span> (estados + notas + tareas)
          y <span className="font-semibold">estadísticas de conversión</span> (Lead → Comparativa → Contrato).
        </p>
      </div>
    </div>
  );
}
