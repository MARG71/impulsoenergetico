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
  ratios?: Record<string, number>;
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
    "inline-flex items-center px-3 py-1 rounded-full text-sm font-extrabold border";
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
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border";
  if (p === "ALTA") return `${base} bg-red-900/40 text-red-100 border-red-500/40`;
  if (p === "MEDIA")
    return `${base} bg-amber-900/40 text-amber-100 border-amber-500/40`;
  return `${base} bg-slate-900/60 text-slate-200 border-slate-700`;
}

function fmtFecha(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("es-ES");
  } catch {
    return dt;
  }
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

  const [toast, setToast] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      // ✅ TAREAS (CRM)
      const res = await fetch("/api/crm/leads/tareas", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cargar leads");
      }
      const data = (await res.json()) as Tareas;
      setTareas(data);

      // ✅ STATS (CRM)  <-- importante multi-admin
      const resStats = await fetch(`/api/crm/leads/stats?rango=${rango}`, {
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

  const registrarActividad = async (leadId: number, tipo: string, titulo: string, detalle?: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/actividades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, titulo, detalle: detalle || null }),
      });
      if (!res.ok) return;
      setToast("Actividad registrada ✅");
      setTimeout(() => setToast(null), 2000);
    } catch {
      // silencioso
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-200 text-base">Cargando Lead Center…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-red-900/70 border border-red-500/70 text-red-50 rounded-2xl px-5 py-4 text-base">
          <p className="font-semibold mb-1 text-lg">Error al cargar Leads</p>
          <p>{error}</p>
          <button
            onClick={cargar}
            className="mt-4 inline-flex px-4 py-2 rounded-full bg-slate-950 border border-slate-600 text-slate-100 text-sm hover:border-emerald-400"
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
    <div className="p-6 space-y-5 text-base">
      {/* Toast */}
      {toast && (
        <div className="fixed z-50 bottom-6 right-6 rounded-2xl bg-emerald-900/35 border border-emerald-500/40 text-emerald-100 px-4 py-3 font-semibold shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Lead Center</h1>
          <p className="text-base text-slate-300">
            Bandeja comercial diaria. Prioriza, contacta y convierte.
          </p>

          {/* Selector rango */}
          <div className="flex flex-wrap gap-2 mt-3">
            {(["hoy", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRango(r)}
                className={`px-4 py-2 rounded-full text-sm font-extrabold border ${
                  rango === r
                    ? "bg-emerald-600/20 border-emerald-400 text-emerald-100"
                    : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
                }`}
              >
                {r === "hoy" ? "Hoy" : r === "7d" ? "7 días" : "30 días"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={cargar}
          className="px-4 py-2 rounded-full text-sm font-bold border bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400 w-fit"
        >
          Actualizar
        </button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-5">
          <p className="text-sm text-slate-300 font-bold">⚠️ Vencidos</p>
          <p className="text-3xl text-white font-extrabold mt-1">{cV}</p>
          <p className="text-sm text-slate-400 mt-1">Primero esto</p>
        </div>

        <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-5">
          <p className="text-sm text-slate-300 font-bold">📅 Hoy</p>
          <p className="text-3xl text-white font-extrabold mt-1">{cH}</p>
          <p className="text-sm text-slate-400 mt-1">Agenda del día</p>
        </div>

        <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-5">
          <p className="text-sm text-slate-300 font-bold">🆕 Nuevos 24h</p>
          <p className="text-3xl text-white font-extrabold mt-1">{cN}</p>
          <p className="text-sm text-slate-400 mt-1">Responder rápido</p>
        </div>

        <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-5">
          <p className="text-sm text-slate-300 font-bold">📦 Total bandeja</p>
          <p className="text-3xl text-white font-extrabold mt-1">{cT}</p>
          <p className="text-sm text-slate-400 mt-1">Todos tus leads</p>
        </div>
      </div>

      {/* Métricas PRO */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-5">
            <p className="text-sm text-slate-300 font-bold">TOTAL (RANGO)</p>
            <p className="text-3xl text-white font-extrabold mt-1">{stats.total}</p>
            <p className="text-sm text-slate-400 mt-2">
              Pendiente: <span className="font-bold text-slate-200">{stats.estados.pendiente}</span>{" "}
              · Contactado: <span className="font-bold text-slate-200">{stats.estados.contactado}</span>{" "}
              · Comparativa: <span className="font-bold text-slate-200">{stats.estados.comparativa}</span>{" "}
              · Contrato: <span className="font-bold text-slate-200">{stats.estados.contrato}</span>
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-5">
            <p className="text-sm text-slate-300 font-bold">TOP AGENTES</p>
            <div className="mt-3 space-y-2">
              {stats.topAgentes.slice(0, 4).map((a, i) => (
                <div key={i} className="flex justify-between text-base text-slate-200">
                  <span className="truncate">{a.nombre}</span>
                  <span className="font-extrabold">{a.total}</span>
                </div>
              ))}
              {stats.topAgentes.length === 0 && (
                <p className="text-base text-slate-400 mt-2">Sin datos</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-5">
            <p className="text-sm text-slate-300 font-bold">TOP LUGARES</p>
            <div className="mt-3 space-y-2">
              {stats.topLugares.slice(0, 4).map((l, i) => (
                <div key={i} className="flex justify-between text-base text-slate-200">
                  <span className="truncate">{l.nombre}</span>
                  <span className="font-extrabold">{l.total}</span>
                </div>
              ))}
              {stats.topLugares.length === 0 && (
                <p className="text-base text-slate-400 mt-2">Sin datos</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("vencidos")}
          className={`px-4 py-2 rounded-full text-sm font-extrabold border ${
            tab === "vencidos"
              ? "bg-red-600/20 border-red-400 text-red-100"
              : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
          }`}
        >
          ⚠️ Vencidos <span className="ml-2 opacity-90">({cV})</span>
        </button>

        <button
          onClick={() => setTab("hoy")}
          className={`px-4 py-2 rounded-full text-sm font-extrabold border ${
            tab === "hoy"
              ? "bg-amber-600/20 border-amber-400 text-amber-100"
              : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
          }`}
        >
          📅 Hoy <span className="ml-2 opacity-90">({cH})</span>
        </button>

        <button
          onClick={() => setTab("nuevos")}
          className={`px-4 py-2 rounded-full text-sm font-extrabold border ${
            tab === "nuevos"
              ? "bg-emerald-600/20 border-emerald-400 text-emerald-100"
              : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-400"
          }`}
        >
          🆕 Nuevos 24h <span className="ml-2 opacity-90">({cN})</span>
        </button>

        <button
          onClick={() => setTab("todos")}
          className={`px-4 py-2 rounded-full text-sm font-extrabold border ${
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
          className="w-full md:flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="w-full md:w-64 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
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
        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-base font-extrabold text-slate-100">
            {tab.toUpperCase()} ({filtrados.length})
          </p>
          <p className="text-sm text-slate-400">
            Prioridad automática + próxima acción para no perder ventas
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-slate-900/60 text-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-extrabold">Lead</th>
                <th className="text-left px-5 py-3 font-extrabold">Prioridad</th>
                <th className="text-left px-5 py-3 font-extrabold">Próxima acción</th>
                <th className="text-left px-5 py-3 font-extrabold">Estado</th>
                <th className="text-left px-5 py-3 font-extrabold">Agente / Lugar</th>
                <th className="text-right px-5 py-3 font-extrabold">Acción rápida</th>
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

                  const wa = (() => {
                    const tel = String(l.telefono || "").replace(/\s/g, "");
                    const texto = encodeURIComponent(
                      `Hola ${l.nombre}, soy de Impulso Energético. Te contacto por tu solicitud para ahorrar en tus facturas. ¿Te viene bien si lo vemos?`
                    );
                    return `https://wa.me/${tel}?text=${texto}`;
                  })();

                  return (
                    <tr key={l.id} className="hover:bg-slate-900/40">
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-white text-lg">{l.nombre}</div>
                        <div className="text-sm text-slate-300">{l.email}</div>
                        <div className="text-sm text-slate-400">{l.telefono}</div>
                        <div className="text-xs text-slate-500 mt-1">ID: {l.id}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={badgePrioridad(p)}>{p}</span>
                      </td>

                      <td className="px-5 py-4 text-slate-200">
                        <div className="font-extrabold">{l.proximaAccion || "—"}</div>
                        <div className="text-sm text-slate-400">{fmtFecha(l.proximaAccionEn)}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={badgeEstado(l.estado)}>
                          {(l.estado || "pendiente").toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-200 text-sm">
                        <div>
                          <span className="text-slate-400">Agente:</span>{" "}
                          <span className="font-semibold">{l.agente?.nombre || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Lugar:</span>{" "}
                          <span className="font-semibold">{l.lugar?.nombre || "—"}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <Link
                            href={`/leads/${l.id}`}
                            className="inline-flex px-4 py-2 rounded-full bg-emerald-600/20 border border-emerald-400 text-emerald-100 text-sm font-extrabold hover:bg-emerald-600/30"
                          >
                            Abrir
                          </Link>

                          <div className="flex gap-2">
                            <a
                              href={`tel:${l.telefono}`}
                              onClick={() =>
                                registrarActividad(l.id, "llamada", "Llamada realizada", "Se intentó contactar por teléfono.")
                              }
                              className="inline-flex px-3 py-1.5 rounded-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-bold hover:border-emerald-400"
                            >
                              📞
                            </a>

                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() =>
                                registrarActividad(l.id, "whatsapp", "WhatsApp enviado", "Se envió mensaje por WhatsApp.")
                              }
                              className="inline-flex px-3 py-1.5 rounded-full bg-emerald-600/15 border border-emerald-400 text-emerald-100 text-sm font-bold hover:bg-emerald-600/25"
                            >
                              💬
                            </a>
                          </div>
                        </div>
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
        <p className="text-base text-slate-200 font-extrabold mb-1">Regla de oro</p>
        <p className="text-base text-slate-300">
          Si un lead tiene <span className="font-extrabold">próxima acción</span>, nunca se pierde.
          Si no la tiene, se olvida. Este Lead Center está hecho para cerrar ventas, no para almacenar contactos.
        </p>
      </div>
    </div>
  );
}
