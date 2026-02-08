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
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(v);
}

export default function ContratacionDetalleContenido() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const id = useMemo(() => Number((params as any)?.id ?? 0), [params]);

  const role = String((session?.user as any)?.role ?? "").toUpperCase();
  const puedeGestionar = role === "ADMIN" || role === "SUPERADMIN";

  // ✅ SUPERADMIN modo supervisión (si viene adminId por query)
  const adminIdQs = searchParams.get("adminId");
  const qs = adminIdQs ? `?adminId=${encodeURIComponent(adminIdQs)}` : "";

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [calc, setCalc] = useState<any>(null);

  const [asiento, setAsiento] = useState<any>(null);
  const [asentando, setAsentando] = useState(false);
  const [openAsiento, setOpenAsiento] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/crm/contrataciones/${id}${qs}`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Error cargando");
      setItem(j.item);
    } catch (e: any) {
      toast.error(e?.message || "Error cargando contratación");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadAsiento() {
    try {
      const r = await fetch(
        `/api/crm/comisiones/asientos?contratacionId=${id}${
          adminIdQs ? `&adminId=${encodeURIComponent(adminIdQs)}` : ""
        }`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (!r.ok || !j?.ok) return;
      setAsiento(j.asiento ?? null);
    } catch {
      // silencioso
    }
  }

  async function cambiarEstado(estado: Estado) {
    const res = await fetch(`/api/crm/contrataciones/${id}/estado${qs}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });

    const data = await res.json();
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "Error cambiando estado");
    }

    setItem((prev: any) => ({ ...(prev || {}), ...data.contratacion }));
  }

  async function calcularComisiones() {
    // ✅ IMPORTANTE: añade qs para SUPERADMIN (modo supervisión)
    const res = await fetch(
      `/api/crm/comisiones/calcular?contratacionId=${id}${
        adminIdQs ? `&adminId=${encodeURIComponent(adminIdQs)}` : ""
      }`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "Error cálculo");
    }
    setCalc(data);
  }

  async function asentarComision() {
    setAsentando(true);
    try {
      // ✅ IMPORTANTE: añade qs para SUPERADMIN (modo supervisión)
      const res = await fetch(`/api/crm/comisiones/asentar${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contratacionId: id }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Error asentar");

      toast.success("Asiento creado ✅");
      setAsiento(data.asiento ?? null);
      await loadAsiento();
    } catch (e: any) {
      toast.error(e?.message || "Error asentando");
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

  if (status === "loading")
    return <div className="p-6 text-white">Cargando sesión…</div>;
  if (!session)
    return <div className="p-6 text-white">No autenticado.</div>;
  if (loading)
    return <div className="p-6 text-white">Cargando…</div>;
  if (!item)
    return <div className="p-6 text-white">No encontrada.</div>;

  // ✅ botones según estado
  const puedePasarAPendiente = puedeGestionar && item.estado === "BORRADOR";
  const puedeConfirmar = puedeGestionar && item.estado === "PENDIENTE";
  const puedeAsentar = puedeGestionar && item.estado === "CONFIRMADA";

  return (
    <div className="p-6">
      {/* BOTONES SUPERIORES */}
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

        {/* BORRADOR -> PENDIENTE */}
        {puedePasarAPendiente && (
          <button
            onClick={async () => {
              try {
                await cambiarEstado("PENDIENTE");
                toast.success("Enviada a PENDIENTE ✅");
                await load();
              } catch (e: any) {
                toast.error(e?.message || "Error");
              }
            }}
            className="ml-auto px-3 py-2 bg-sky-500 rounded-lg font-bold text-black"
          >
            Enviar a pendiente
          </button>
        )}

        {/* PENDIENTE -> CONFIRMADA */}
        {puedeConfirmar && (
          <button
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
            className="ml-auto px-3 py-2 bg-emerald-500 rounded-lg font-bold text-black"
          >
            Confirmar
          </button>
        )}
      </div>

      {/* CARD INFO */}
      <div className="rounded-xl border border-white/10 p-5 bg-white/5">
        <div className="text-white font-extrabold text-xl">
          Contratación #{item.id}
        </div>

        <div className="mt-3 text-white/70">
          Estado: <b className="text-white">{item.estado}</b>
        </div>

        <div className="mt-2 text-white/70 text-sm">
          Base imponible:{" "}
          <b className="text-white">
            {money(item.baseImponible ?? item.baseEUR ?? 0)}
          </b>
        </div>
      </div>

      {/* ASIENTO REAL (Fase 3, pero lo dejamos visible) */}
      <div className="mt-4 rounded-xl border border-white/10 p-5 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="text-white font-extrabold">Asiento real</div>

          {puedeAsentar && (
            <button
              onClick={asentarComision}
              disabled={asentando}
              className="ml-auto px-3 py-2 bg-emerald-500 rounded-lg font-bold text-black disabled:opacity-60"
            >
              {asentando ? "Asentando..." : "Asentar comisión"}
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

      {/* PREVIEW (Fase 2) */}
      <div className="mt-4 rounded-xl border border-white/10 p-5 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="text-white font-extrabold">Preview comisiones</div>

          <button
            onClick={async () => {
              try {
                await calcularComisiones();
                toast.success("Cálculo listo ✅");
              } catch (e: any) {
                toast.error(e?.message || "Error");
              }
            }}
            className="ml-auto px-3 py-2 bg-white/10 rounded-lg text-white font-bold"
          >
            Calcular
          </button>
        </div>

        {calc ? (
          <div className="mt-3 text-white">
            Total: <b>{money(calc.comisiones?.total)}</b>
          </div>
        ) : (
          <div className="mt-2 text-white/60 text-sm">
            Pulsa “Calcular” para ver el preview.
          </div>
        )}
      </div>

      {/* MODAL ASIENTO */}
      <AsientoModal
        contratacionId={id}
        open={openAsiento}
        onClose={() => setOpenAsiento(false)}
        onAnulado={() => loadAsiento()}
      />
    </div>
  );
}
