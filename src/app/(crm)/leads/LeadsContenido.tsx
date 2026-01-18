"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LeadMini = {
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

type LeadStats = {
  total: number;
  estados: Record<string, number>;
  ratios?: Record<string, number>;
  topAgentes?: Array<{ agenteId: number | null; nombre: string; total: number }>;
  topLugares?: Array<{ lugarId: number | null; nombre: string; total: number }>;
  meta?: any;
};

type Tareas = {
  pendientes?: LeadMini[];
  vencidas?: LeadMini[];
  hoy?: LeadMini[];
  meta?: any;
};

async function fetchJson<T = any>(url: string, init?: RequestInit, ms = 15000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...init, cache: "no-store", signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as any)?.error || `Error ${res.status}`);
    return data as T;
  } finally {
    clearTimeout(t);
  }
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("es-ES");
  } catch {
    return String(dt);
  }
}

function pillEstado(estado?: string | null) {
  const e = String(estado || "pendiente").toLowerCase();
  const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border";
  if (e === "pendiente") return `${base} bg-slate-900/60 text-slate-200 border-slate-700`;
  if (e === "contactado") return `${base} bg-blue-900/35 text-blue-100 border-blue-500/40`;
  if (e === "comparativa") return `${base} bg-emerald-900/25 text-emerald-100 border-emerald-500/40`;
  if (e === "contrato") return `${base} bg-amber-900/35 text-amber-100 border-amber-500/40`;
  if (e === "cerrado") return `${base} bg-emerald-600/20 text-emerald-100 border-emerald-400/70`;
  if (e === "perdido") return `${base} bg-red-900/35 text-red-100 border-red-500/40`;
  return `${base} bg-slate-900/60 text-slate-200 border-slate-700`;
}

function pillUrgencia(l: LeadMini, tipo: "vencidas" | "hoy" | "pendientes") {
  const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border";
  const dt = l.proximaAccionEn ? new Date(l.proximaAccionEn) : null;

  if (!dt) {
    // sin siguiente paso (muy importante en pendientes)
    return `${base} bg-fuchsia-600/15 border-fuchsia-400 text-fuchsia-100`;
  }

  const now = Date.now();
  const msDiff = dt.getTime() - now;

  if (tipo === "vencidas") {
    // cuanto más retraso, más importante (visual simple)
    return `${base} bg-red-600/15 border-red-400 text-red-100`;
  }

  if (tipo === "hoy") {
    return `${base} bg-amber-600/15 border-amber-400 text-amber-100`;
  }

  // pendientes (futuras)
  if (msDiff <= 24 * 60 * 60 * 1000) {
    return `${base} bg-indigo-600/15 border-indigo-400 text-indigo-100`;
  }
  return `${base} bg-slate-900/60 border-slate-700 text-slate-200`;
}

function sortByProximaAscNullsLast(a: LeadMini, b: LeadMini) {
  const da = a.proximaAccionEn ? new Date(a.proximaAccionEn).getTime() : Number.POSITIVE_INFINITY;
  const db = b.proximaAccionEn ? new Date(b.proximaAccionEn).getTime() : Number.POSITIVE_INFINITY;
  return da - db;
}

function sortPendientesPro(a: LeadMini, b: LeadMini) {
  // 1) primero SIN proximaAccionEn (null)
  const aNull = !a.proximaAccionEn;
  const bNull = !b.proximaAccionEn;
  if (aNull && !bNull) return -1;
  if (!aNull && bNull) return 1;

  // 2) luego por fecha asc
  return sortByProximaAscNullsLast(a, b);
}

