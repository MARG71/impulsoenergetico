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

  comparativaId?: number | null;
  contratoId?: number | null;
};

type Actividad = {
  id: number;
  creadoEn: string;
  tipo: string;
  titulo: string;
  detalle?: string | null;
  usuario?: { id: number; nombre: string | null } | null;
};

const ESTADOS = ["pendiente", "contactado", "comparativa", "contrato", "cerrado", "perdido"];

function iconoActividad(tipo: string) {
  const t = (tipo || "").toLowerCase();
  if (t.includes("estado")) return "🔁";
  if (t.includes("nota")) return "📝";
  if (t.includes("accion")) return "📅";
  if (t.includes("whatsapp")) return "💬";
  if (t.includes("llamada")) return "📞";
  if (t.includes("comparativa")) return "⚡";
  if (t.includes("contrato")) return "✅";
  if (t.includes("creacion")) return "✨";
  return "📌";
}

function chipTipo(tipo: string) {
  const t = (tipo || "").toLowerCase();
  const base = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-extrabold border";
  if (t.includes("estado")) return `${base} bg-blue-900/35 text-blue-100 border-blue-500/40`;
  if (t.includes("nota")) return `${base} bg-slate-900/70 text-slate-200 border-slate-700`;
  if (t.includes("accion")) return `${base} bg-amber-900/35 text-amber-100 border-amber-500/40`;
  if (t.includes("whatsapp")) return `${base} bg-emerald-900/35 text-emerald-100 border-emerald-500/40`;
  if (t.includes("llamada")) return `${base} bg-indigo-900/35 text-indigo-100 border-indigo-500/40`;
  if (t.includes("comparativa")) return `${base} bg-green-900/35 text-green-100 border-green-500/40`;
  if (t.includes("contrato")) return `${base} bg-emerald-900/35 text-emerald-100 border-emerald-500/40`;
  return `${base} bg-slate-900/70 text-slate-200 border-slate-700`;
}

function fmtFecha(dt?: string | null) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString("es-ES");
  } catch {
    return dt;
  }
}

