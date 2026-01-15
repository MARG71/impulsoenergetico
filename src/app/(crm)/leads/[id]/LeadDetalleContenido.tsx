"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type LeadDetalle = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado?: string | null;
  origen?: string | null;
  creadoEn?: string;
  agente?: { id: number; nombre: string | null } | null;
  lugar?: { id: number; nombre: string | null } | null;
};

export default function LeadDetalleContenido() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = Number(params?.id);

  useEffect(() => {
    if (!id) {
      setError("ID de lead no válido.");
      setLoading(false);
      return;
    }

    const cargar = async () => {
      try {
        const res = await fetch(`/api/leads/${id}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al cargar el lead");
        }
        const data = (await res.json()) as LeadDetalle;
        setLead(data);
        setError(null);
      } catch (err: any) {
        console.error("Error cargando lead:", err);
        setError(err.message || "Error al cargar el lead");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-slate-200 text-sm">
        Cargando información del lead…
      </div>
    );
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
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <button
        onClick={() => router.back()}
        className="inline-flex mb-3 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-600 text-slate-100 text-xs hover:border-emerald-400"
      >
        ← Volver al pipeline
      </button>

      <div className="rounded-3xl bg-slate-950/90 border border-emerald-500/60 p-6 shadow-[0_0_35px_rgba(16,185,129,0.35)]">
        <h1 className="text-2xl font-extrabold text-white mb-1">
          {lead.nombre || "Lead sin nombre"}
        </h1>
        <p className="text-sm text-slate-300">
          Email:{" "}
          <span className="font-semibold">
            {lead.email || "No indicado"}
          </span>
        </p>
        <p className="text-sm text-slate-300">
          Teléfono:{" "}
          <span className="font-semibold">
            {lead.telefono || "No indicado"}
          </span>
        </p>
        <p className="text-sm text-slate-300 mt-1">
          Estado:{" "}
          <span className="font-semibold">
            {lead.estado || "NUEVO"}
          </span>
        </p>
        <p className="text-sm text-slate-300 mt-1">
          Origen:{" "}
          <span className="font-semibold">
            {lead.origen || "Sin especificar"}
          </span>
        </p>
        {lead.creadoEn && (
          <p className="text-xs text-slate-400 mt-1">
            Registrado el{" "}
            {new Date(lead.creadoEn).toLocaleString("es-ES")}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Agente
            </h2>
            <p className="text-slate-300">
              {lead.agente?.nombre || "Sin agente asignado"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Lugar
            </h2>
            <p className="text-slate-300">
              {lead.lugar?.nombre || "Sin lugar asignado"}
            </p>
          </div>
        </div>
      </div>
    </div>
    {/* --- Gestión comercial --- */}
    <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-6">
      <h2 className="text-white font-extrabold text-lg mb-4">Gestión comercial</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Estado</label>
          <select
            value={estadoEdit}
            onChange={(e) => setEstadoEdit(e.target.value)}
            className="w-full px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm outline-none focus:border-emerald-400"
          >
            <option value="pendiente">PENDIENTE</option>
            <option value="contactado">CONTACTADO</option>
            <option value="comparativa">COMPARATIVA</option>
            <option value="contrato">CONTRATO</option>
            <option value="cerrado">CERRADO</option>
            <option value="perdido">PERDIDO</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Próxima acción</label>
          <input
            value={accionEdit}
            onChange={(e) => setAccionEdit(e.target.value)}
            placeholder="Ej: Llamar, WhatsApp, Enviar oferta…"
            className="w-full px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs font-bold text-slate-300 mb-1">Fecha próxima acción</label>
        <input
          type="datetime-local"
          value={accionEnEdit}
          onChange={(e) => setAccionEnEdit(e.target.value)}
          className="w-full px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm outline-none focus:border-emerald-400"
        />
      </div>

      <div className="mt-3">
        <label className="block text-xs font-bold text-slate-300 mb-1">Notas</label>
        <textarea
          value={notasEdit}
          onChange={(e) => setNotasEdit(e.target.value)}
          rows={6}
          placeholder="Objeciones, precio, cuándo volver a llamar, etc."
          className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm outline-none focus:border-emerald-400"
        />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={guardarCambios}
          className="inline-flex px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 text-sm font-extrabold hover:bg-emerald-400"
        >
          Guardar
        </button>
      </div>
    </div>

  );
}
