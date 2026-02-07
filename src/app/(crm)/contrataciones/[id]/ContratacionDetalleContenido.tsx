// src/app/(crm)/contrataciones/[id]/ContratacionDetalleContenido.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import AsientoModal from "../_components/AsientoModal";

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

  const searchParams = useSearchParams();
  const adminIdQs = searchParams.get("adminId");
  const qs = adminIdQs ? `?adminId=${adminIdQs}` : "";
  const adminQuery = adminIdQs ? `&adminId=${adminIdQs}` : "";
  const adminBody = adminIdQs ? { adminId: Number(adminIdQs) } : {};

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [calc, setCalc] = useState<any>(null);
  const [asiento, setAsiento] = useState<any>(null);
  const [asentando, setAsentando] = useState(false);
  const [openAsiento, setOpenAsiento] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/crm/contrataciones/${id}${qs}`, { cache: "no-store" });
      const j = await r.json().catch(() => null);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "Error cargando");
      setItem(j.item);
    } catch (e: any) {
      toast.error(e?.message || "Error");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadAsiento() {
    try {
      const r = await fetch(
        `/api/crm/comisiones/asientos/por-contratacion?contratacionId=${id}${adminQuery}`,
        { cache: "no-store" }
      );
      const j = await r.json().catch(() => null);
      if (!r.ok || j?.ok === false) return;
      setAsiento(j.asiento ?? null);
    } catch {}
  }

  async function cambiarEstado(estado: Estado) {
    const res = await fetch(`/api/crm/contrataciones/${id}/estado${qs}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, ...adminBody }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || data?.ok === false) throw new Error(data?.error || "Error estado");

    setItem((prev: any) => ({ ...(prev || {}), ...data.contratacion }));
  }

  async function calcularComisiones() {
    const res = await fetch(`/api/crm/comisiones/calcular?contratacionId=${id}${adminQuery}`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.ok === false) throw new Error(data?.error || "Error cálculo");
    setCalc(data);
  }

  async function asentarComision() {
    setAsentando(true);
    try {
      const res = await fetch(`/api/crm/comisiones/asentar${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contratacionId: id, ...adminBody }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Error asentar");

      toast.success("Asiento creado ✅");
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
    load();
    loadAsiento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status, adminIdQs]);

  if (status === "loading") return <div className="p-6 text-white">Cargando sesión…</div>;
  if (!session) return <div className="p-6 text-white">No autenticado.</div>;
  if (loading) return <div className="p-6 text-white">Cargando…</div>;
  if (!item) return <div className="p-6 text-white">No encontrada.</div>;

  const puedeAsentar = puedeConfirmar && item.estado === "CONFIRMADA";

  return (
    <div className="p-6">
      {/* TOP */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.back()}
          className="px-3 py-2 bg-white/10 rounded-lg text-white font-bold"
        >
          ← Volver
        </button>

        <button
          onClick={() => setOpenAsiento(true)}
          className="px-3 py-2 bg-white/10 rounded-lg text-white font-bold"
        >
          Ver asiento
        </button>

        {puedeConfirmar && item.estado === "PENDIENTE" && (
          <button
            onClick={async () => {
              await cambiarEstado("CONFIRMADA");
              toast.success("Confirmada ✅");
              await load();
              await loadAsiento();
            }}
            className="ml-auto px-3 py-2 bg-emerald-500 rounded-lg font-bold text-black"
          >
            Confirmar
          </button>
        )}
      </div>

      {/* INFO */}
      <div className="rounded-xl border border-white/10 p-5 bg-white/5">
        <div className="text-white font-extrabold text-xl">Contratación #{item.id}</div>
        <div className="mt-3 text-white/70">
          Estado: <b className="text-white">{item.estado}</b>
        </div>
      </div>

      {/* ASIENTO */}
      <div className="mt-4 rounded-xl border border-white/10 p-5 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="text-white font-extrabold">Asiento real</div>

          {puedeAsentar && (
            <button
              onClick={asentarComision}
              disabled={asentando}
              className="ml-auto px-3 py-2 bg-emerald-500 rounded-lg font-bold text-black"
            >
              {asentando ? "Asentando..." : asiento ? "Re-asentar" : "Asentar comisión"}
            </button>
          )}
        </div>

        {!asiento ? (
          <div className="text-white/70 mt-2">No hay asiento todavía.</div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="text-white">Base: {money(asiento.baseEUR)}</div>
            <div className="text-white">Total: {money(asiento.totalComision)}</div>
            <div className="text-white">Agente: {money(asiento.agenteEUR)}</div>
            <div className="text-white">Lugar: {money(asiento.lugarEUR)}</div>
          </div>
        )}
      </div>

      {/* PREVIEW */}
      <div className="mt-4 rounded-xl border border-white/10 p-5 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="text-white font-extrabold">Preview comisiones</div>

          <button
            onClick={calcularComisiones}
            className="ml-auto px-3 py-2 bg-white/10 rounded-lg text-white font-bold"
          >
            Calcular
          </button>
        </div>

        {calc && (
          <div className="mt-3 text-white">
            Total: {money(calc.comisiones?.total)}
          </div>
        )}
      </div>

      {/* MODAL */}
      <AsientoModal
        contratacionId={id}
        open={openAsiento}
        onClose={() => setOpenAsiento(false)}
        onAnulado={() => loadAsiento()}
      />
    </div>
  );
}
