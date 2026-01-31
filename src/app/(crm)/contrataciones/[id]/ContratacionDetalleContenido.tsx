"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type Estado = "BORRADOR" | "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

function money(n: any) {
  const v = typeof n === "string" ? Number(n) : Number(n ?? 0);
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);
}

export default function ContratacionDetalleContenido() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  const id = useMemo(() => Number((params as any)?.id ?? 0), [params]);
  const role = String((session?.user as any)?.role ?? "").toUpperCase();
  const puedeConfirmar = role === "ADMIN" || role === "SUPERADMIN";

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [calc, setCalc] = useState<any>(null);
  const [busyCalc, setBusyCalc] = useState(false);
  const [busyAsentar, setBusyAsentar] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/crm/contrataciones/${id}`, { cache: "no-store" });
      const txt = await r.text();
      let j: any = null;
      try { j = JSON.parse(txt); } catch {}

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
    setBusyCalc(true);
    try {
      const res = await fetch(`/api/crm/comisiones/calcular?contratacionId=${id}`, { cache: "no-store" });
      const txt = await res.text();
      let data: any = null;
      try { data = JSON.parse(txt); } catch {}

      if (!res.ok || !data?.ok) throw new Error(data?.error || `Error comisiones (${res.status})`);
      setCalc(data);
      if (data?.warning) toast.message(data.warning);
      toast.success("Comisiones calculadas");
    } finally {
      setBusyCalc(false);
    }
  }

  async function asentarComisiones() {
    setBusyAsentar(true);
    try {
      const res = await fetch(`/api/crm/comisiones/asentar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contratacionId: id }),
      });

      const txt = await res.text();
      let data: any = null;
      try { data = JSON.parse(txt); } catch {}

      if (!res.ok || !data?.ok) throw new Error(data?.error || `Error asentar (${res.status})`);
      if (data?.already) toast.message("Ya estaba asentada ✅");
      else toast.success("Asiento creado ✅");

      // opcional: recargar para futuros campos
      await load();
    } finally {
      setBusyAsentar(false);
    }
  }

  useEffect(() => {
    if (status === "loading") return;
    if (!id) return;
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status]);

  if (status === "loading") return <div className="p-6 text-white/80">Cargando sesión…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;

  if (loading) return <div className="p-6 text-white/80">Cargando…</div>;
  if (!item) return <div className="p-6 text-white/80">No encontrada.</div>;

  const puedeAsentar = String(item.estado) === "CONFIRMADA" && !!calc && (calc?.comisiones?.total ?? 0) >= 0;

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

          {item.estado === "BORRADOR" && (
            <button
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-extrabold"
              onClick={async () => {
                try { await cambiarEstado("PENDIENTE"); toast.success("Enviada"); }
                catch (e: any) { toast.error(e?.message || "Error"); }
              }}
            >
              Enviar
            </button>
          )}

          {puedeConfirmar && item.estado === "PENDIENTE" && (
            <button
              className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
              onClick={async () => {
                try { await cambiarEstado("CONFIRMADA"); toast.success("Confirmada ✅"); }
                catch (e: any) { toast.error(e?.message || "Error"); }
              }}
            >
              Confirmar
            </button>
          )}
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
            <div className="text-white font-extrabold">{money(item.baseImponible)}</div>
          </div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3">
            <div className="text-white/60 text-sm font-bold uppercase">Total factura</div>
            <div className="text-white font-extrabold">{money(item.totalFactura)}</div>
          </div>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3">
            <div className="text-white/60 text-sm font-bold uppercase">Cliente</div>
            <div className="text-white font-extrabold">
              {item?.cliente ? `#${item.cliente.id} — ${item.cliente.nombre ?? "Cliente"}` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* COMISIONES */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="text-white font-extrabold text-lg">Comisiones</div>

          <div className="md:ml-auto flex gap-2">
            <button
              className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-[13px] font-extrabold text-white disabled:opacity-50"
              disabled={busyCalc}
              onClick={async () => {
                try { await calcularComisiones(); }
                catch (e: any) { toast.error(e?.message || "Error"); }
              }}
            >
              {busyCalc ? "Calculando…" : "Calcular comisiones"}
            </button>

            <button
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-[13px] font-extrabold text-slate-950 disabled:opacity-50"
              disabled={!puedeAsentar || busyAsentar}
              onClick={async () => {
                try { await asentarComisiones(); }
                catch (e: any) { toast.error(e?.message || "Error"); }
              }}
              title={!puedeAsentar ? "Calcula primero y requiere CONFIRMADA" : ""}
            >
              {busyAsentar ? "Asentando…" : "Asentar"}
            </button>
          </div>
        </div>

        {!calc ? (
          <div className="text-white/70 mt-2">Pulsa “Calcular comisiones” para ver el desglose.</div>
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
              <div className="text-white/60 text-sm font-bold uppercase">Empresa (Admin)</div>
              <div className="text-white font-extrabold">{money(calc.comisiones?.admin)}</div>

              {calc?.regla?.id ? (
                <div className="text-white/60 mt-2 text-sm">
                  Regla #{calc.regla.id} · Tipo: <b className="text-white">{String(calc.regla.tipo)}</b>
                </div>
              ) : null}

              {calc.warning ? <div className="text-orange-200 mt-2 font-bold">{calc.warning}</div> : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
