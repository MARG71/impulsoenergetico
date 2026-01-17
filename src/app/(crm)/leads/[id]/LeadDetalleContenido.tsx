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

  // ✅ si el backend lo incluye (recomendado)
  actividades?: Actividad[];
};

type Actividad = {
  id: number;
  creadoEn: string;
  tipo: string;
  titulo: string;
  detalle?: string | null;
  usuario?: { id: number; nombre: string | null; rol?: string | null } | null;
};

const ESTADOS = ["pendiente", "contactado", "comparativa", "contrato", "cerrado", "perdido"] as const;

function fmtFecha(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("es-ES");
  } catch {
    return dt;
  }
}

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
  const base = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs md:text-sm font-extrabold border";
  if (t.includes("estado")) return `${base} bg-amber-900/35 text-amber-100 border-amber-500/40`;
  if (t.includes("nota")) return `${base} bg-slate-900/70 text-slate-200 border-slate-700`;
  if (t.includes("accion")) return `${base} bg-purple-900/35 text-purple-100 border-purple-500/40`;
  if (t.includes("whatsapp")) return `${base} bg-emerald-900/35 text-emerald-100 border-emerald-500/40`;
  if (t.includes("llamada")) return `${base} bg-blue-900/35 text-blue-100 border-blue-500/40`;
  if (t.includes("comparativa")) return `${base} bg-green-900/35 text-green-100 border-green-500/40`;
  if (t.includes("contrato")) return `${base} bg-emerald-900/35 text-emerald-100 border-emerald-500/40`;
  return `${base} bg-slate-900/70 text-slate-200 border-slate-700`;
}

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  try {
    // ISO -> yyyy-MM-ddTHH:mm (para input datetime-local)
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

function fromDatetimeLocal(value: string) {
  if (!value) return null;
  // value viene como "yyyy-MM-ddTHH:mm"
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

export default function LeadDetalleContenido() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id);

  const [lead, setLead] = useState<LeadDetalle | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  // edición
  const [estadoEdit, setEstadoEdit] = useState<(typeof ESTADOS)[number]>("pendiente");
  const [accionEdit, setAccionEdit] = useState("");
  const [accionEnEdit, setAccionEnEdit] = useState(""); // datetime-local
  const [notasEdit, setNotasEdit] = useState("");

  // nota rápida
  const [notaRapida, setNotaRapida] = useState("");

  const whatsappLink = useMemo(() => {
    if (!lead?.telefono) return null;
    const tel = String(lead.telefono || "").replace(/\s/g, "");
    const texto = encodeURIComponent(
      `Hola ${lead.nombre}, soy de Impulso Energético. Te escribo por tu solicitud para ahorrar en tus facturas. ¿Te viene bien si lo vemos?`
    );
    return `https://wa.me/${tel}?text=${texto}`;
  }, [lead?.telefono, lead?.nombre]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const cargarActividades = async () => {
    try {
      const res = await fetch(`/api/crm/leads/${id}/actividades`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setActividades(Array.isArray(data?.items) ? data.items : []);
    } catch {
      // silencioso
    }
  };

  const cargar = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!id || Number.isNaN(id)) throw new Error("ID de lead no válido.");

      const res = await fetch(`/api/crm/leads/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cargar el lead");
      }

      const data = (await res.json()) as LeadDetalle;
      setLead(data);

      setEstadoEdit(((data.estado || "pendiente").toLowerCase() as any) || "pendiente");
      setAccionEdit(data.proximaAccion || "");
      setAccionEnEdit(toDatetimeLocal(data.proximaAccionEn));
      setNotasEdit(data.notas || "");

      // ✅ preferir actividades desde GET (si el backend las incluye)
      if (Array.isArray(data.actividades)) {
        setActividades(data.actividades);
      } else {
        await cargarActividades();
      }
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

    try {
      const payload = {
        estado: estadoEdit,
        proximaAccion: accionEdit ? accionEdit.trim() : null,
        proximaAccionEn: fromDatetimeLocal(accionEnEdit),
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
      showToast("Guardado ✅ (actividad automática)");
      await cargar(); // refresca todo (incluida timeline)
    } catch (e: any) {
      setError(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const crearActividad = async (tipo: string, titulo: string, detalle?: string | null) => {
    try {
      const res = await fetch(`/api/crm/leads/${id}/actividades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, titulo, detalle: detalle ?? null }),
      });
      if (res.ok) {
        showToast("Actividad registrada ✅");
        await cargar();
      }
    } catch {
      // silencioso
    }
  };

  const crearNotaRapida = async () => {
    const txt = notaRapida.trim();
    if (!txt) return;
    setSaving(true);
    try {
      await crearActividad("nota", "Nota rápida", txt);
      setNotaRapida("");
    } finally {
      setSaving(false);
    }
  };

  const registrarLlamada = async () => {
    await crearActividad("llamada", "Llamada realizada", "Se intentó contactar por teléfono.");
  };

  const registrarWhatsApp = async () => {
    await crearActividad("whatsapp", "WhatsApp enviado", "Se envió mensaje por WhatsApp.");
  };

  if (loading) {
    return <div className="p-6 text-slate-200 text-lg">Cargando información del lead…</div>;
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-red-900/70 border border-red-500/70 text-red-50 rounded-2xl px-5 py-4 text-base">
          <p className="font-extrabold mb-1 text-xl">Error al cargar el lead</p>
          <p className="text-base">{error || "No se han encontrado datos."}</p>
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
      {/* Toast */}
      {toast && (
        <div className="fixed z-50 bottom-6 right-6 rounded-2xl bg-emerald-900/35 border border-emerald-500/40 text-emerald-100 px-4 py-3 font-semibold shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          {toast}
        </div>
      )}

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
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              {lead.nombre || "Lead sin nombre"}{" "}
              <span className="text-slate-400 text-xl md:text-2xl font-extrabold">#{lead.id}</span>
            </h1>

            <p className="text-lg text-slate-300">
              Email: <span className="font-semibold text-slate-100">{lead.email || "No indicado"}</span>
            </p>
            <p className="text-lg text-slate-300">
              Teléfono: <span className="font-semibold text-slate-100">{lead.telefono || "No indicado"}</span>
            </p>

            <p className="text-base text-slate-400 mt-2">
              Estado actual:{" "}
              <span className="font-extrabold text-slate-100">{(lead.estado || "pendiente").toUpperCase()}</span>
            </p>

            {lead.creadoEn && <p className="text-sm text-slate-500 mt-1">Registrado el {fmtFecha(lead.creadoEn)}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${lead.telefono}`}
              onClick={registrarLlamada}
              className="inline-flex px-4 py-2 rounded-full bg-blue-900/35 border border-blue-500/40 text-blue-100 text-sm md:text-base font-extrabold hover:bg-blue-900/45"
            >
              📞 Llamar
            </a>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                onClick={registrarWhatsApp}
                className="inline-flex px-4 py-2 rounded-full bg-emerald-600/20 border border-emerald-400 text-emerald-100 text-sm md:text-base font-extrabold hover:bg-emerald-600/30"
              >
                💬 WhatsApp
              </a>
            )}

            <button
              onClick={guardarCambios}
              disabled={saving}
              className="inline-flex px-5 py-2 rounded-full bg-emerald-500 text-slate-950 text-sm md:text-base font-extrabold hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* Info rápida */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
            <h2 className="text-lg font-extrabold text-slate-100 mb-2">Agente</h2>
            <p className="text-slate-200 text-lg">{lead.agente?.nombre || "Sin agente asignado"}</p>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
            <h2 className="text-lg font-extrabold text-slate-100 mb-2">Lugar</h2>
            <p className="text-slate-200 text-lg">{lead.lugar?.nombre || "Sin lugar asignado"}</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-900/50 border border-red-500/40 text-red-100 px-4 py-3 text-base font-semibold">
            {error}
          </div>
        )}
      </div>

      {/* Gestión + Notas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-6">
          <h2 className="text-white font-extrabold text-2xl mb-4">Gestión comercial</h2>

          <label className="block text-base font-extrabold text-slate-300 mb-2">Estado</label>
          <select
            value={estadoEdit}
            onChange={(e) => setEstadoEdit(e.target.value as any)}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-lg outline-none focus:border-emerald-400"
          >
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>

          <label className="block text-base font-extrabold text-slate-300 mb-2">Próxima acción</label>
          <input
            value={accionEdit}
            onChange={(e) => setAccionEdit(e.target.value)}
            placeholder="Ej: Llamar, WhatsApp, Enviar oferta…"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-lg outline-none focus:border-emerald-400"
          />

          <label className="block text-base font-extrabold text-slate-300 mb-2">Fecha próxima acción</label>
          <input
            type="datetime-local"
            value={accionEnEdit}
            onChange={(e) => setAccionEnEdit(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-lg outline-none focus:border-emerald-400"
          />

          <p className="text-sm text-slate-400 mt-3">
            Regla de oro: si un lead tiene “próxima acción”, nunca se pierde.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => crearActividad("accion", "Seguimiento", `Seguimiento programado: ${accionEdit || "—"} · ${accionEnEdit || "—"}`)}
              className="inline-flex px-4 py-2 rounded-full bg-purple-600/15 border border-purple-400 text-purple-100 text-sm font-extrabold hover:bg-purple-600/25"
            >
              📌 Registrar seguimiento
            </button>

            <button
              onClick={() => crearActividad("estado", "Revisión de estado", `Estado revisado: ${estadoEdit.toUpperCase()}`)}
              className="inline-flex px-4 py-2 rounded-full bg-amber-600/15 border border-amber-400 text-amber-100 text-sm font-extrabold hover:bg-amber-600/25"
            >
              ✅ Registrar revisión estado
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-6">
          <h2 className="text-white font-extrabold text-2xl mb-4">Notas internas</h2>
          <textarea
            value={notasEdit}
            onChange={(e) => setNotasEdit(e.target.value)}
            rows={10}
            placeholder="Objeciones, precio, cuándo volver a llamar, resumen de la conversación…"
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-lg outline-none focus:border-emerald-400"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={guardarCambios}
              disabled={saving}
              className="inline-flex px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 text-lg font-extrabold hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-white font-extrabold text-2xl">Timeline de actividad</h2>
          <button
            onClick={cargar}
            className="inline-flex px-4 py-2 rounded-2xl bg-slate-950 border border-slate-600 text-slate-100 text-base font-bold hover:border-emerald-400 w-fit"
          >
            Actualizar
          </button>
        </div>

        {/* Nota rápida */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-700 p-4 mb-5">
          <p className="text-slate-200 font-extrabold text-lg mb-2">Nota rápida</p>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={notaRapida}
              onChange={(e) => setNotaRapida(e.target.value)}
              placeholder="Ej: Le interesa, llamar el martes. Enviar oferta 2.0TD…"
              className="w-full md:flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-lg outline-none focus:border-emerald-400"
            />
            <button
              onClick={crearNotaRapida}
              disabled={saving || !notaRapida.trim()}
              className="inline-flex px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 text-lg font-extrabold hover:bg-emerald-400 w-fit disabled:opacity-60"
            >
              Añadir
            </button>
          </div>
        </div>

        {actividades.length === 0 ? (
          <div className="text-slate-300 text-lg">
            Aún no hay actividad. Cuando guardes cambios o uses botones rápidos, se registrará automáticamente.
          </div>
        ) : (
          <div className="space-y-3">
            {actividades.map((a, idx) => (
              <div key={a.id} className="relative pl-10">
                {/* Línea */}
                <div className="absolute left-4 top-0 h-full w-px bg-slate-800" />
                {/* Punto */}
                <div className="absolute left-[11px] top-5 h-3 w-3 rounded-full bg-emerald-300" />

                <div className="rounded-3xl bg-slate-900/45 border border-slate-800 p-5 hover:border-emerald-500/40 transition">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-0.5">{iconoActividad(a.tipo)}</div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={chipTipo(a.tipo)}>{a.tipo.toUpperCase()}</span>
                          <span className="text-white font-extrabold text-xl">{a.titulo}</span>

                          {idx === 0 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border bg-emerald-600/15 border-emerald-400 text-emerald-100">
                              última
                            </span>
                          )}
                        </div>

                        {a.detalle && (
                          <p className="text-slate-200 text-lg mt-2 whitespace-pre-line leading-relaxed">
                            {a.detalle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-slate-200 text-base font-semibold">
                        {a.usuario?.nombre ? `por ${a.usuario.nombre}` : ""}
                      </div>
                      <div className="text-slate-400 text-sm">{fmtFecha(a.creadoEn)}</div>
                    </div>
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