export default function LeadsContenido() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rango, setRango] = useState<"hoy" | "7d" | "30d">("30d");
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [tareas, setTareas] = useState<Tareas | null>(null);

  const [q, setQ] = useState("");

  const [toast, setToast] = useState<string | null>(null);

  const ejecutarAccion = async (lead: LeadMini, canal: "whatsapp" | "llamada") => {
    try {
      const res = await fetchJson<{
        ok: boolean;
        whatsappUrl?: string;
        nextAt?: string;
      }>(`/api/crm/leads/${lead.id}/next-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal, delayHours: 48 }),
      });

      setToast(`✅ Acción registrada (${canal}) · Próxima en 48h`);
      setTimeout(() => setToast(null), 2200);

      // refresca listas + stats
      await cargar();

      // si es WhatsApp, abrimos el link
      if (canal === "whatsapp" && res.whatsappUrl) {
        window.open(res.whatsappUrl, "_blank", "noopener,noreferrer");
      }

      // si es llamada, abrimos tel:
      if (canal === "llamada") {
        const tel = String(lead.telefono || "").replace(/\s/g, "");
        window.location.href = `tel:${tel}`;
      }
    } catch (e: any) {
     setToast(`❌ ${e?.message || "No se pudo ejecutar"}`);
      setTimeout(() => setToast(null), 2500);
    }
  };


  const cargar = async () => {
    setLoading(true);
    setError(null);

    try {
      const t = await fetchJson<Tareas>("/api/crm/leads/tareas");
      setTareas(t);

      const s = await fetchJson<LeadStats>(`/api/crm/leads/stats?rango=${rango}`);
      setStats(s);
    } catch (e: any) {
      setError(e?.message || "Error cargando Lead Center");
      setStats(null);
      setTareas(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango]);

  const pendientesRaw = tareas?.pendientes ?? [];
  const hoyRaw = tareas?.hoy ?? [];
  const vencidasRaw = tareas?.vencidas ?? [];

  const filtrar = (items: LeadMini[]) => {
    const term = q.trim().toLowerCase();
    if (!term) return items;

    return items.filter((l) => {
      const s = `${l.id} ${l.nombre} ${l.email} ${l.telefono} ${l.estado ?? ""} ${l.agente?.nombre ?? ""} ${
        l.lugar?.nombre ?? ""
      } ${l.proximaAccion ?? ""}`.toLowerCase();
      return s.includes(term);
    });
  };

  const pendientes = useMemo(() => filtrar(pendientesRaw).slice().sort(sortPendientesPro), [q, pendientesRaw]);
  const hoy = useMemo(() => filtrar(hoyRaw).slice().sort(sortByProximaAscNullsLast), [q, hoyRaw]);
  const vencidas = useMemo(() => filtrar(vencidasRaw).slice().sort(sortByProximaAscNullsLast), [q, vencidasRaw]);

  if (loading) return <div className="p-6 text-slate-200 text-base">Cargando leads…</div>;

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-2xl rounded-3xl bg-red-900/40 border border-red-500/40 text-red-100 p-5">
          <div className="text-xl font-extrabold">Error</div>
          <div className="mt-2 text-base">{error}</div>
          <button
            onClick={cargar}
            className="mt-4 inline-flex px-4 py-2 rounded-full bg-slate-950 border border-slate-700 text-slate-100 font-bold hover:border-emerald-400"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const Card = ({
    title,
    items,
    tipo,
  }: {
    title: string;
    items: LeadMini[];
    tipo: "vencidas" | "hoy" | "pendientes";
  }) => (
    <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-extrabold text-white">{title}</div>
        <div className="text-sm text-slate-400 font-bold">{items.length}</div>
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-5 text-slate-400 text-base">
            Sin leads en esta sección.
          </div>
        ) : (
          items.slice(0, 16).map((l) => {
            const urg = pillUrgencia(l, tipo);
            const urgTxt = !l.proximaAccionEn
              ? "SIN SIGUIENTE PASO"
              : tipo === "vencidas"
              ? "RETRASO"
              : tipo === "hoy"
              ? "HOY"
              : "PROGRAMADA";

            return (
              <button
                key={l.id}
                onClick={() => router.push(`/leads/${l.id}`)}
                className="w-full text-left rounded-2xl bg-slate-900/60 border border-slate-800 px-4 py-3 hover:border-emerald-500/40 transition"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-white font-extrabold text-base">
                      #{l.id} · {l.nombre || "Lead sin nombre"}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={urg}>{urgTxt}</span>
                      <span className={pillEstado(l.estado)}>{String(l.estado || "pendiente").toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="text-slate-300 text-sm">
                    {l.email || "—"} · {l.telefono || "—"}
                  </div>

                  <div className="text-slate-400 text-sm">
                    Próxima: <span className="font-extrabold text-slate-200">{l.proximaAccion || "—"}</span> ·{" "}
                    <span className="font-extrabold text-slate-200">{fmt(l.proximaAccionEn)}</span>
                  </div>

                  <div className="text-slate-500 text-xs">
                    Agente: {l.agente?.nombre || "—"} · Lugar: {l.lugar?.nombre || "—"} · Creado: {fmt(l.creadoEn)}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {items.length > 16 && (
        <div className="mt-3 text-xs text-slate-500 font-semibold">
          Mostrando 16 de {items.length}. (Luego añadimos paginación)
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Lead Center PRO</h1>
          <p className="text-slate-300 mt-1 text-base">Tareas, métricas y seguimiento comercial.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono, agente, lugar…"
            className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 font-bold outline-none focus:border-emerald-400 w-[360px] max-w-full"
          />

          <select
            value={rango}
            onChange={(e) => setRango(e.target.value as "hoy" | "7d" | "30d")}
            className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 font-bold"
          >
            <option value="hoy">Hoy</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>

          <button
            onClick={cargar}
            className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 font-bold hover:border-emerald-400"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-4">
          <div className="text-slate-300 font-bold">Total</div>
          <div className="text-3xl font-extrabold text-white mt-1">{stats?.total ?? 0}</div>
        </div>

        <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-4">
          <div className="text-slate-300 font-bold">Contactado</div>
          <div className="text-3xl font-extrabold text-white mt-1">{stats?.estados?.contactado ?? 0}</div>
        </div>

        <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-4">
          <div className="text-slate-300 font-bold">Comparativa</div>
          <div className="text-3xl font-extrabold text-white mt-1">{stats?.estados?.comparativa ?? 0}</div>
        </div>

        <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-4">
          <div className="text-slate-300 font-bold">Contrato</div>
          <div className="text-3xl font-extrabold text-white mt-1">{stats?.estados?.contrato ?? 0}</div>
        </div>
      </div>

      {/* Tareas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="🔥 Vencidas" items={vencidas} tipo="vencidas" />
        <Card title="📅 Para hoy" items={hoy} tipo="hoy" />
        <Card title="🧠 Pendientes" items={pendientes} tipo="pendientes" />
      </div>
    </div>
  );
}
