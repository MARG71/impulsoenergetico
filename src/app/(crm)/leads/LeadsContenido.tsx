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

function pillNext(proximaAccion?: string | null, proximaAccionEn?: string | null) {
  const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border";
  if (!proximaAccion && !proximaAccionEn) {
    return { text: "SIN SIGUIENTE PASO", className: `${base} bg-purple-900/35 text-purple-100 border-purple-500/40` };
  }
  return { text: "SIGUIENTE PASO", className: `${base} bg-slate-900/60 text-slate-200 border-slate-700` };
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

  const ejecutarAccion = async (lead: LeadMini, canal: "whatsapp" | "llamada") => {
    try {
      const res = await fetchJson<{ ok: boolean; whatsappUrl?: string }>(
        `/api/crm/leads/${lead.id}/next-action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ canal, delayHours: 48 }),
        }
      );

      setToast(`✅ Acción registrada (${canal}) · Próxima en 48h`);
      setTimeout(() => setToast(null), 2200);

      await cargar();

      if (canal === "whatsapp" && res.whatsappUrl) {
        window.open(res.whatsappUrl, "_blank", "noopener,noreferrer");
      }

      if (canal === "llamada") {
        const tel = String(lead.telefono || "").replace(/\s/g, "");
        window.location.href = `tel:${tel}`;
      }
    } catch (e: any) {
      setToast(`❌ ${e?.message || "No se pudo ejecutar"}`);
      setTimeout(() => setToast(null), 2500);
    }
  };

  const pendientes = tareas?.pendientes || [];
  const hoy = tareas?.hoy || [];
  const vencidas = tareas?.vencidas || [];

  const filtrar = (items: LeadMini[]) => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((l) => {
      const s =
        `${l.id} ${l.nombre} ${l.email} ${l.telefono} ${l.estado ?? ""} ${l.agente?.nombre ?? ""} ${l.lugar?.nombre ?? ""}`.toLowerCase();
      return s.includes(term);
    });
  };

  const pendientesF = useMemo(() => filtrar(pendientes), [q, tareas]); // eslint-disable-line react-hooks/exhaustive-deps
  const hoyF = useMemo(() => filtrar(hoy), [q, tareas]); // eslint-disable-line react-hooks/exhaustive-deps
  const vencidasF = useMemo(() => filtrar(vencidas), [q, tareas]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="p-6 text-slate-200">Cargando leads…</div>;

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-2xl rounded-3xl bg-red-900/40 border border-red-500/40 text-red-100 p-5">
          <div className="text-xl font-extrabold">Error</div>
          <div className="mt-2">{error}</div>
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

  const Card = ({ title, items }: { title: string; items: LeadMini[] }) => (
    <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-extrabold text-white">{title}</div>
        <div className="text-sm text-slate-400 font-bold">{items.length}</div>
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-5 text-slate-400">
            Sin leads en esta sección.
          </div>
        ) : (
          items.slice(0, 14).map((l) => {
            const next = pillNext(l.proximaAccion, l.proximaAccionEn);

            return (
              <button
                key={l.id}
                onClick={() => router.push(`/leads/${l.id}`)}
                className="w-full text-left rounded-2xl bg-slate-900/60 border border-slate-800 px-4 py-3 hover:border-emerald-500/40 transition"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-white font-extrabold text-base">
                      #{l.id} · {l.nombre}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={next.className}>{next.text}</span>
                      <span className={pillEstado(l.estado)}>{String(l.estado || "pendiente").toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="text-slate-300 text-sm">
                    {l.email} · {l.telefono}
                  </div>

                  <div className="text-slate-400 text-sm">
                    Próxima: <span className="font-bold text-slate-200">{l.proximaAccion || "—"}</span> ·{" "}
                    <span className="font-bold text-slate-200">{fmt(l.proximaAccionEn)}</span>
                  </div>

                  <div className="text-slate-500 text-xs">
                    Agente: {l.agente?.nombre || "—"} · Lugar: {l.lugar?.nombre || "—"} · Creado: {fmt(l.creadoEn)}
                  </div>

                  {/* Botones PRO */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        ejecutarAccion(l, "llamada");
                      }}
                      className="px-3 py-1.5 rounded-full bg-blue-900/35 border border-blue-500/40 text-blue-100 text-xs font-extrabold hover:bg-blue-900/45"
                    >
                      📞 Llamar + programar
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        ejecutarAccion(l, "whatsapp");
                      }}
                      className="px-3 py-1.5 rounded-full bg-emerald-600/15 border border-emerald-400 text-emerald-100 text-xs font-extrabold hover:bg-emerald-600/25"
                    >
                      💬 WhatsApp + programar
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/leads/${l.id}`);
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-extrabold hover:border-emerald-400"
                    >
                      ⚡ Abrir lead
                    </button>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {items.length > 14 && (
        <div className="mt-3 text-xs text-slate-500 font-semibold">
          Mostrando 14 de {items.length}. (Luego añadimos paginación si quieres)
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {toast && (
        <div className="fixed z-50 bottom-6 right-6 rounded-2xl bg-emerald-900/35 border border-emerald-500/40 text-emerald-100 px-4 py-3 font-semibold shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Lead Center PRO</h1>
          <p className="text-slate-300 mt-1">Tareas, métricas y seguimiento comercial.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono, agente, lugar…"
            className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 font-bold outline-none focus:border-emerald-400 w-[320px] max-w-full"
          />

          <select
            value={rango}
            onChange={(e) => setRango(e.target.value as any)}
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
        <Card title="🔥 Vencidas" items={vencidasF} />
        <Card title="📅 Para hoy" items={hoyF} />
        <Card title="🧠 Pendientes" items={pendientesF} />
      </div>
    </div>
  );
}
