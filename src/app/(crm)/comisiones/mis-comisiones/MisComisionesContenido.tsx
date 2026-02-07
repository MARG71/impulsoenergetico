// src/app/(crm)/mis-comisiones/MisComisionesContenido.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

type Row = {
  id: number;
  creadoEn: string;
  estado: string;
  nivel: string;
  seccionNombre?: string | null;
  subSeccionNombre?: string | null;
  baseEUR: number;
  totalComision: number;
  adminEUR: number;
  agenteEUR: number;
  lugarEUR: number;
  contratacionId: number;
};

function money(v: any) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function MisComisionesContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const sp = useSearchParams();
  const adminIdQs = sp.get("adminId");
  const qs = adminIdQs ? `?adminId=${adminIdQs}` : "";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [estado, setEstado] = useState<"TODOS" | "ACTIVO" | "ANULADO">("ACTIVO");
  const [periodo, setPeriodo] = useState<"30" | "90" | "365" | "ALL">("90");

  const label =
    role === "SUPERADMIN" ? "Vista global (supervisión)"
    : role === "ADMIN" ? "Mis comisiones (Admin)"
    : role === "AGENTE" ? "Mis comisiones (Agente)"
    : role === "LUGAR" ? "Mis comisiones (Lugar)"
    : "Mis comisiones";

  async function load() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.set("estado", estado);
      p.set("periodo", periodo);
      if (adminIdQs) p.set("adminId", adminIdQs);

      const res = await fetch(`/api/crm/comisiones/mis-comisiones?${p.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Error cargando comisiones");

      setRows(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      toast.error(String(e?.message || e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "loading" && session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, estado, periodo, adminIdQs]);

  const totals = useMemo(() => {
    const t = {
      base: 0,
      total: 0,
      admin: 0,
      agente: 0,
      lugar: 0,
    };
    for (const r of rows) {
      t.base += Number(r.baseEUR ?? 0);
      t.total += Number(r.totalComision ?? 0);
      t.admin += Number(r.adminEUR ?? 0);
      t.agente += Number(r.agenteEUR ?? 0);
      t.lugar += Number(r.lugarEUR ?? 0);
    }
    return t;
  }, [rows]);

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">{label}</h1>
        <p className="text-white/70">
          Histórico y totales por periodo. Se alimenta de los asientos creados al confirmar/asentar.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <select
              className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
            >
              <option value="ACTIVO">Activos</option>
              <option value="ANULADO">Anulados</option>
              <option value="TODOS">Todos</option>
            </select>

            <select
              className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as any)}
            >
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="365">Último año</option>
              <option value="ALL">Todo</option>
            </select>
          </div>

          <div className="text-white/80 font-extrabold">
            Total: <span className="text-emerald-200">{money(totals.total)}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-white/80">
            Base: <b className="text-white">{money(totals.base)}</b>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-white/80">
            Admin: <b className="text-sky-200">{money(totals.admin)}</b>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-white/80">
            Agente: <b className="text-emerald-200">{money(totals.agente)}</b>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-white/80">
            Lugar: <b className="text-amber-200">{money(totals.lugar)}</b>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 text-white font-extrabold">
          Movimientos ({rows.length})
        </div>

        {loading ? (
          <div className="p-5 text-white/70">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="p-5 text-white/70">No hay comisiones en este periodo.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {rows.map((r) => (
              <div key={r.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-white font-extrabold">
                    #{r.id} · {r.seccionNombre ?? "Sección"}
                    {r.subSeccionNombre ? ` / ${r.subSeccionNombre}` : ""} · {r.nivel}
                  </div>
                  <div className="text-white/60 text-sm mt-1">
                    {new Date(r.creadoEn).toLocaleString("es-ES")} · Estado: <b className="text-white">{r.estado}</b>
                    {" · "}
                    Contratación #{r.contratacionId}
                  </div>
                  <div className="text-white/70 text-sm mt-1">
                    Base: <b className="text-white">{money(r.baseEUR)}</b>{" · "}
                    Total: <b className="text-emerald-200">{money(r.totalComision)}</b>
                    {" · "}
                    Admin {money(r.adminEUR)} / Agente {money(r.agenteEUR)} / Lugar {money(r.lugarEUR)}
                  </div>
                </div>

                <Link
                  href={`/contrataciones/${r.contratacionId}${qs}`}
                  className="inline-flex justify-center rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-[13px] font-extrabold text-white transition"
                >
                  Ver contratación
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/contrataciones${qs}`}
          className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-[13px] font-extrabold text-white transition"
        >
          Ir a Contrataciones
        </Link>
        <Link
          href={`/comisiones${qs}`}
          className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-extrabold text-slate-950 transition"
        >
          Volver a Comisiones
        </Link>
      </div>
    </div>
  );
}
