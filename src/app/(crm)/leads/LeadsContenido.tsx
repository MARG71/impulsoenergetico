"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LeadMini = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado?: string | null;
  creadoEn: string;
  proximaAccion?: string | null;
  proximaAccionEn?: string | null;
  agente?: { id: number; nombre: string | null } | null;
  lugar?: { id: number; nombre: string | null } | null;

  // si tu /tareas ya devuelve esto, lo mostramos. Si no, no pasa nada.
  score?: number;
  recomendacion?: string;
  lastActAt?: string | null;
};

type LeadStats = {
  total: number;
  estados: Record<string, number>;
  ratios?: Record<string, number>;
  topAgentes?: Array<{ agenteId: number | null; nombre: string; total: number }>;
  topLugares?: Array<{ lugarId: number | null; nombre: string; total: number }>;
  meta?: any;
};

type Tareas = {
  pendientes?: LeadMini[];
  vencidas?: LeadMini[];
  hoy?: LeadMini[];
  alertas?: {
    vencidas48h?: LeadMini[];
    sinActividad?: LeadMini[];
    calientes?: LeadMini[];
  };
};

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

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("es-ES");
  } catch {
    return String(dt);
  }
}

function cleanPhone(raw?: string | null) {
  return String(raw ?? "").replace(/[^\d+]/g, "");
}

function buildWaLink(telefono: string, msg: string) {
  const tel = cleanPhone(telefono);
  if (!tel) return null;
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
}

function pillEstado(estado?: string | null) {
  const e = String(estado || "pendiente").toLowerCase();
  const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border";
  if (e === "pendiente") return `${base} bg-slate-900/60 text-slate-200 border-slate-700`;
  if (e === "contactado") return `${base} bg-blue-900/35 text-blue-100 border-blue-500/40`;
  if (e === "comparativa") return `${base} bg-emerald-900/25 text-emerald-100 border-emerald-500/40`;
  if (e === "contrato") return `${base} bg-amber-900/35 text-amber-100 border-amber-500/40`;
  if (e === "cerrado") return `${base} bg-emerald-600/20 text-emerald-100 border-emerald-400/70`;
  if (e === "perdido") return `${base} bg-red-900/35 text-red-100 border-red-500/40`;
  return `${base} bg-slate-900/60 text-slate-200 border-slate-700`;
}

function pillScore(score?: number) {
  const s = Math.max(0, Math.min(100, Number(score ?? 0)));
  const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border";
  if (s >= 80) return `${base} bg-emerald-600/20 text-emerald-100 border-emerald-400/70`;
  if (s >= 70) return `${base} bg-green-900/25 text-green-100 border-green-500/40`;
  if (s >= 50) return `${base} bg-amber-900/25 text-amber-100 border-amber-500/40`;
  if (s >= 30) return `${base} bg-blue-900/25 text-blue-100 border-blue-500/40`;
  return `${base} bg-slate-900/60 text-slate-200 border-slate-700`;
}

