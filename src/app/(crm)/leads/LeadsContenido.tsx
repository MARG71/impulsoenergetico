"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type UsuarioMini = { id: number; nombre: string; rol: string };

type Actividad = {
  id: number;
  creadoEn: string;
  tipo: string;
  titulo: string;
  detalle?: string | null;
  usuario?: UsuarioMini | null;
};

type Lead = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado?: string | null;
  creadoEn: string;

  notas?: string | null;
  proximaAccion?: string | null;
  proximaAccionEn?: string | null;

  agente?: { id: number; nombre: string | null } | null;
  lugar?: { id: number; nombre: string | null } | null;
};

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("es-ES");
  } catch {
    return dt;
  }
}

function badgeTipo(tipo: string) {
  const t = (tipo || "").toLowerCase();
  const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border";
  if (t.includes("llamada")) return `${base} bg-blue-900/40 text-blue-100 border-blue-500/40`;
  if (t.includes("whatsapp")) return `${base} bg-emerald-900/35 text-emerald-100 border-emerald-500/40`;
  if (t.includes("estado")) return `${base} bg-amber-900/35 text-amber-100 border-amber-500/40`;
  if (t.includes("accion")) return `${base} bg-purple-900/35 text-purple-100 border-purple-500/40`;
  if (t.includes("nota")) return `${base} bg-slate-900/60 text-slate-200 border-slate-700`;
  return `${base} bg-slate-900/60 text-slate-200 border-slate-700`;
}

