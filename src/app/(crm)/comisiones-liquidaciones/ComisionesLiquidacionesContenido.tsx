"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

type Liquidacion = {
  id: number;
  desde: string;
  hasta: string;
  estado: "ABIERTA" | "CERRADA";
  totalAgenteEUR: string;
  totalLugarEUR: string;
  totalAdminEUR: string;
  creadoEn: string;
};

function money(v: any) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function ComisionesLiquidacionesContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const [items, setItems] = useState<Liquidacion[]>([]);
  const [loading, setLoading] = useState(true);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const can = role === "SUPERADMIN" || role === "ADMIN";

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/comisiones/liquidaciones", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Error cargando liquidaciones");
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

  async function crear() {
    if (!desde || !hasta) return toast.error("Selecciona desde y hasta");
    const res = await fetch("/api/crm/comisiones/liquidaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desde, hasta }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.ok === false) return toast.error(json?.error || "No se pudo crear");
    toast.success("Liquidación creada");
    setDesde("");
    setHasta("");
    load();
  }

  async function addMovs(id: number) {
    const res = await fetch(`/api/crm/comisiones/liquidaciones/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ADD_MOVIMIENTOS" }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.ok === false) return toast.error(json?.error || "No se pudo añadir");
    toast.success(`Añadidos: ${json?.added ?? 0}`);
    load();
  }

  async function cerrar(id: number) {
    const res = await fetch(`/api/crm/comisiones/liquidaciones/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CERRAR" }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.ok === false) return toast.error(json?.error || "No se pudo cerrar");
    toast.success(`Cerrada. Asientos liquidados: ${json?.asientosLiquidados ?? 0}`);
    load();
  }

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
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Liquidaciones</h1>
          <p className="text-white/70">Agrupa movimientos por periodo y cierra para liquidar.</p>
        </div>
        <div className="flex gap-2">
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
            onClick={crear}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-[13px] font-extrabold text-slate-950"
          >
            Crear liquidación
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {loading ? (
          <div className="p-5 text-white/70">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-5 text-white/70">No hay liquidaciones.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {items.map((l) => (
              <div key={l.id} className="p-5 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-white font-extrabold">
                    #{l.id} · {l.estado} · {new Date(l.desde).toLocaleDateString("es-ES")} →{" "}
                    {new Date(l.hasta).toLocaleDateString("es-ES")}
                  </div>
                  <div className="text-white/70 text-sm mt-2">
                    Agente: <b className="text-emerald-200">{money(l.totalAgenteEUR)}</b>{" · "}
                    Lugar: <b className="text-amber-200">{money(l.totalLugarEUR)}</b>{" · "}
                    Admin: <b className="text-sky-200">{money(l.totalAdminEUR)}</b>
                  </div>
                </div>

                <div className="flex gap-2">
                  {l.estado === "ABIERTA" && (
                    <>
                      <button
                        onClick={() => addMovs(l.id)}
                        className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-sm font-extrabold text-white"
                      >
                        Añadir movimientos
                      </button>
                      <button
                        onClick={() => cerrar(l.id)}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-extrabold text-slate-950"
                      >
                        Cerrar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-4">
        <Link href="/comisiones" className="text-emerald-300 font-extrabold">← Volver a Comisiones</Link>
        <Link href="/comisiones-asientos" className="text-white/70 font-extrabold hover:text-white">Ir a Asientos →</Link>
      </div>
    </div>
  );
}
