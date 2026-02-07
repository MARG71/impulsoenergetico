"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

function money(v: any) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

type Row = { id: number; nombre: string; asientos: number; total: number; agente: number; lugar: number; admin: number; especial?: boolean };

export default function ComisionesInformeContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const can = role === "SUPERADMIN" || role === "ADMIN";

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const [loading, setLoading] = useState(false);
  const [agentes, setAgentes] = useState<Row[]>([]);
  const [lugares, setLugares] = useState<Row[]>([]);

  useEffect(() => {
    // por defecto último mes
    if (!desde && !hasta) {
      const now = new Date();
      const d1 = new Date(now);
      d1.setDate(now.getDate() - 30);
      setDesde(d1.toISOString().slice(0, 10));
      setHasta(now.toISOString().slice(0, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    if (!desde || !hasta) return toast.error("Elige desde y hasta");
    setLoading(true);
    try {
      const qs = new URLSearchParams({ desde, hasta });
      const res = await fetch(`/api/crm/comisiones/informe?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Error cargando informe");

      setAgentes(Array.isArray(json?.agentes) ? json.agentes : []);
      setLugares(Array.isArray(json?.lugares) ? json.lugares : []);
    } catch (e: any) {
      toast.error(String(e?.message || e));
      setAgentes([]);
      setLugares([]);
    } finally {
      setLoading(false);
    }
  }

  const topAgentes = useMemo(() => agentes.slice(0, 50), [agentes]);
  const topLugares = useMemo(() => lugares.slice(0, 50), [lugares]);

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;

  if (!can) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white font-extrabold">Acceso no permitido</div>
          <p className="text-white/70 text-sm mt-2">Solo ADMIN/SUPERADMIN.</p>
          <Link href="/comisiones" className="inline-block mt-4 text-emerald-300 font-extrabold">
            ← Volver a Comisiones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-end justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Informe comisiones</h1>
          <p className="text-white/70">Totales por agente y lugar en un periodo.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            type="date"
            className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
          <input
            type="date"
            className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
          <button
            onClick={load}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-[13px] font-extrabold text-slate-950"
          >
            Generar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/10 text-white font-extrabold">Agentes (Top 50)</div>
          {loading ? (
            <div className="p-4 text-white/70">Cargando…</div>
          ) : topAgentes.length === 0 ? (
            <div className="p-4 text-white/70">Sin datos.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {topAgentes.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-extrabold">{a.nombre}</div>
                    <div className="text-white/60 text-xs">Asientos: {a.asientos}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-extrabold">{money(a.total)}</div>
                    <div className="text-emerald-200 text-xs font-bold">Pago agente: {money(a.agente)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/10 text-white font-extrabold">Lugares (Top 50)</div>
          {loading ? (
            <div className="p-4 text-white/70">Cargando…</div>
          ) : topLugares.length === 0 ? (
            <div className="p-4 text-white/70">Sin datos.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {topLugares.map((l) => (
                <div key={l.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-extrabold">
                      {l.nombre} {l.especial ? <span className="text-amber-200">· especial</span> : null}
                    </div>
                    <div className="text-white/60 text-xs">Asientos: {l.asientos}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-extrabold">{money(l.total)}</div>
                    <div className="text-amber-200 text-xs font-bold">Pago lugar: {money(l.lugar)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Link href="/comisiones" className="text-emerald-300 font-extrabold">← Volver a Comisiones</Link>
        <Link href="/comisiones-asientos" className="text-white/70 font-extrabold hover:text-white">Ir a Asientos →</Link>
        <Link href="/comisiones-liquidaciones" className="text-white/70 font-extrabold hover:text-white">Ir a Liquidaciones →</Link>
      </div>
    </div>
  );
}