export default function LeadDetalleContenido() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [estado, setEstado] = useState("pendiente");
  const [notas, setNotas] = useState("");
  const [proximaAccion, setProximaAccion] = useState("");
  const [proximaAccionEn, setProximaAccionEn] = useState<string>("");

  const [notaRapida, setNotaRapida] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const cargar = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/leads/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo cargar el lead");

      setLead(data as Lead);

      setEstado((data?.estado || "pendiente").toLowerCase());
      setNotas(data?.notas || "");
      setProximaAccion(data?.proximaAccion || "");
      setProximaAccionEn(data?.proximaAccionEn ? String(data.proximaAccionEn) : "");

      // si el GET incluye actividades (ahora sí), las usamos
      const acts: Actividad[] = (data?.actividades || []).map((a: any) => ({
        id: a.id,
        creadoEn: a.creadoEn,
        tipo: a.tipo,
        titulo: a.titulo,
        detalle: a.detalle,
        usuario: a.usuario ?? null,
      }));
      setActividades(acts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const waLink = useMemo(() => {
    const tel = String(lead?.telefono || "").replace(/\s/g, "");
    const texto = encodeURIComponent(
      `Hola ${lead?.nombre || ""}, soy de Impulso Energético. Te contacto por tu solicitud para ahorrar en tus facturas. ¿Te viene bien si lo vemos?`
    );
    return `https://wa.me/${tel}?text=${texto}`;
  }, [lead?.telefono, lead?.nombre]);

  const crearActividad = async (tipo: string, titulo: string, detalle?: string | null) => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/leads/${id}/actividades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, titulo, detalle: detalle ?? null }),
      });
      if (res.ok) {
        setToast("Actividad registrada ✅");
        setTimeout(() => setToast(null), 2000);
        await cargar();
      }
    } finally {
      setSaving(false);
    }
  };

  const guardarGestion = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado,
          notas,
          proximaAccion: proximaAccion || null,
          proximaAccionEn: proximaAccionEn ? new Date(proximaAccionEn).toISOString() : null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo guardar");
      setToast("Guardado ✅ (con actividad automática)");
      setTimeout(() => setToast(null), 2200);
      await cargar();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-200 text-base">Cargando Lead…</div>;
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-red-900/70 border border-red-500/70 text-red-50 rounded-2xl px-5 py-4 text-base">
          <p className="font-semibold mb-1 text-lg">Lead no encontrado</p>
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
    <div className="p-6 space-y-5 text-base">
      {toast && (
        <div className="fixed z-50 bottom-6 right-6 rounded-2xl bg-emerald-900/35 border border-emerald-500/40 text-emerald-100 px-4 py-3 font-semibold shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex px-4 py-2 rounded-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-extrabold hover:border-emerald-400"
          >
            ← Volver
          </button>

          <h1 className="text-3xl font-extrabold text-white mt-3">
            Lead #{lead.id} — <span className="text-emerald-300">{lead.nombre}</span>
          </h1>

          <p className="text-base text-slate-300 mt-1">
            {lead.email} · {lead.telefono} · Creado: <span className="font-bold">{fmt(lead.creadoEn)}</span>
          </p>

          <p className="text-sm text-slate-400 mt-1">
            Agente: <span className="font-semibold text-slate-200">{lead.agente?.nombre || "—"}</span>{" "}
            · Lugar: <span className="font-semibold text-slate-200">{lead.lugar?.nombre || "—"}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${lead.telefono}`}
            onClick={() => crearActividad("llamada", "Llamada realizada", "Se intentó contactar por teléfono.")}
            className="inline-flex px-4 py-2 rounded-full bg-blue-900/35 border border-blue-500/40 text-blue-100 text-sm font-extrabold hover:bg-blue-900/45"
          >
            📞 Registrar llamada
          </a>

          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            onClick={() => crearActividad("whatsapp", "WhatsApp enviado", "Se envió mensaje por WhatsApp.")}
            className="inline-flex px-4 py-2 rounded-full bg-emerald-600/15 border border-emerald-400 text-emerald-100 text-sm font-extrabold hover:bg-emerald-600/25"
          >
            💬 WhatsApp
          </a>

          <button
            disabled={saving}
            onClick={() => crearActividad("accion", "Acción registrada", "Acción manual registrada desde Lead Center PRO.")}
            className="inline-flex px-4 py-2 rounded-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-extrabold hover:border-emerald-400 disabled:opacity-60"
          >
            ⚡ Acción
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gestión */}
        <div className="rounded-3xl bg-slate-950/75 border border-slate-700 p-5 lg:col-span-1 space-y-4">
          <h2 className="text-xl font-extrabold text-white">Gestión comercial</h2>

          <div>
            <label className="block text-sm font-extrabold text-slate-300 mb-2">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
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
            <label className="block text-sm font-extrabold text-slate-300 mb-2">Notas internas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
              placeholder="Notas del lead (se registra actividad automática al cambiar)"
            />
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-300 mb-2">Próxima acción</label>
            <input
              value={proximaAccion}
              onChange={(e) => setProximaAccion(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
              placeholder="Ej: Llamar, enviar oferta, pedir factura..."
            />

            <label className="block text-sm font-extrabold text-slate-300 mt-3 mb-2">Fecha/Hora</label>
            <input
              type="datetime-local"
              value={proximaAccionEn ? new Date(proximaAccionEn).toISOString().slice(0, 16) : ""}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) setProximaAccionEn("");
                else setProximaAccionEn(new Date(v).toISOString());
              }}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
            />

            <p className="text-sm text-slate-400 mt-2">
              Actual: <span className="font-bold text-slate-200">{lead.proximaAccion || "—"}</span> ·{" "}
              <span className="font-bold text-slate-200">{fmt(lead.proximaAccionEn)}</span>
            </p>
          </div>

          <button
            disabled={saving}
            onClick={guardarGestion}
            className="w-full px-4 py-3 rounded-2xl bg-emerald-600/20 border border-emerald-400 text-emerald-100 text-base font-extrabold hover:bg-emerald-600/30 disabled:opacity-60"
          >
            Guardar cambios (genera actividades)
          </button>
        </div>

        {/* Timeline */}
        <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-white">Timeline</h2>
            <button
              onClick={cargar}
              className="px-4 py-2 rounded-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-extrabold hover:border-emerald-400"
            >
              Actualizar
            </button>
          </div>

          {/* Nota rápida */}
          <div className="mt-4 rounded-3xl bg-slate-950/70 border border-slate-700 p-4">
            <p className="text-sm font-extrabold text-slate-200">Nota rápida (se guarda como actividad)</p>
            <div className="mt-3 flex flex-col md:flex-row gap-3">
              <input
                value={notaRapida}
                onChange={(e) => setNotaRapida(e.target.value)}
                placeholder="Ej: ‘Llamar mañana 17:00, quiere comparar luz+gas’"
                className="w-full md:flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
              />
              <button
                disabled={saving || !notaRapida.trim()}
                onClick={async () => {
                  await crearActividad("nota", "Nota", notaRapida.trim());
                  setNotaRapida("");
                }}
                className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base font-extrabold hover:border-emerald-400 disabled:opacity-60"
              >
                Guardar nota
              </button>
            </div>
          </div>

          {/* Lista timeline */}
          <div className="mt-5 space-y-3">
            {actividades.length === 0 ? (
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-5 text-slate-300">
                Aún no hay actividades. Usa llamada/WhatsApp/nota para empezar.
              </div>
            ) : (
              actividades.map((a, idx) => (
                <div key={a.id} className="relative pl-10">
                  {/* Line */}
                  <div className="absolute left-4 top-0 h-full w-px bg-slate-800" />
                  {/* Dot */}
                  <div className="absolute left-[11px] top-4 h-3 w-3 rounded-full bg-emerald-300" />

                  <div className="rounded-3xl bg-slate-950/70 border border-slate-700 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={badgeTipo(a.tipo)}>{a.tipo.toUpperCase()}</span>
                        <span className="text-lg font-extrabold text-white">{a.titulo}</span>
                        {idx === 0 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border bg-emerald-600/15 border-emerald-400 text-emerald-100">
                            última
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-slate-400 font-semibold">
                        {fmt(a.creadoEn)}
                        {a.usuario?.nombre ? ` · ${a.usuario.nombre}` : ""}
                      </div>
                    </div>

                    {a.detalle && (
                      <div className="mt-2 text-base text-slate-200 leading-relaxed">
                        {a.detalle}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Acciones rápidas adicionales */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              disabled={saving}
              onClick={() => crearActividad("estado", "Revisión de estado", `Estado revisado: ${(lead.estado || "pendiente").toUpperCase()}`)}
              className="px-4 py-2 rounded-full bg-amber-600/15 border border-amber-400 text-amber-100 text-sm font-extrabold hover:bg-amber-600/25 disabled:opacity-60"
            >
              ✅ Registrar revisión estado
            </button>

            <button
              disabled={saving}
              onClick={() => crearActividad("accion", "Seguimiento", `Seguimiento programado: ${lead.proximaAccion || "—"} · ${fmt(lead.proximaAccionEn)}`)}
              className="px-4 py-2 rounded-full bg-purple-600/15 border border-purple-400 text-purple-100 text-sm font-extrabold hover:bg-purple-600/25 disabled:opacity-60"
            >
              📌 Registrar seguimiento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
