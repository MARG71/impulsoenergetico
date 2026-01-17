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

const ESTADOS = [
  "pendiente",
  "contactado",
  "comparativa",
  "contrato",
  "cerrado",
  "perdido",
];

export default function LeadDetalleContenido() {
  const params = useParams();
  const router = useRouter();
  const id = Number((params as any)?.id);

  const [lead, setLead] = useState<LeadDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [estadoEdit, setEstadoEdit] = useState("pendiente");
  const [accionEdit, setAccionEdit] = useState("");
  const [accionEnEdit, setAccionEnEdit] = useState("");
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
    try {
      const res = await fetch(`/api/crm/leads/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar el lead");

      const data = (await res.json()) as LeadDetalle;
      setLead(data);

      setEstadoEdit((data.estado || "pendiente").toLowerCase());
      setAccionEdit(data.proximaAccion || "");
      setAccionEnEdit(
        data.proximaAccionEn
          ? new Date(data.proximaAccionEn).toISOString().slice(0, 16)
          : ""
      );
      setNotasEdit(data.notas || "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const guardarCambios = async () => {
    if (!lead) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: estadoEdit,
          proximaAccion: accionEdit || null,
          proximaAccionEn: accionEnEdit
            ? new Date(accionEnEdit).toISOString()
            : null,
          notas: notasEdit || null,
        }),
      });

      if (!res.ok) throw new Error("No se pudo guardar");

      setOkMsg("Cambios guardados correctamente ✅");
      cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setOkMsg(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-slate-200 text-base">
        Cargando información del lead…
      </div>
    );
  }

  if (!lead || error) {
    return (
      <div className="p-6 text-red-200 text-base">
        Error al cargar el lead
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-base">
      <button
        onClick={() => router.back()}
        className="mb-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-600 text-slate-100 text-sm hover:border-emerald-400"
      >
        ← Volver a Leads
      </button>

      {/* Cabecera */}
      <div className="rounded-3xl bg-slate-950 border border-emerald-500/60 p-7 shadow-lg">
        <h1 className="text-3xl font-extrabold text-white mb-2">
          {lead.nombre}
        </h1>

        <p className="text-base text-slate-300">
          📧 <strong>{lead.email}</strong>
        </p>
        <p className="text-base text-slate-300">
          📞 <strong>{lead.telefono}</strong>
        </p>

        <p className="mt-2 text-base">
          Estado actual:{" "}
          <span className="font-bold text-emerald-400 uppercase">
            {lead.estado}
          </span>
        </p>
      </div>

      {/* Gestión */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-slate-950 border border-slate-700 p-6">
          <h2 className="text-xl font-extrabold mb-4 text-white">
            Gestión comercial
          </h2>

          <label className="block mb-1 font-semibold">Estado</label>
          <select
            value={estadoEdit}
            onChange={(e) => setEstadoEdit(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-base"
          >
            {ESTADOS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <label className="block mb-1 font-semibold">Próxima acción</label>
          <input
            value={accionEdit}
            onChange={(e) => setAccionEdit(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-base"
          />

          <label className="block mb-1 font-semibold">Fecha</label>
          <input
            type="datetime-local"
            value={accionEnEdit}
            onChange={(e) => setAccionEnEdit(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-base"
          />
        </div>

        <div className="rounded-3xl bg-slate-950 border border-slate-700 p-6">
          <h2 className="text-xl font-extrabold mb-4 text-white">Notas</h2>
          <textarea
            rows={10}
            value={notasEdit}
            onChange={(e) => setNotasEdit(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-base"
          />

          <button
            onClick={guardarCambios}
            disabled={saving}
            className="mt-4 w-full py-3 rounded-xl bg-emerald-500 text-slate-950 text-lg font-extrabold hover:bg-emerald-400"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {okMsg && (
        <div className="rounded-xl bg-emerald-900/30 border border-emerald-500 text-emerald-100 px-5 py-4 text-base">
          {okMsg}
        </div>
      )}
    </div>
  );
}
