//src/app/(crm)/contrataciones/_components/AsientoModal.tsx
// src/app/(crm)/contrataciones/_components/AsientoModal.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

type Asiento = any;
type Movimiento = any;

function money(v: any) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function AsientoModal({
  contratacionId,
  open,
  onClose,
  onAnulado,
}: {
  contratacionId: number;
  open: boolean;
  onClose: () => void;
  onAnulado?: () => void;
}) {
  const sp = useSearchParams();
  const adminIdQs = sp.get("adminId");
  const adminQuery = adminIdQs ? `&adminId=${adminIdQs}` : "";
  const adminBody = adminIdQs ? { adminId: Number(adminIdQs) } : {};

  const [loading, setLoading] = useState(false);
  const [asiento, setAsiento] = useState<Asiento | null>(null);
  const [movs, setMovs] = useState<Movimiento[]>([]);
  const [motivo, setMotivo] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/crm/comisiones/asientos/por-contratacion?contratacionId=${contratacionId}${adminQuery}`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Error cargando asiento");
      setAsiento(json?.asiento ?? null);
      setMovs(Array.isArray(json?.movimientos) ? json.movimientos : []);
    } catch (e: any) {
      toast.error(String(e?.message || e));
      setAsiento(null);
      setMovs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, adminIdQs]);

  async function anular() {
    if (!asiento?.id) return;
    if (!motivo.trim()) return toast.error("Escribe un motivo de anulación");

    const res = await fetch(`/api/crm/comisiones/asientos/anular${adminIdQs ? `?adminId=${adminIdQs}` : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asientoId: asiento.id, motivo: motivo.trim(), ...adminBody }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.ok === false) return toast.error(json?.error || "No se pudo anular");

    toast.success("Asiento anulado");
    setMotivo("");
    await load();
    onAnulado?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-extrabold">
            Asiento de comisión · Contratación #{contratacionId}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-extrabold text-sm"
          >
            Cerrar
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-white/70">Cargando…</div>
          ) : !asiento ? (
            <div className="text-white/70">No hay asiento todavía.</div>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-white font-extrabold">Asiento #{asiento.id}</span>
                  <span className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white/80 font-bold">
                    {String(asiento.estado)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white/80 font-bold">
                    Nivel: {String(asiento.nivel)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="text-white/80">Base: <b className="text-white">{money(asiento.baseEUR)}</b></div>
                  <div className="text-white/80">Total comisión: <b className="text-white">{money(asiento.totalComision)}</b></div>
                  <div className="text-white/80">Agente: <b className="text-emerald-200">{money(asiento.agenteEUR)}</b></div>
                  <div className="text-white/80">Lugar: <b className="text-amber-200">{money(asiento.lugarEUR)}</b></div>
                  <div className="text-white/80">Admin: <b className="text-sky-200">{money(asiento.adminEUR)}</b></div>
                  <div className="text-white/50">Creado: {new Date(asiento.creadoEn).toLocaleString("es-ES")}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-white font-extrabold mb-2">Movimientos</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  {movs.length === 0 ? (
                    <div className="p-4 text-white/70">Sin movimientos.</div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {movs.map((m: any) => (
                        <div key={m.id} className="p-4 flex items-center justify-between">
                          <div className="text-white/80 font-bold">
                            {String(m.receptorTipo)} · ID {m.receptorId ?? "—"}
                          </div>
                          <div className="text-white font-extrabold">{money(m.importeEUR)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                <div className="text-red-200 font-extrabold">Anular asiento</div>
                <p className="text-red-200/70 text-sm mt-1">
                  Esto deja el asiento como ANULADO y lo excluye de informes/liquidaciones.
                </p>
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                    placeholder="Motivo de anulación…"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <button
                    onClick={anular}
                    disabled={String(asiento.estado) === "ANULADO"}
                    className="rounded-xl px-4 py-2 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-slate-950 font-extrabold"
                  >
                    Anular
                  </button>
                </div>

                {String(asiento.estado) === "ANULADO" ? (
                  <div className="mt-3 text-red-200/70 text-sm">
                    Anulado en:{" "}
                    {asiento.anuladoEn ? new Date(asiento.anuladoEn).toLocaleString("es-ES") : "—"}
                    {" · "}
                    Motivo: {asiento.anuladoMotivo ?? "—"}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