export default function LeadDetalleContenido() {
  const params = useParams();
  const router = useRouter();
  const id = Number((params as any)?.id);

  const [lead, setLead] = useState<LeadDetalle | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Edición
  const [estadoEdit, setEstadoEdit] = useState("pendiente");
  const [accionEdit, setAccionEdit] = useState("");
  const [accionEnEdit, setAccionEnEdit] = useState(""); // datetime-local
  const [notasEdit, setNotasEdit] = useState("");

  // Nota rápida
  const [notaRapida, setNotaRapida] = useState("");

  const whatsappLink = useMemo(() => {
    if (!lead?.telefono) return null;
    const tel = String(lead.telefono || "").replace(/\s/g, "");
    const texto = encodeURIComponent(
      `Hola ${lead.nombre}, soy de Impulso Energético. Te escribo por tu solicitud para ahorrar en tus facturas. ¿Te viene bien si lo vemos?`
    );
    return `https://wa.me/${tel}?text=${texto}`;
  }, [lead]);

  const cargarActividades = async () => {
    try {
      const res = await fetch(`/api/crm/leads/${id}/actividades`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setActividades(Array.isArray(data?.items) ? data.items : []);
      }
    } catch {
      // silencioso
    }
  };

  const cargar = async () => {
    setLoading(true);
    setError(null);
    setOkMsg(null);

    try {
      if (!id || Number.isNaN(id)) throw new Error("ID de lead no válido.");

      const res = await fetch(`/api/crm/leads/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cargar el lead");
      }

      const data = (await res.json()) as LeadDetalle;
      setLead(data);

      // hidratar formulario
      setEstadoEdit((data.estado || "pendiente").toLowerCase());
      setAccionEdit(data.proximaAccion || "");
      setAccionEnEdit(data.proximaAccionEn ? new Date(data.proximaAccionEn).toISOString().slice(0, 16) : "");
      setNotasEdit(data.notas || "");

      await cargarActividades();
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

      const res = await fetch(`/api/crm/leads/${lead.id}`, {
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

      await cargarActividades();
    } catch (e: any) {
      setError(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
      setTimeout(() => setOkMsg(null), 2500);
    }
  };

  const crearNotaRapida = async () => {
    const txt = notaRapida.trim();
    if (!txt) return;

    const res = await fetch(`/api/crm/leads/${id}/actividades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "nota",
        titulo: "Nota rápida",
        detalle: txt,
      }),
    });

    if (res.ok) {
      setNotaRapida("");
      await cargarActividades();
    }
  };

  const registrarLlamada = async () => {
    await fetch(`/api/crm/leads/${id}/actividades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "llamada",
        titulo: "Llamada realizada",
        detalle: "Se intentó contactar por teléfono.",
      }),
    }).catch(() => {});
    await cargarActividades();
  };

  const registrarWhatsApp = async () => {
    await fetch(`/api/crm/leads/${id}/actividades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "whatsapp",
        titulo: "WhatsApp enviado",
        detalle: "Se envió mensaje por WhatsApp.",
      }),
    }).catch(() => {});
    await cargarActividades();
  };

  if (loading) {
    return <div className="p-6 text-slate-200 text-base">Cargando información del lead…</div>;
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-red-900/70 border border-red-500/70 text-red-50 rounded-2xl px-5 py-4 text-base">
          <p className="font-semibold mb-1 text-lg">Error al cargar el lead</p>
          <p>{error || "No se han encontrado datos."}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex px-4 py-2 rounded-full bg-slate-950 border border-slate-600 text-slate-100 text-sm hover:border-emerald-400"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5 text-base">
      <button
        onClick={() => router.back()}
        className="inline-flex mb-1 px-4 py-2 rounded-full bg-slate-950 border border-slate-600 text-slate-100 text-sm hover:border-emerald-400"
      >
        ← Volver a Lead Center
      </button>

      {/* Cabecera */}
      <div className="rounded-3xl bg-slate-950/90 border border-emerald-500/60 p-6 shadow-[0_0_35px_rgba(16,185,129,0.28)]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">{lead.nombre || "Lead sin nombre"}</h1>

            <p className="text-base text-slate-300">
              Email: <span className="font-semibold text-slate-100">{lead.email || "No indicado"}</span>
            </p>
            <p className="text-base text-slate-300">
              Teléfono: <span className="font-semibold text-slate-100">{lead.telefono || "No indicado"}</span>
            </p>

            <p className="text-sm text-slate-400 mt-2">
              Estado actual:{" "}
              <span className="font-extrabold text-slate-100">{(lead.estado || "pendiente").toUpperCase()}</span>
            </p>

            {lead.creadoEn && <p className="text-sm text-slate-500 mt-1">Registrado el {fmtFecha(lead.creadoEn)}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${lead.telefono}`}
              onClick={registrarLlamada}
              className="inline-flex px-4 py-2 rounded-full bg-slate-950 border border-slate-700 text-slate-100 text-sm font-extrabold hover:border-emerald-400"
            >
              📞 Llamar
            </a>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                onClick={registrarWhatsApp}
                className="inline-flex px-4 py-2 rounded-full bg-emerald-600/20 border border-emerald-400 text-emerald-100 text-sm font-extrabold hover:bg-emerald-600/30"
              >
                💬 WhatsApp
              </a>
            )}

            <button
              onClick={guardarCambios}
              disabled={saving}
              className="inline-flex px-5 py-2 rounded-full bg-emerald-500 text-slate-950 text-sm font-extrabold hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* Info rápida */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
            <h2 className="text-base font-extrabold text-slate-100 mb-2">Agente</h2>
            <p className="text-slate-200">{lead.agente?.nombre || "Sin agente asignado"}</p>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
            <h2 className="text-base font-extrabold text-slate-100 mb-2">Lugar</h2>
            <p className="text-slate-200">{lead.lugar?.nombre || "Sin lugar asignado"}</p>
          </div>
        </div>

        {(okMsg || error) && (
          <div className="mt-4">
            {okMsg && (
              <div className="rounded-2xl bg-emerald-900/25 border border-emerald-500/30 text-emerald-100 px-4 py-3 text-base font-semibold">
                {okMsg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gestión comercial + Notas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-6">
          <h2 className="text-white font-extrabold text-xl mb-4">Gestión comercial</h2>

          <label className="block text-sm font-extrabold text-slate-300 mb-2">Estado</label>
          <select
            value={estadoEdit}
            onChange={(e) => setEstadoEdit(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
          >
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>

          <label className="block text-sm font-extrabold text-slate-300 mb-2">Próxima acción</label>
          <input
            value={accionEdit}
            onChange={(e) => setAccionEdit(e.target.value)}
            placeholder="Ej: Llamar, WhatsApp, Enviar oferta…"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
          />

          <label className="block text-sm font-extrabold text-slate-300 mb-2">Fecha próxima acción</label>
          <input
            type="datetime-local"
            value={accionEnEdit}
            onChange={(e) => setAccionEnEdit(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
          />

          <p className="text-sm text-slate-400 mt-3">
            Tip: si un lead tiene “próxima acción”, nunca se pierde.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-6">
          <h2 className="text-white font-extrabold text-xl mb-4">Notas</h2>
          <textarea
            value={notasEdit}
            onChange={(e) => setNotasEdit(e.target.value)}
            rows={10}
            placeholder="Objeciones, precio, cuándo volver a llamar, resumen de la conversación…"
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={guardarCambios}
              disabled={saving}
              className="inline-flex px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 text-base font-extrabold hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-white font-extrabold text-xl">Actividad (Timeline)</h2>
          <button
            onClick={cargarActividades}
            className="inline-flex px-4 py-2 rounded-2xl bg-slate-950 border border-slate-600 text-slate-100 text-base font-bold hover:border-emerald-400 w-fit"
          >
            Actualizar
          </button>
        </div>

        {/* Nota rápida */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-700 p-4 mb-5">
          <p className="text-slate-200 font-extrabold text-base mb-2">Nota rápida</p>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={notaRapida}
              onChange={(e) => setNotaRapida(e.target.value)}
              placeholder="Ej: Le interesa, llamar el martes. Enviar oferta 2.0TD…"
              className="w-full md:flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
            />
            <button
              onClick={crearNotaRapida}
              className="inline-flex px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 text-base font-extrabold hover:bg-emerald-400 w-fit"
            >
              Añadir
            </button>
          </div>
        </div>

        {actividades.length === 0 ? (
          <div className="text-slate-300 text-base">
            Aún no hay actividad. Cuando guardes cambios o uses botones rápidos, se registrará automáticamente.
          </div>
        ) : (
          <div className="space-y-3">
            {actividades.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl bg-slate-900/50 border border-slate-800 p-4 hover:border-emerald-500/40 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-0.5">{iconoActividad(a.tipo)}</div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={chipTipo(a.tipo)}>{a.tipo.toUpperCase()}</span>
                        <span className="text-white font-extrabold text-lg">{a.titulo}</span>
                      </div>

                      {a.detalle && <p className="text-slate-200 text-base mt-1 whitespace-pre-line">{a.detalle}</p>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-slate-300 text-base font-semibold">
                      {a.usuario?.nombre ? `por ${a.usuario.nombre}` : ""}
                    </div>
                    <div className="text-slate-400 text-sm">{fmtFecha(a.creadoEn)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
