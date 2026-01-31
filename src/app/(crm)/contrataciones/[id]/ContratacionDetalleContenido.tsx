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
  const { data: session, status } = useSession();

  const id = useMemo(() => Number((params as any)?.id ?? 0), [params]);
  const role = String((session?.user as any)?.role ?? "").toUpperCase();
  const puedeConfirmar = role === "ADMIN" || role === "SUPERADMIN";

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);

  // preview
  const [calc, setCalc] = useState<any>(null);

  // asiento real
  const [asiento, setAsiento] = useState<any>(null);
  const [asentando, setAsentando] = useState(false);

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

  async function loadAsiento() {
    try {
      const r = await fetch(`/api/crm/comisiones/asientos?contratacionId=${id}`, { cache: "no-store" });
      const txt = await r.text();
      let j: any = null;
      try { j = JSON.parse(txt); } catch {}
      if (!r.ok || !j?.ok) return;
      setAsiento(j.asiento ?? null);
    } catch {
      // silencio
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

  async function asentarComision() {
    setAsentando(true);
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

      toast.success(data?.duplicated ? "Ya existía asiento (ok)" : "Asiento creado ✅");
      setAsiento(data.asiento ?? null);
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setAsentando(false);
    }
  }

  useEffect(() => {
    if (status === "loading") return;
    if (!id) return;
    load().catch(() => {});
    loadAsiento().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status]);

  if (status === "loading") return <div className="p-6 text-white/80">Cargando sesión…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;

  if (loading) return <div className="p-6 text-white/80">Cargando…</div>;
  if (!item) return <div className="p-6 text-white/80">No encontrada.</div>;

  const puedeAsentar = puedeConfirmar && item.estado === "CONFIRMADA";

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-extrabold"
          onClick={() => router.back()}
        >
          ← Volver
        </button>

        <div className="ml-auto flex flex-wrap gap-2">
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
                try {
                  await cambiarEstado("CONFIRMADA");
                  toast.success("Confirmada ✅");
                  await load();
                  await loadAsiento();
                } catch (e: any) {
                  toast.error(e?.message || "Error");
                }
              }}
            >
              Confirmar
            </button>
          )}
        </div>
      </div>

      {/* Card contratación */}
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

      {/* ASIENTO REAL */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-white font-extrabold text-lg">Asiento real (BD)</div>

          <div className="ml-auto flex gap-2">
            {puedeAsentar && (
              <button
                disabled={asentando}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-4 py-2 text-[13px] font-extrabold text-slate-950 transition"
                onClick={asentarComision}
              >
                {asentando ? "Asentando…" : "Asentar comisión"}
              </button>
            )}
            <button
              className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-[13px] font-extrabold text-white"
              onClick={loadAsiento}
            >
              Refrescar
            </button>
          </div>
        </div>

        {!asiento ? (
          <div className="text-white/70 mt-2">
            No hay asiento todavía.
            {item.estado !== "CONFIRMADA" ? (
              <div className="text-white/50 mt-1">
                (Para asentar, primero confirma la contratación.)
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 grid md:grid-cols-5 gap-3">
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-white/60 text-sm font-bold uppercase">Base</div>
              <div className="text-white font-extrabold">{money(asiento.baseEUR)}</div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-white/60 text-sm font-bold uppercase">Total</div>
              <div className="text-white font-extrabold">{money(asiento.totalComision)}</div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-white/60 text-sm font-bold uppercase">Agente</div>
              <div className="text-white font-extrabold">{money(asiento.agenteEUR)}</div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-white/60 text-sm font-bold uppercase">Lugar</div>
              <div className="text-white font-extrabold">{money(asiento.lugarEUR)}</div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-white/60 text-sm font-bold uppercase">Empresa</div>
              <div className="text-white font-extrabold">{money(asiento.adminEUR)}</div>
            </div>

            <div className="md:col-span-5 text-white/60 text-sm">
              Estado asiento: <b className="text-white">{String(asiento.estado ?? "—")}</b>
              {" · "}
              Creado: <b className="text-white">{String(asiento.creadoEn ?? "—")}</b>
            </div>
          </div>
        )}
      </div>

      {/* PREVIEW CALC */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2">
          <div className="text-white font-extrabold text-lg">Comisiones (preview)</div>

          <button
            className="ml-auto rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-[13px] font-extrabold text-white"
            onClick={async () => {
              try { await calcularComisiones(); toast.success("Comisiones calculadas"); }
              catch (e: any) { toast.error(e?.message || "Error"); }
            }}
          >
            Calcular comisiones
          </button>
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
              {calc.warning ? <div className="text-orange-200 mt-2 font-bold">{calc.warning}</div> : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
