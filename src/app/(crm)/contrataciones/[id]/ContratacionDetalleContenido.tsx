"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type Estado = "BORRADOR" | "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

function money(n: any) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);
}

export default function ContratacionDetalleContenido() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();

  const id = useMemo(() => Number((params as any)?.id ?? 0), [params]);
  const role = String((session?.user as any)?.role ?? "").toUpperCase();
  const puedeConfirmar = role === "ADMIN" || role === "SUPERADMIN";

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [calc, setCalc] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      // Si tienes /api/crm/contrataciones/[id] úsalo (mejor)
      const r = await fetch(`/api/crm/contrataciones/${id}`, { cache: "no-store" });
      const t = await r.text();
      let j: any = null;
      try { j = JSON.parse(t); } catch {}

      if (!r.ok || !j?.ok) throw new Error(j?.error || "Error cargando contratación");
      setItem(j.item);
    } catch (e: any) {
      toast.error(String(e?.message || e));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function cambiarEstado(estado: Estado) {
    const res = await fetch(`/api/crm/contrataciones/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });

    const txt = await res.text();
    let data: any = null;
    try { data = JSON.parse(txt); } catch {}

    if (!res.ok || !data?.ok) throw new Error(data?.error || `Error estado (${res.status})`);
    setItem((prev: any) => ({ ...(prev || {}), ...data.contratacion }));
    return data.contratacion;
  }

  async function calcularComisiones() {
    const res = await fetch(`/api/crm/comisiones/calcular?contratacionId=${id}`, { cache: "no-store" });
    const txt = await res.text();
    let data: any = null;
    try { data = JSON.parse(txt); } catch {}

    if (!res.ok || !data?.ok) throw new Error(data?.error || `Error comisiones (${res.status})`);
    setCalc(data);
    if (data?.warning) toast.message(data.warning);
  }

  useEffect(() => {
    if (!id) return;
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="p-6 text-white/80">Cargando…</div>;
  if (!item) return <div className="p-6 text-white/80">No encontrada.</div>;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <button
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-extrabold"
          onClick={() => router.back()}
        >
          ← Volver
        </button>

        <div className="ml-auto flex gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-extrabold"
            onClick={async () => {
              try { await cambiarEstado("CANCELADA"); toast.success("Cancelada"); }
              catch (e: any) { toast.error(e?.message || "Error"); }
            }}
          >
            Cancelar
          </button>

          <button
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-extrabold"
            onClick={async () => {
              try { await cambiarEstado("PENDIENTE"); toast.success("Enviada"); }
              catch (e: any) { toast.error(e?.message || "Error"); }
            }}
          >
            Enviar
          </button>

          <button
            className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
            disabled={!puedeConfirmar}
            onClick={async () => {
              try { await cambiarEstado("CONFIRMADA"); toast.success("Confirmada ✅"); }
              catch (e: any) { toast.error(e?.message || "Error"); }
            }}
            title={!puedeConfirmar ? "Solo ADMIN/SUPERADMIN" : ""}
          >
            Confirmar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-white text-xl font-extrabold">
          Contratación #{item.id} — {item?.seccion?.nombre ?? "—"}
        </div>

        <div className="text-white/70 mt-1">
          Estado: <b className="text-white">{item.estado}</b> · Nivel: <b className="text-white">{item.nivel}</b>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div className="rounded-xl bg-black/30 border border-white/10 p-3">
            <div className="text-white/60 text-sm font-bold uppercase">Base imponible</div>
            <div className="text-white font-extrabold">{item.baseImponible ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3">
            <div className="text-white/60 text-sm font-bold uppercase">Total factura</div>
            <div className="text-white font-extrabold">{item.totalFactura ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3">
            <div className="text-white/60 text-sm font-bold uppercase">Cliente</div>
            <div className="text-white font-extrabold">
              {item?.cliente ? `#${item.cliente.id} — ${item.cliente.nombre ?? "Cliente"}` : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2">
          <div className="text-white font-extrabold text-lg">Comisiones</div>
          <button
            className="ml-auto rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-[13px] font-extrabold text-white"
            onClick={async () => {
              try { await calcularComisiones(); toast.success("Comisiones calculadas"); }
              catch (e: any) { toast.error(e?.message || "Error"); }
            }}
          >
            Calcular
          </button>
        </div>

        {!calc ? (
          <div className="text-white/70 mt-2">Pulsa “Calcular” para ver el desglose.</div>
        ) : (
          <div className="mt-3 grid md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-white/60 text-sm font-bold uppercase">Base usada</div>
              <div className="text-white font-extrabold">{money(calc.base)}</div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-white/60 text-sm font-bold uppercase">Total</div>
              <div className="text-white font-extrabold">{money(calc.comisiones?.total)}</div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-white/60 text-sm font-bold uppercase">Agente</div>
              <div className="text-white font-extrabold">{money(calc.comisiones?.agente)}</div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-white/60 text-sm font-bold uppercase">Lugar</div>
              <div className="text-white font-extrabold">{money(calc.comisiones?.lugar)}</div>
            </div>

            <div className="md:col-span-4 rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-white/60 text-sm font-bold uppercase">Admin / Empresa</div>
              <div className="text-white font-extrabold">{money(calc.comisiones?.admin)}</div>
              {calc.warning ? <div className="text-orange-200 mt-2 font-bold">{calc.warning}</div> : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
