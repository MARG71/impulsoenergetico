"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";


type UsuarioMini = { id: number; nombre: string | null; rol?: string | null };

type Actividad = {
  id: number;
  creadoEn: string;
  tipo: string;
  titulo: string;
  detalle?: string | null;
  usuario?: UsuarioMini | null;
};

type LeadDocumento = {
  id: number;
  creadoEn: string;
  nombre: string;
  url: string;
  mime?: string | null;
  size?: number | null;
  creadoPor?: { id: number; nombre: string | null; rol?: string | null } | null;
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

const ESTADOS = ["pendiente", "contactado", "comparativa", "contrato", "cerrado", "perdido"] as const;
type EstadoKey = (typeof ESTADOS)[number];

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("es-ES");
  } catch {
    return String(dt);
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

async function fetchJson(url: string, init?: RequestInit, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...init, cache: "no-store", signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
    return data;
  } finally {
    clearTimeout(t);
  }
}

// ✅ Mapeo estado -> etapa (ajústalo si tu “flujo” tiene nombres distintos)
function estadoToEtapa(estado?: string | null): string {
  const s = String(estado || "pendiente").toLowerCase();
  if (s === "pendiente") return "primero";
  if (s === "contactado") return "seguimiento";
  if (s === "comparativa") return "comparativa";
  if (s === "contrato") return "contrato";
  if (s === "cerrado") return "cerrado";
  if (s === "perdido") return "reenganche";
  return "primero";
}

// ✅ normaliza teléfono para wa.me (solo dígitos)
function normalizePhoneForWa(raw: string) {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  return digits;
}