function addHoursISO(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function tomorrowAt10ISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

function isVencida(proximaAccionEn?: string | null) {
  if (!proximaAccionEn) return false;
  const t = new Date(proximaAccionEn).getTime();
  return Number.isFinite(t) && t < Date.now();
}

function leadEstado(estado?: string | null) {
  return String(estado || "pendiente").toLowerCase();
}

/** Plantillas (2.6) — luego las hacemos editables desde CRM */
function plantillaWA(lead: LeadMini, kind: "primero" | "seguimiento" | "factura" | "oferta" | "cierre") {
  const nombre = lead.nombre || "";
  if (kind === "primero") {
    return `Hola ${nombre}, soy de Impulso Energético. Te escribo por tu solicitud para ahorrar en tus facturas. ¿Te viene bien si lo vemos?`;
  }
  if (kind === "seguimiento") {
    return `Hola ${nombre}, te hago un seguimiento 😊 ¿Pudiste verlo? Si quieres, lo resolvemos en 2 minutos.`;
  }
  if (kind === "factura") {
    return `Genial ${nombre}. Para prepararte el ahorro exacto necesito una foto de tu última factura (o CUPS y potencia). ¿Me la puedes enviar por aquí?`;
  }
  if (kind === "oferta") {
    return `Perfecto ${nombre}. Te preparo una oferta con el mejor ahorro posible. ¿Prefieres que te la envíe por WhatsApp o por email?`;
  }
  return `Vamos a cerrarlo ${nombre} ✅ Si te parece, te dejo el contrato listo hoy. ¿Te viene bien que lo firmemos ahora?`;
}

type Playbook = {
  key: string;
  label: string;
  hint: string;
  tone: "emerald" | "blue" | "amber" | "purple" | "red" | "slate";
  run: (lead: LeadMini) => Promise<void>;
};

export default function LeadsContenido() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rango, setRango] = useState<"hoy" | "7d" | "30d">("30d");
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [tareas, setTareas] = useState<Tareas | null>(null);

  const [q, setQ] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showOk = (msg: string) => {
    setToast({ type: "ok", msg });
    setTimeout(() => setToast(null), 2200);
  };
  const showErr = (msg: string) => {
    setToast({ type: "err", msg });
    setTimeout(() => setToast(null), 3200);
  };

  const cargar = async () => {
    setLoading(true);
    setError(null);

    try {
      const t = (await fetchJson("/api/crm/leads/tareas")) as Tareas;
      setTareas(t);

      const s = (await fetchJson(`/api/crm/leads/stats?rango=${rango}`)) as LeadStats;
      setStats(s);
    } catch (e: any) {
      setError(e?.message || "Error cargando Lead Center");
      setStats(null);
      setTareas(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango]);

  const pendientes = tareas?.pendientes || [];
  const hoy = tareas?.hoy || [];
  const vencidas = tareas?.vencidas || [];

  const alertas = tareas?.alertas || {};
  const calientes = alertas.calientes || [];
  const sinActividad = alertas.sinActividad || [];
  const vencidas48h = alertas.vencidas48h || [];

  const filtrar = (items: LeadMini[]) => {
    const term = q.trim().toLowerCase();
    if (!term) return items;

    return items.filter((l) => {
      const s = `${l.id} ${l.nombre} ${l.email} ${l.telefono} ${l.estado ?? ""} ${l.agente?.nombre ?? ""} ${
        l.lugar?.nombre ?? ""
      } ${(l.recomendacion ?? "")}`.toLowerCase();
      return s.includes(term);
    });
  };

  const pendientesF = useMemo(() => filtrar(pendientes), [q, tareas]); // eslint-disable-line
  const hoyF = useMemo(() => filtrar(hoy), [q, tareas]); // eslint-disable-line
  const vencidasF = useMemo(() => filtrar(vencidas), [q, tareas]); // eslint-disable-line

  // --------- Acciones (API existente) ----------
  const postActividad = async (leadId: number, tipo: string, titulo: string, detalle?: string | null) => {
    await fetchJson(`/api/crm/leads/${leadId}/actividades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, titulo, detalle: detalle ?? null }),
    });
  };

  const patchLead = async (
    leadId: number,
    data: Partial<{
      estado: string;
      notas: string | null;
      proximaAccion: string | null;
      proximaAccionEn: string | null;
    }>
  ) => {
    await fetchJson(`/api/crm/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const doWhatsApp = async (l: LeadMini, msg: string, titulo = "WhatsApp enviado") => {
    const link = buildWaLink(String(l.telefono || ""), msg);
    if (!link) throw new Error("Teléfono no válido para WhatsApp");
    await postActividad(l.id, "whatsapp", titulo, msg);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const doLlamada = async (l: LeadMini, titulo = "Llamada realizada") => {
    await postActividad(l.id, "llamada", titulo, "Se registró una llamada desde Lead Center PRO.");
    const tel = cleanPhone(l.telefono);
    if (tel) window.location.href = `tel:${tel}`;
  };

  // --------- 2.6 PLAYBOOK ----------
  const getPlaybook = (): ((lead: LeadMini) => Playbook) => {
    return (lead) => {
      const estado = leadEstado(lead.estado);
      const vencida = isVencida(lead.proximaAccionEn);
      const score = Number(lead.score ?? 0);

      // 1) Si está vencida => Recuperación
      if (vencida) {
        return {
          key: "recuperacion",
          label: "▶ Recuperar",
          hint: "WhatsApp de seguimiento + próxima en 24h",
          tone: "red",
          run: async (l) => {
            await doWhatsApp(l, plantillaWA(l, "seguimiento"), "Seguimiento WhatsApp");
            await patchLead(l.id, { proximaAccion: "Llamar (recuperación)", proximaAccionEn: addHoursISO(24) });
          },
        };
      }

      // 2) Pendiente => Primer contacto
      if (estado === "pendiente") {
        return {
          key: "primer_contacto",
          label: "▶ Primer contacto",
          hint: "WhatsApp + próxima mañana 10:00",
          tone: "emerald",
          run: async (l) => {
            await doWhatsApp(l, plantillaWA(l, "primero"), "Primer WhatsApp");
            await patchLead(l.id, { proximaAccion: "Llamar (seguimiento)", proximaAccionEn: tomorrowAt10ISO() });
          },
        };
      }

      // 3) Contactado => Pedir factura / llamada
      if (estado === "contactado") {
        // si score alto, apretar: llamada + agenda
        if (score >= 70) {
          return {
            key: "llamada_cierre",
            label: "▶ Llamar (cierre)",
            hint: "Llamada + próxima en 24h",
            tone: "amber",
            run: async (l) => {
              await doLlamada(l, "Llamada (cierre)");
              await patchLead(l.id, { proximaAccion: "WhatsApp con factura", proximaAccionEn: addHoursISO(24) });
            },
          };
        }

        return {
          key: "pedir_factura",
          label: "▶ Pedir factura",
          hint: "WhatsApp pidiendo factura + próxima mañana 10:00",
          tone: "blue",
          run: async (l) => {
            await doWhatsApp(l, plantillaWA(l, "factura"), "Solicitud de factura");
            await patchLead(l.id, { proximaAccion: "Llamar (si no responde)", proximaAccionEn: tomorrowAt10ISO() });
          },
        };
      }

      // 4) Comparativa => Enviar oferta / empujar decisión
      if (estado === "comparativa") {
        return {
          key: "enviar_oferta",
          label: "▶ Enviar oferta",
          hint: "WhatsApp oferta + próxima en 24h",
          tone: "purple",
          run: async (l) => {
            await doWhatsApp(l, plantillaWA(l, "oferta"), "Oferta enviada");
            await patchLead(l.id, { proximaAccion: "Llamar (cierre oferta)", proximaAccionEn: addHoursISO(24) });
          },
        };
      }

      // 5) Contrato => Empujar firma
      if (estado === "contrato") {
        return {
          key: "firma",
          label: "▶ Empujar firma",
          hint: "WhatsApp cierre + próxima en 6h",
          tone: "amber",
          run: async (l) => {
            await doWhatsApp(l, plantillaWA(l, "cierre"), "Cierre / firma");
            await patchLead(l.id, { proximaAccion: "Llamar (firma)", proximaAccionEn: addHoursISO(6) });
          },
        };
      }

      // 6) Cerrado/Perdido => Acción suave
      if (estado === "cerrado") {
        return {
          key: "referidos",
          label: "▶ Pedir referidos",
          hint: "WhatsApp referidos + próxima en 7 días",
          tone: "emerald",
          run: async (l) => {
            const msg = `Gracias ${l.nombre || ""} ✅ Si conoces a alguien que quiera ahorrar en luz/gas, pásame su contacto y le ayudamos encantados.`;
            await doWhatsApp(l, msg, "Referidos");
            await patchLead(l.id, { proximaAccion: "Revisar referidos", proximaAccionEn: addHoursISO(24 * 7) });
          },
        };
      }

      return {
        key: "accion",
        label: "▶ Siguiente",
        hint: "Abrir lead",
        tone: "slate",
        run: async (l) => {
          router.push(`/leads/${l.id}`);
        },
      };
    };
  };

  const choosePlaybook = useMemo(() => getPlaybook(), [router]);

  const runPlaybook = async (l: LeadMini) => {
    const pb = choosePlaybook(l);
    setBusyId(l.id);
    try {
      await pb.run(l);
      showOk(`${pb.label.replace("▶ ", "")} ✅ (#${l.id})`);
      await cargar();
    } catch (e: any) {
      showErr(e?.message || "No se pudo ejecutar la acción");
    } finally {
      setBusyId(null);
    }
  };

  // ------------------------------------------

  if (loading) return <div className="p-6 text-slate-200">Cargando leads…</div>;

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-2xl rounded-3xl bg-red-900/40 border border-red-500/40 text-red-100 p-5">
          <div className="text-xl font-extrabold">Error</div>
          <div className="mt-2">{error}</div>
          <button
            onClick={cargar}
            className="mt-4 inline-flex px-4 py-2 rounded-full bg-slate-950 border border-slate-700 text-slate-100 font-bold hover:border-emerald-400"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const toneBtn = (tone: Playbook["tone"]) => {
    const base =
      "inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-extrabold border hover:opacity-[0.95] disabled:opacity-60";
    if (tone === "emerald") return `${base} bg-emerald-600/15 border-emerald-400 text-emerald-100`;
    if (tone === "blue") return `${base} bg-blue-900/35 border-blue-500/40 text-blue-100`;
    if (tone === "amber") return `${base} bg-amber-900/25 border-amber-500/40 text-amber-100`;
    if (tone === "purple") return `${base} bg-purple-600/15 border-purple-400 text-purple-100`;
    if (tone === "red") return `${base} bg-red-900/25 border-red-500/40 text-red-100`;
    return `${base} bg-slate-950 border-slate-700 text-slate-100 hover:border-emerald-400`;
  };

  const LeadRow = ({ l }: { l: LeadMini }) => {
    const isBusy = busyId === l.id;
    const pb = choosePlaybook(l);

    return (
      <button
        onClick={() => router.push(`/leads/${l.id}`)}
        className="w-full text-left rounded-2xl bg-slate-900/60 border border-slate-800 px-4 py-3 hover:border-emerald-500/40 transition"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <div className="text-white font-extrabold text-base">
              #{l.id} · {l.nombre || "Sin nombre"}
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <span className={pillScore(l.score)}>{`SCORE ${Math.round(Number(l.score ?? 0))}`}</span>
              <span className={pillEstado(l.estado)}>{String(l.estado || "pendiente").toUpperCase()}</span>
            </div>
          </div>

          <div className="text-slate-300 text-sm">
            {l.email} · {l.telefono}
          </div>

          <div className="text-slate-400 text-sm">
            Próxima: <span className="font-bold text-slate-200">{l.proximaAccion || "—"}</span> ·{" "}
            <span className="font-bold text-slate-200">{fmt(l.proximaAccionEn)}</span>
          </div>

          {/* Playbook + recomendación */}
          <div className="mt-1 rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2">
            <div className="text-xs font-extrabold text-emerald-200">🧠 Playbook</div>
            <div className="text-sm text-slate-200 mt-0.5">
              <span className="font-extrabold">{pb.label.replace("▶ ", "")}</span>
              <span className="text-slate-400"> · {pb.hint}</span>
            </div>

            {l.recomendacion && (
              <div className="text-sm text-slate-300 mt-1">
                <span className="text-slate-500">Recomendación:</span> {l.recomendacion}
              </div>
            )}

            <div className="text-xs text-slate-500 mt-1">
              Última actividad: <span className="font-semibold text-slate-300">{fmt(l.lastActAt ?? null)}</span>
            </div>
          </div>

          {/* Botonera 2.6 */}
          <div className="mt-2 flex flex-wrap gap-2">
            {/* botón principal */}
            <button
              type="button"
              disabled={isBusy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                runPlaybook(l);
              }}
              className={toneBtn(pb.tone)}
              title="Ejecuta el siguiente paso recomendado (actividad + próxima acción)"
            >
              {pb.label}
            </button>

            {/* secundarios */}
            <button
              type="button"
              disabled={isBusy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // WhatsApp rápido (seguimiento)
                setBusyId(l.id);
                (async () => {
                  try {
                    await doWhatsApp(l, plantillaWA(l, "seguimiento"), "Seguimiento WhatsApp");
                    showOk(`WhatsApp ✅ (#${l.id})`);
                    await cargar();
                  } catch (err: any) {
                    showErr(err?.message || "Error WhatsApp");
                  } finally {
                    setBusyId(null);
                  }
                })();
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-600/10 border border-emerald-400 text-emerald-100 text-xs font-extrabold hover:bg-emerald-600/18 disabled:opacity-60"
              title="Seguimiento rápido"
            >
              💬 Seguimiento
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/leads/${l.id}`);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-950 border border-slate-700 text-slate-100 text-xs font-extrabold hover:border-emerald-400 disabled:opacity-60"
              title="Abrir detalle"
            >
              ⚡ Abrir
            </button>

            {isBusy && (
              <span className="inline-flex items-center px-3 py-2 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold">
                Ejecutando…
              </span>
            )}
          </div>

          <div className="text-slate-500 text-xs mt-1">
            Agente: {l.agente?.nombre || "—"} · Lugar: {l.lugar?.nombre || "—"} · Creado: {fmt(l.creadoEn)}
          </div>
        </div>
      </button>
    );
  };

  const Card = ({ title, items }: { title: string; items: LeadMini[] }) => (
    <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-extrabold text-white">{title}</div>
        <div className="text-sm text-slate-400 font-bold">{items.length}</div>
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-5 text-slate-400">
            Sin leads en esta sección.
          </div>
        ) : (
          items.slice(0, 12).map((l) => <LeadRow key={l.id} l={l} />)
        )}
      </div>

      {items.length > 12 && (
        <div className="mt-3 text-xs text-slate-500 font-semibold">
          Mostrando 12 de {items.length}. (Luego metemos paginación)
        </div>
      )}
    </div>
  );

  const AlertBox = ({ title, subtitle, items }: { title: string; subtitle: string; items: LeadMini[] }) => (
    <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-white font-extrabold text-base">{title}</div>
          <div className="text-slate-400 text-sm">{subtitle}</div>
        </div>
        <div className="text-slate-300 font-extrabold text-lg">{items.length}</div>
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 text-slate-400 text-sm">
            Todo controlado ✅
          </div>
        ) : (
          items.slice(0, 5).map((l) => (
            <button
              key={l.id}
              onClick={() => router.push(`/leads/${l.id}`)}
              className="w-full text-left rounded-2xl bg-slate-900/60 border border-slate-800 px-3 py-2 hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-slate-100 font-extrabold text-sm">
                  #{l.id} · {l.nombre}
                </div>
                <span className={pillScore(l.score)}>{`S ${Math.round(Number(l.score ?? 0))}`}</span>
              </div>
              <div className="text-slate-300 text-xs mt-0.5">{choosePlaybook(l).label.replace("▶ ", "")}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={[
            "fixed z-50 bottom-6 right-6 rounded-2xl px-4 py-3 font-semibold border shadow-[0_0_25px_rgba(0,0,0,0.25)]",
            toast.type === "ok"
              ? "bg-emerald-900/35 border-emerald-500/40 text-emerald-100"
              : "bg-red-900/35 border-red-500/40 text-red-100",
          ].join(" ")}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Lead Center PRO</h1>
          <p className="text-slate-300 mt-1">Auto-Playbook: ejecuta el siguiente paso en 1 click.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono, agente, lugar…"
            className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 font-bold outline-none focus:border-emerald-400 w-[340px] max-w-full"
          />

          <select
            value={rango}
            onChange={(e) => setRango(e.target.value as any)}
            className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 font-bold"
          >
            <option value="hoy">Hoy</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>

          <button
            onClick={cargar}
            className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 font-bold hover:border-emerald-400"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <AlertBox title="🔥 Calientes" subtitle="Prioridad máxima" items={calientes} />
        <AlertBox title="🕳️ Sin actividad" subtitle="Se enfrían (tócalos hoy)" items={sinActividad} />
        <AlertBox title="⏰ Vencidas +48h" subtitle="Recuperación urgente" items={vencidas48h} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-4">
          <div className="text-slate-300 font-bold">Total</div>
          <div className="text-3xl font-extrabold text-white mt-1">{stats?.total ?? 0}</div>
        </div>

        <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-4">
          <div className="text-slate-300 font-bold">Contactado</div>
          <div className="text-3xl font-extrabold text-white mt-1">{stats?.estados?.contactado ?? 0}</div>
        </div>

        <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-4">
          <div className="text-slate-300 font-bold">Comparativa</div>
          <div className="text-3xl font-extrabold text-white mt-1">{stats?.estados?.comparativa ?? 0}</div>
        </div>

        <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-4">
          <div className="text-slate-300 font-bold">Contrato</div>
          <div className="text-3xl font-extrabold text-white mt-1">{stats?.estados?.contrato ?? 0}</div>
        </div>
      </div>

      {/* Tareas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="🔥 Vencidas" items={vencidasF} />
        <Card title="📅 Para hoy" items={hoyF} />
        <Card title="🧠 Pendientes" items={pendientesF} />
      </div>
    </div>
  );
}
