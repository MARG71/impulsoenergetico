"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

type Asiento = {
  id: number;
  creadoEn: string;
  estado: "PENDIENTE" | "LIQUIDADO" | "ANULADO";
  contratacionId: number;

  seccionId: number;
  subSeccionId: number | null;
  nivel: "C1" | "C2" | "C3" | "ESPECIAL";

  baseEUR: string;
  totalComision: string;
  agenteEUR: string;
  lugarEUR: string;
  adminEUR: string;

  agenteId?: number | null;
  lugarId?: number | null;

  seccion?: { nombre: string } | null;
  subSeccion?: { nombre: string } | null;
  agente?: { nombre: string } | null;
  lugar?: { nombre: string; especial?: boolean } | null;
  cliente?: { nombre: string } | null;
  lead?: { nombre: string } | null;
};

function money(v: any) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

function pillEstado(e: string) {
  if (e === "LIQUIDADO") return "bg-emerald-400/15 text-emerald-200 border-emerald-400/20";
  if (e === "ANULADO") return "bg-red-400/15 text-red-200 border-red-400/20";
  return "bg-orange-400/15 text-orange-200 border-orange-400/20";
}

export default function ComisionesAsientosContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Asiento[]>([]);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"TODOS" | Asiento["estado"]>("TODOS");

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      if (estado !== "TODOS") qs.set("estado", estado);

      const res = await fetch(`/api/crm/comisiones/asientos?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Error cargando asientos");

      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setItems([]);
      toast.error(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "loading" && session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const canSee = role === "SUPERADMIN" || role === "ADMIN";

  const filtered = useMemo(() => items, [items]);

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;

  if (!canSee) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white font-extrabold">Acceso no permitido</div>
          <p className="text-white/70 text-sm mt-2">Solo ADMIN/SUPERADMIN puede ver el histórico de comisiones.</p>
          <Link href="/comisiones" className="inline-block mt-4 text-emerald-300 font-extrabold">
            ← Volver a Comisiones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Histórico de comisiones (Asientos)</h1>
          <p className="text-white/70">Se genera automáticamente al confirmar una contratación.</p>
        </div>

        <div className="flex gap-2">
          <input
            className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold w-[260px]"
            placeholder="Buscar (id, agente, lugar, cliente…) "
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
          />
          <select
            className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
            value={estado}
            onChange={(e) => setEstado(e.target.value as any)}
          >
            <option value="TODOS">Todos</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="LIQUIDADO">LIQUIDADO</option>
            <option value="ANULADO">ANULADO</option>
          </select>
          <button
            onClick={load}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-[13px] font-extrabold text-slate-950"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {loading ? (
          <div className="p-5 text-white/70">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-white/70">No hay asientos todavía.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {filtered.map((a) => (
              <div key={a.id} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <div className="text-white font-extrabold">
                        #{a.id} · Contratación #{a.contratacionId}
                      </div>

                      <span className={`text-xs px-2 py-1 rounded-lg border font-bold ${pillEstado(a.estado)}`}>
                        {a.estado}
                      </span>

                      <span className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white/80 font-bold">
                        {a.nivel}
                      </span>

                      <span className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white/80 font-bold">
                        {a.seccion?.nombre ?? `Sección ${a.seccionId}`}
                        {a.subSeccion?.nombre ? ` / ${a.subSeccion.nombre}` : ""}
                      </span>
                    </div>

                    <div className="text-white/70 text-sm mt-2">
                      Base: <b className="text-white">{money(a.baseEUR)}</b>
                      {" · "}Total comisión: <b className="text-white">{money(a.totalComision)}</b>
                      {" · "}Agente: <b className="text-emerald-200">{money(a.agenteEUR)}</b>
                      {" · "}Lugar: <b className="text-amber-200">{money(a.lugarEUR)}</b>
                      {" · "}Admin: <b className="text-sky-200">{money(a.adminEUR)}</b>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {a.agente?.nombre ? (
                        <span className="px-2 py-1 rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 font-extrabold">
                          Agente: {a.agente.nombre}
                        </span>
                      ) : null}

                      {a.lugar?.nombre ? (
                        <span className="px-2 py-1 rounded-lg border border-amber-400/20 bg-amber-400/10 text-amber-200 font-extrabold">
                          Lugar: {a.lugar.nombre}{a.lugar.especial ? " (especial)" : ""}
                        </span>
                      ) : null}

                      {(a.cliente?.nombre || a.lead?.nombre) ? (
                        <span className="px-2 py-1 rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-200 font-extrabold">
                          Cliente: {a.cliente?.nombre ?? a.lead?.nombre}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-white/50 text-xs">
                    {new Date(a.creadoEn).toLocaleString("es-ES")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link href="/comisiones" className="text-emerald-300 font-extrabold">← Volver a Comisiones</Link>
      </div>
    </div>
  );
}