export default function LeadDetalleContenido() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any)?.id || "");

  const [lead, setLead] = useState<Lead | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ En vez de saving boolean, usamos contador de tareas (evita “se ha parado” por anidación)
  const [busyCount, setBusyCount] = useState(0);
  const saving = busyCount > 0;

  const runBusy = async <T,>(fn: () => Promise<T>) => {
    setBusyCount((b) => b + 1);
    try {
      return await fn();
    } finally {
      setBusyCount((b) => Math.max(0, b - 1));
    }
  };

  const [docsOpen, setDocsOpen] = useState(false);
  const [docs, setDocs] = useState<LeadDocumento[]>([]);
  const [docNombre, setDocNombre] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);

  const [estado, setEstado] = useState<EstadoKey>("pendiente");
  const [notas, setNotas] = useState("");
  const [proximaAccion, setProximaAccion] = useState("");
  const [proximaAccionEn, setProximaAccionEn] = useState(""); // datetime-local string
  const [notaRapida, setNotaRapida] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);


  const telWa = useMemo(() => normalizePhoneForWa(lead?.telefono || ""), [lead?.telefono]);

  const cargar = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const data = (await fetchJson(`/api/crm/leads/${id}`)) as Lead;
      setLead(data);

      setEstado(((data.estado || "pendiente").toLowerCase() as EstadoKey) || "pendiente");
      setNotas(data.notas || "");
      setProximaAccion(data.proximaAccion || "");
      setProximaAccionEn(data.proximaAccionEn ? new Date(data.proximaAccionEn).toISOString().slice(0, 16) : "");

      const acts = (await fetchJson(`/api/crm/leads/${id}/actividades`)) as { items: Actividad[] };
      setActividades(Array.isArray(acts?.items) ? acts.items : []);
    } catch (e: any) {
      setError(e?.message || "Error al cargar el lead");
      setLead(null);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarDocumentos = async () => {
    if (!id) return;
    setDocsLoading(true);
    try {
      const data = await fetchJson(`/api/crm/leads/${id}/documentos`);
      setDocs(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const subirDocumento = async () => {
    if (!id) return;
    if (!docFile) {
        setToastMsg("Documento subido ✅");
        setTimeout(() => setToastMsg(null), 2000);

      return;
    }

    await runBusy(async () => {
      try {
        const form = new FormData();
        form.append("file", docFile);
        if (docNombre.trim()) form.append("nombre", docNombre.trim());

        const res = await fetch(`/api/crm/leads/${id}/documentos/upload`, {
          method: "POST",
          body: form,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Error subiendo documento");

        setToastMsg("Documento subido ✅");
        setTimeout(() => setToastMsg(null), 2000);


        setDocFile(null);
        setDocNombre("");
        await cargarDocumentos();
        await cargar(); // refresca timeline (porque el upload crea actividad)
      } catch (e: any) {
        setToastMsg(e?.message || "No se pudo subir");
        setTimeout(() => setToastMsg(null), 2600);
      }
    });
  };

  // ✅ Genera un link firmado (7 días) para abrir/compartir documentos
  // ✅ Genera link público (token) para compartir sin login
  const getShareDocUrl = async (docId: number) => {
    const data = await fetchJson(`/api/crm/leads/${id}/documentos/${docId}/share`, {
      method: "POST",
    });
    return String(data?.shareUrl || "").trim();
  };

  // ✅ Abrir doc en CRM: puedes abrir firmado (como lo tienes)
  // (lo dejo igual)
  const getSignedDocUrl = async (docId: number) => {
    const data = await fetchJson(`/api/crm/leads/${id}/documentos/${docId}/signed`);
    return String(data?.url || "").trim();
  };

  const abrirDoc = async (docId: number) => {
    await runBusy(async () => {
      try {
        const shareUrl = await getShareDocUrl(docId); // ✅ usa el share
        if (!shareUrl) throw new Error("No se pudo generar el enlace público");
        window.open(shareUrl, "_blank", "noopener,noreferrer"); // ✅ abre tu endpoint
      } catch (e: any) {
        setToastMsg(e?.message || "No se pudo abrir el documento");
        setTimeout(() => setToastMsg(null), 2500);
      }
    });
  };


  // ✅ Copiar enlace: COPIA EL SHARE (no el signed)
  const copiarLinkDoc = async (docId: number) => {
    await runBusy(async () => {
      try {
        const shareUrl = await getShareDocUrl(docId);
        if (!shareUrl) throw new Error("No se pudo generar el enlace para compartir");
        await navigator.clipboard.writeText(shareUrl);
        setToastMsg("Enlace para cliente copiado ✅");
        setTimeout(() => setToastMsg(null), 1800);
      } catch (e: any) {
        setToastMsg(e?.message || "No se pudo copiar el enlace");
        setTimeout(() => setToastMsg(null), 2500);
      }
    });
  };



  // ✅ Tracking A/B: registrar un "envío" de plantilla (no bloquea el flujo si falla)
  const trackPlantillaEnvio = async (opts: {
    leadId: number;
    canal?: string;
    etapa: string;
    variante: "A" | "B";
    plantillaId?: number | null;
  }) => {
    try {
      await fetch("/api/crm/plantillas/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: opts.leadId,
          canal: opts.canal || "whatsapp",
          etapa: opts.etapa,
          variante: opts.variante,
          plantillaId: opts.plantillaId ?? null,
        }),
      });
    } catch {
      // tracking no debe romper el flujo
    }
  };

  const crearActividad = async (
    tipo: string,
    titulo: string,
    detalle?: string | null,
    opts?: { refresh?: boolean; silentToast?: boolean }
  ) => {
    if (!id) return;

    const refresh = opts?.refresh ?? true;
    const silentToast = opts?.silentToast ?? false;

    try {
      await fetchJson(
        `/api/crm/leads/${id}/actividades`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo, titulo, detalle: detalle ?? null }),
        },
        15000
      );

      if (!silentToast) {
        setToastMsg("Actividad registrada ✅");
        setTimeout(() => setToastMsg(null), 2000);
      }

      if (refresh) await cargar();
    } catch (e: any) {
      setToastMsg(e?.message || "No se pudo registrar la actividad");
      setTimeout(() => setToastMsg(null), 2600);
    }
  };

  const guardarGestion = async () => {
    if (!id) return;

    await runBusy(async () => {
      try {
        await fetchJson(
          `/api/crm/leads/${id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              estado,
              notas: notas || null,
              proximaAccion: proximaAccion || null,
              proximaAccionEn: proximaAccionEn ? new Date(proximaAccionEn).toISOString() : null,
            }),
          },
          15000
        );

        setToastMsg("Guardado ✅ (con actividad automática)");
        setTimeout(() => setToastMsg(null), 2200);

        await cargar();
      } catch (e: any) {
        setToastMsg(e?.message || "No se pudo guardar");
        setTimeout(() => setToastMsg(null), 2600);
      }
    });
  };

  // ✅ Enviar WhatsApp: ENVÍA EL SHARE (token)
  const enviarWhatsAppDoc = async (doc: LeadDocumento) => {
    const tel = telWa;
    if (!tel) {
      setToastMsg("⚠️ Teléfono inválido");
      setTimeout(() => setToastMsg(null), 2000);
      return;
    }

    await runBusy(async () => {
      try {
        const shareUrl = await getShareDocUrl(doc.id);
        if (!shareUrl) throw new Error("No se pudo generar el enlace para compartir");

        const msg = `Hola ${lead?.nombre}, te envío el documento: ${doc.nombre}\n\n${shareUrl}`;
        window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");

        await crearActividad("whatsapp", "Documento enviado por WhatsApp", `${doc.nombre}\n${shareUrl}`, {
          refresh: true,
          silentToast: true,
        });

        setToastMsg("WhatsApp preparado ✅");
        setTimeout(() => setToastMsg(null), 1800);
      } catch (e: any) {
        setToastMsg(e?.message || "No se pudo preparar WhatsApp");
        setTimeout(() => setToastMsg(null), 2500);
      }
    });
  };

  async function crearContratacionDesdeLead() {
    if (!lead) throw new Error("Lead no cargado");

    // 1) Coge una sección por defecto (la primera activa)
    const secRes = await fetch("/api/crm/secciones", { cache: "no-store" });
    const secJson = await secRes.json();

    // tu endpoint de secciones puede devolver {ok:true, items:[...]} o array directo
    const secciones = Array.isArray(secJson)
      ? secJson
      : Array.isArray(secJson?.items)
        ? secJson.items
        : [];

    if (!secciones.length) throw new Error("No hay secciones activas. Crea una sección primero.");

    const seccionId = Number(secciones[0].id);

    // 2) Crea contratación desde lead con seccionId
    const res = await fetch("/api/crm/contrataciones/desde-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead.id,
        seccionId, // asegúrate que esto es number
      }),
    });

    const txt = await res.text();
    let json: any = null;
    try { json = JSON.parse(txt); } catch {}

    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || `No se pudo crear (${res.status})`);
    }

    // ✅ si todo bien, aquí tienes la contratación creada
    const contratacion = json.item || json.contratacion;


    // 3) Te mando a contrataciones (o a detalle si lo haces)
    router.push("/contrataciones");
  }




  // ✅ WhatsApp AUTO: resolve plantilla + tracking + actividad + abrir WhatsApp
  const enviarWhatsAppAutomatico = async () => {
    if (!lead) return;

    // ✅ usa el estado seleccionado (puede estar cambiado y aún no guardado)
    const etapa = estadoToEtapa(estado);

    if (!telWa) {
      setToastMsg("⚠️ El lead no tiene teléfono válido");
      setTimeout(() => setToastMsg(null), 2400);
      return;
    }

    await runBusy(async () => {
      try {
        // 1) Resolver plantilla + variante + texto renderizado
        const resolved = await fetchJson(
          "/api/crm/plantillas/resolve",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadId: lead.id,
              canal: "whatsapp",
              etapa,
            }),
          },
          15000
        );

        const textoFinal = String(resolved?.texto || "").trim();
        const variante = (resolved?.variante === "B" ? "B" : "A") as "A" | "B";
        const plantillaId = (typeof resolved?.plantillaId === "number" ? resolved.plantillaId : null) as number | null;

        if (!textoFinal) throw new Error("La plantilla no devolvió texto.");

        // 2) Tracking A/B (no bloquea)
        await trackPlantillaEnvio({
          leadId: lead.id,
          canal: "whatsapp",
          etapa,
          variante,
          plantillaId,
        });

        // 3) Actividad timeline (sí queremos registrarla)
        await crearActividad(
          "whatsapp",
          "WhatsApp enviado",
          `Etapa: ${etapa} · Variante: ${variante}${plantillaId ? ` · PlantillaID: ${plantillaId}` : ""}\n\nTexto:\n${textoFinal}`,
          { refresh: true, silentToast: true }
        );

        // 4) Abrir WhatsApp con el texto generado
        const url = `https://wa.me/${telWa}?text=${encodeURIComponent(textoFinal)}`;
        window.open(url, "_blank", "noopener,noreferrer");

        setToastMsg("WhatsApp preparado ✅");
        setTimeout(() => setToastMsg(null), 2000);
      } catch (e: any) {
        setToastMsg(e?.message || "No se pudo preparar WhatsApp");
        setTimeout(() => setToastMsg(null), 2600);
      }
    });
  };

  if (loading) {
    return <div className="p-6 text-slate-200 text-base">Cargando Lead…</div>;
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-red-900/70 border border-red-500/70 text-red-50 rounded-2xl px-5 py-4 text-base">
          <p className="font-semibold mb-1 text-lg">Error</p>
          <p>{error || "Lead no encontrado"}</p>
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
    <>
      <div className="p-6 space-y-5 text-base">
        {toastMsg && (
          <div className="fixed z-50 bottom-6 right-6 rounded-2xl bg-emerald-900/35 border border-emerald-500/40 text-emerald-100 px-4 py-3 font-semibold shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            {toastMsg}
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
              Agente: <span className="font-semibold text-slate-200">{lead.agente?.nombre || "—"}</span> · Lugar:{" "}
              <span className="font-semibold text-slate-200">{lead.lugar?.nombre || "—"}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${lead.telefono}`}
              onClick={() => runBusy(() => crearActividad("llamada", "Llamada realizada", "Se intentó contactar por teléfono."))}
              className="inline-flex px-4 py-2 rounded-full bg-blue-900/35 border border-blue-500/40 text-blue-100 text-sm font-extrabold hover:bg-blue-900/45"
            >
              📞 Registrar llamada
            </a>

            <button
              disabled={saving}
              onClick={enviarWhatsAppAutomatico}
              className="inline-flex px-4 py-2 rounded-full bg-emerald-600/15 border border-emerald-400 text-emerald-100 text-sm font-extrabold hover:bg-emerald-600/25 disabled:opacity-60"
              title="Auto: elige plantilla por etapa + A/B + tracking + abre WhatsApp"
            >
              💬 WhatsApp (Auto A/B)
            </button>

            <button
              disabled={saving}
              onClick={() =>
                runBusy(() =>
                  crearActividad("accion", "Acción registrada", "Acción manual registrada desde Lead Center PRO.")
                )
              }
              className="inline-flex px-4 py-2 rounded-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-extrabold hover:border-emerald-400 disabled:opacity-60"
            >
              ⚡ Acción
            </button>

            <button
              onClick={() => crearContratacionDesdeLead().catch((e) => toast.error(String(e?.message || e)))}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-[13px] font-extrabold text-slate-950"
            >
              Crear contratación
            </button>

            <button
              disabled={saving}
              onClick={async () => {
                setDocsOpen(true);
                await cargarDocumentos();
              }}
              className="inline-flex px-4 py-2 rounded-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-extrabold hover:border-emerald-400 disabled:opacity-60"
            >
              📎 Documentos
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
                onChange={(e) => setEstado(e.target.value as EstadoKey)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-base outline-none focus:border-emerald-400"
              >
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
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
                value={proximaAccionEn || ""}
                onChange={(e) => setProximaAccionEn(e.target.value)}
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
                    await runBusy(() => crearActividad("nota", "Nota", notaRapida.trim()));
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
                    <div className="absolute left-4 top-0 h-full w-px bg-slate-800" />
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
                        <div className="mt-2 text-base text-slate-200 leading-relaxed whitespace-pre-line">{a.detalle}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                disabled={saving}
                onClick={() =>
                  runBusy(() =>
                    crearActividad(
                      "estado",
                      "Revisión de estado",
                      `Estado revisado: ${(lead.estado || "pendiente").toUpperCase()}`
                    )
                  )
                }
                className="px-4 py-2 rounded-full bg-amber-600/15 border border-amber-400 text-amber-100 text-sm font-extrabold hover:bg-amber-600/25 disabled:opacity-60"
              >
                ✅ Registrar revisión estado
              </button>

              <button
                disabled={saving}
                onClick={() =>
                  runBusy(() =>
                    crearActividad(
                      "accion",
                      "Seguimiento",
                      `Seguimiento: ${lead.proximaAccion || "—"} · ${fmt(lead.proximaAccionEn)}`
                    )
                  )
                }
                className="px-4 py-2 rounded-full bg-purple-600/15 border border-purple-400 text-purple-100 text-sm font-extrabold hover:bg-purple-600/25 disabled:opacity-60"
              >
                📌 Registrar seguimiento
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MODAL DOCUMENTOS */}
      {docsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-950 border border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-white">📎 Documentos del lead</h3>
              <button
                onClick={() => setDocsOpen(false)}
                className="px-3 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-200 font-extrabold hover:border-emerald-400"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={docNombre}
                onChange={(e) => setDocNombre(e.target.value)}
                placeholder="Nombre del documento (opcional)"
                className="md:col-span-2 w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-emerald-400"
              />
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                disabled={saving || !docFile}
                onClick={subirDocumento}
                className="px-4 py-2 rounded-full bg-emerald-600/20 border border-emerald-400 text-emerald-100 font-extrabold hover:bg-emerald-600/30 disabled:opacity-60"
              >
                Subir documento
              </button>

              <button
                disabled={saving}
                onClick={cargarDocumentos}
                className="px-4 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-100 font-extrabold hover:border-emerald-400 disabled:opacity-60"
              >
                Recargar
              </button>
            </div>

            <div className="mt-5 space-y-3 max-h-[50vh] overflow-auto pr-1">
              {docsLoading ? (
                <div className="text-slate-300">Cargando…</div>
              ) : docs.length === 0 ? (
                <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 text-slate-300">
                  No hay documentos todavía.
                </div>
              ) : (
                docs.map((d) => (
                  <div key={d.id} className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="text-white font-extrabold">{d.nombre}</div>
                        <div className="text-sm text-slate-400">
                          {fmt(d.creadoEn)}
                          {d.creadoPor?.nombre ? ` · ${d.creadoPor.nombre}` : ""}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={saving}
                          onClick={() => abrirDoc(d.id)}
                          className="px-3 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-100 text-sm font-extrabold hover:border-emerald-400 disabled:opacity-60"
                        >
                          Abrir
                        </button>

                        <button
                          disabled={saving}
                          onClick={() => copiarLinkDoc(d.id)}
                          className="px-3 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-100 text-sm font-extrabold hover:border-emerald-400 disabled:opacity-60"
                        >
                          Copiar enlace
                        </button>

                        <button
                          disabled={saving}
                          onClick={() => enviarWhatsAppDoc(d)}
                          className="px-3 py-2 rounded-full bg-emerald-600/15 border border-emerald-400 text-emerald-100 text-sm font-extrabold hover:bg-emerald-600/25 disabled:opacity-60"
                        >
                          Enviar WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
