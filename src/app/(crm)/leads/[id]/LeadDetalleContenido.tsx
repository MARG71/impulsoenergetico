"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type LeadDetalle = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado?: string | null;
  creadoEn?: string;

  notas?: string | null;
  proximaAccion?: string | null;
  proximaAccionEn?: string | null;

  agente?: { id: number; nombre: string | null } | null;
  lugar?: { id: number; nombre: string | null } | null;
};

const ESTADOS = ["pendiente", "contactado", "comparativa", "contrato", "cerrado", "perdido"];

export default function LeadDetalleContenido() {
  const params = useParams();
  const router = useRouter();
  const id = Number((params as any)?.id);

  const [lead, setLead] = useState<LeadDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // ✅ Campos edición
  const [estadoEdit, setEstadoEdit] = useState("pendiente");
  const [accionEdit, setAccionEdit] = useState("");
  const [accionEnEdit, setAccionEnEdit] = useState(""); // datetime-local
  const [notasEdit, setNotasEdit] = useState("");

  const whatsappLink = useMemo(() => {
    if (!lead?.telefono) return null;
    const tel = lead.telefono.replace(/\s/g, "");
    const texto = encodeURIComponent(
      `Hola ${lead.nombre}, soy de Impulso Energético. Te escribo por tu solicitud para ahorrar en tus facturas. ¿Te viene bien si lo vemos?`
    );
    return `https://wa.me/${tel}?text=${texto}`;
  }, [lead]);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    setOkMsg(null);

    try {
      if (!id || Number.isNaN(id)) {
        throw new Error("ID de lead no válido.");
      }

      const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cargar el lead");
      }

      const data = (await res.json()) as LeadDetalle;
      setLead(data);

      // hidratar formulario
      setEstadoEdit((data.estado || "pendiente").toLowerCase());
      setAccionEdit(data.proximaAccion || "");
      setAccionEnEdit(
        data.proximaAccionEn ? new Date(data.proximaAccionEn).toISOString().slice(0, 16) : ""
      );
      setNotasEdit(data.notas || "");
    } catch (e: any) {
      setError(e?.message || "Error al cargar el lead");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const guardarCambios = async () => {
    if (!lead) return;
    setSaving(true);
    setError(null);
    setOkMsg(null);

    try {
      const payload = {
        estado: estadoEdit,
        proximaAccion: accionEdit ? accionEdit.trim() : null,
        proximaAccionEn: accionEnEdit ? new Date(accionEnEdit).toISOString() : null,
        notas: notasEdit ? notasEdit.trim() : null,
      };

      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo guardar");
      }

      const updated = (await res.json()) as LeadDetalle;
      setLead(updated);
      setOkMsg("Guardado ✅");
    } catch (e: any) {
      setError(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
      // limpiar msg a los segundos
      setTimeout(() => setOkMsg(null), 2500);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-200 text-sm">Cargando información del lead…</div>;
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-red-900/70 border border-red-500/70 text-red-50 rounded-2xl px-5 py-4 text-sm">
          <p className="font-semibold mb-1">Error al cargar el lead</p>
          <p>{error || "No se han encontrado datos."}</p>
          <button
            onClick={() => router.back()}
            className="mt-3 inline-flex px-3 py-1.5 rounded-full bg-slate-950 border border-slate-600 text-slate-100 text-xs hover:border-emerald-400"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <button
        onClick={() => router.back()}
        className="inline-flex mb-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-600 text-slate-100 text-xs hover:border-emerald-400"
      >
        ← Volver a Lead Center
      </button>

      {/* Cabecera lead */}
      <div className="rounded-3xl bg-slate-950/90 border border-emerald-500/60 p-6 shadow-[0_0_35px_rgba(16,185,129,0.28)]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white mb-1">
              {lead.nombre || "Lead sin nombre"}
            </h1>

            <p className="text-sm text-slate-300">
              Email: <span className="font-semibold">{lead.email || "No indicado"}</span>
            </p>
            <p className="text-sm text-slate-300">
              Teléfono: <span className="font-semibold">{lead.telefono || "No indicado"}</span>
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Estado actual:{" "}
              <span className="font-bold text-slate-200">
                {(lead.estado || "pendiente").toUpperCase()}
              </span>
            </p>

            {lead.creadoEn && (
              <p className="text-xs text-slate-500 mt-1">
                Registrado el {new Date(lead.creadoEn).toLocaleString("es-ES")}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${lead.telefono}`}
              className="inline-flex px-3 py-1.5 rounded-full bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold hover:border-emerald-400"
            >
              📞 Llamar
            </a>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex px-3 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-400 text-emerald-100 text-xs font-bold hover:bg-emerald-600/30"
              >
                💬 WhatsApp
              </a>
            )}

            <button
              onClick={guardarCambios}
              disabled={saving}
              className="inline-flex px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-extrabold hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">Agente</h2>
            <p className="text-slate-300">{lead.agente?.nombre || "Sin agente asignado"}</p>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">Lugar</h2>
            <p className="text-slate-300">{lead.lugar?.nombre || "Sin lugar asignado"}</p>
          </div>
        </div>

        {(okMsg || error) && (
          <div className="mt-4">
            {okMsg && (
              <div className="rounded-2xl bg-emerald-900/25 border border-emerald-500/30 text-emerald-100 px-4 py-3 text-sm">
                {okMsg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gestión comercial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-6">
          <h2 className="text-white font-extrabold text-lg mb-4">Gestión comercial</h2>

          <label className="block text-xs font-bold text-slate-300 mb-1">Estado</label>
          <select
            value={estadoEdit}
            onChange={(e) => setEstadoEdit(e.target.value)}
            className="w-full mb-4 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm outline-none focus:border-emerald-400"
          >
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>

          <label className="block text-xs font-bold text-slate-300 mb-1">Próxima acción</label>
          <input
            value={accionEdit}
            onChange={(e) => setAccionEdit(e.target.value)}
            placeholder="Ej: Llamar, WhatsApp, Enviar oferta…"
            className="w-full mb-3 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm outline-none focus:border-emerald-400"
          />

          <label className="block text-xs font-bold text-slate-300 mb-1">Fecha próxima acción</label>
          <input
            type="datetime-local"
            value={accionEnEdit}
            onChange={(e) => setAccionEnEdit(e.target.value)}
            className="w-full px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm outline-none focus:border-emerald-400"
          />

          <p className="text-xs text-slate-400 mt-2">
            Tip: Si un lead tiene “próxima acción”, nunca se pierde.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-6">
          <h2 className="text-white font-extrabold text-lg mb-4">Notas</h2>
          <textarea
            value={notasEdit}
            onChange={(e) => setNotasEdit(e.target.value)}
            rows={10}
            placeholder="Objeciones, precio, cuándo volver a llamar, resumen de la conversación…"
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm outline-none focus:border-emerald-400"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={guardarCambios}
              disabled={saving}
              className="inline-flex px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 text-sm font-extrabold hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
