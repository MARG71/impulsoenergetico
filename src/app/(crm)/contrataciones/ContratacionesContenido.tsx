"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type Sec = {
  id: number;
  nombre: string;
  subSecciones: Array<{ id: number; nombre: string; activa: boolean }>;
};

type Contratacion = {
  id: number;
  estado: "BORRADOR" | "PENDIENTE" | "CONFIRMADA" | "CANCELADA";
  nivel: "C1" | "C2" | "C3" | "ESPECIAL";
  seccionId: number;
  subSeccionId: number | null;
  baseImponible: string | null;
  totalFactura: string | null;
  notas: string | null;
  creadaEn: string;
  confirmadaEn: string | null;

  seccion?: { nombre: string };
  subSeccion?: { nombre: string } | null;

  cliente?: { id: number; nombre: string } | null;
  lead?: { id: number; nombre?: string; email?: string; telefono?: string } | null;
};

const ESTADOS: Contratacion["estado"][] = ["BORRADOR", "PENDIENTE", "CONFIRMADA", "CANCELADA"];
const NIVELES: Contratacion["nivel"][] = ["C1", "C2", "C3", "ESPECIAL"];

function pill(estado: string) {
  if (estado === "CONFIRMADA") return "bg-emerald-400/15 text-emerald-200 border-emerald-400/20";
  if (estado === "PENDIENTE") return "bg-orange-400/15 text-orange-200 border-orange-400/20";
  if (estado === "CANCELADA") return "bg-red-400/15 text-red-200 border-red-400/20";
  return "bg-white/10 text-white/80 border-white/10";
}

export default function ContratacionesContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const [secciones, setSecciones] = useState<Sec[]>([]);
  const [items, setItems] = useState<Contratacion[]>([]);
  const [loading, setLoading] = useState(true);

  const [fEstado, setFEstado] = useState<string>("TODOS");

  // Crear
  const [open, setOpen] = useState(false);
  const [seccionId, setSeccionId] = useState<number | null>(null);
  const [subSeccionId, setSubSeccionId] = useState<number | "null">("null");
  const [nivel, setNivel] = useState<Contratacion["nivel"]>("C1");
  const [baseImponible, setBaseImponible] = useState("");
  const [totalFactura, setTotalFactura] = useState("");
  const [leadId, setLeadId] = useState("");
  const [notas, setNotas] = useState("");

  const subs = useMemo(() => {
    const sec = secciones.find((s) => s.id === seccionId);
    return (sec?.subSecciones ?? []).filter((x) => x.activa);
  }, [secciones, seccionId]);

  function normalizeItems<T>(json: any): T[] {
    if (Array.isArray(json)) return json as T[];
    if (json && Array.isArray(json.items)) return json.items as T[];
    return [];
  }

  async function loadSecciones() {
    try {
      const res = await fetch("/api/crm/secciones", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error secciones");

      const arr = normalizeItems<Sec>(json);
      setSecciones(arr);
      if (!seccionId && arr.length) setSeccionId(arr[0].id);
    } catch (e: any) {
      toast.error(String(e?.message || e));
    }
  }

  async function loadContrataciones() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/contrataciones", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error contrataciones");

      const arr = normalizeItems<Contratacion>(json);
      setItems(arr);
    } catch (e: any) {
      setItems([]);
      toast.error(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  // ✅ ÚNICO método de cambio de estado (usa /estado)
  async function cambiarEstado(
    contratacionId: number,
    estado: "BORRADOR" | "PENDIENTE" | "CONFIRMADA" | "CANCELADA"
  ) {
    const res = await fetch(`/api/crm/contrataciones/${contratacionId}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });

    const txt = await res.text();
    let data: any = null;
    try { data = JSON.parse(txt); } catch {}

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `Error cambiando estado (${res.status})`);
    }
    return data.contratacion;
  }

  useEffect(() => {
    if (status !== "loading" && session) {
      loadSecciones().catch((e) => toast.error(String(e?.message || e)));
      loadContrataciones().catch((e) => toast.error(String(e?.message || e)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    if (fEstado === "TODOS") return items;
    return items.filter((x) => x.estado === fEstado);
  }, [items, fEstado]);

  async function crear() {
    if (!seccionId) return toast.error("Selecciona sección");

    const res = await fetch("/api/crm/contrataciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seccionId,
        subSeccionId: subSeccionId === "null" ? null : subSeccionId,
        nivel,
        baseImponible: baseImponible || null,
        totalFactura: totalFactura || null,
        leadId: leadId ? Number(leadId) : null,
        notas: notas || null,
        estado: "BORRADOR",
      }),
    });

    const json = await res.json();
    if (!res.ok) return toast.error(json?.error || "No se pudo crear");

    toast.success("Contratación creada");
    setOpen(false);
    setBaseImponible("");
    setTotalFactura("");
    setLeadId("");
    setNotas("");
    await loadContrataciones();
  }

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;

  const canCreate = role === "SUPERADMIN" || role === "ADMIN" || role === "AGENTE";
  const canConfirm = role === "SUPERADMIN" || role === "ADMIN";

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Contrataciones</h1>
          <p className="text-white/70">
            Centro de cierres: aquí nace el historial y el cálculo de comisiones.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
            value={fEstado}
            onChange={(e) => setFEstado(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          {canCreate && (
            <button
              onClick={() => setOpen(true)}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-extrabold text-slate-950 transition"
            >
              Nueva contratación
            </button>
          )}
        </div>
      </div>

      {/* Modal crear */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-extrabold text-lg">Nueva contratación</div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white font-extrabold">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-extrabold text-white/70 uppercase">Sección</label>
                <select
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={seccionId ?? ""}
                  onChange={(e) => {
                    setSeccionId(Number(e.target.value));
                    setSubSeccionId("null");
                  }}
                >
                  {secciones.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-white/70 uppercase">Subsección</label>
                <select
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={subSeccionId}
                  onChange={(e) => setSubSeccionId(e.target.value === "null" ? "null" : Number(e.target.value))}
                >
                  <option value="null">— General</option>
                  {subs.map((ss) => (
                    <option key={ss.id} value={ss.id}>{ss.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-white/70 uppercase">Nivel</label>
                <select
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value as any)}
                >
                  {NIVELES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-white/70 uppercase">Lead ID (opcional)</label>
                <input
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  placeholder="Ej: 123"
                />
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-white/70 uppercase">Base imponible (€)</label>
                <input
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={baseImponible}
                  onChange={(e) => setBaseImponible(e.target.value)}
                  placeholder="Ej: 150"
                />
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-white/70 uppercase">Total factura (€)</label>
                <input
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={totalFactura}
                  onChange={(e) => setTotalFactura(e.target.value)}
                  placeholder="Ej: 181.50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[12px] font-extrabold text-white/70 uppercase">Notas</label>
                <textarea
                  className="mt-1 w-full min-h-[90px] rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones…"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-[13px] font-extrabold text-white transition"
              >
                Cancelar
              </button>
              <button
                onClick={crear}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-extrabold text-slate-950 transition"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 text-white font-extrabold">
          Últimas contrataciones
        </div>

        {loading ? (
          <div className="p-5 text-white/70">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-white/70">No hay contrataciones todavía.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {filtered.map((c) => (
              <div key={c.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-white font-extrabold">
                        #{c.id} · {c.seccion?.nombre ?? "Sección"}
                        {c.subSeccion?.nombre ? ` / ${c.subSeccion.nombre}` : ""}
                      </div>

                      <span className={`text-[11px] font-extrabold px-2 py-1 rounded-lg border ${pill(c.estado)}`}>
                        {c.estado}
                      </span>

                      <span className="text-[11px] font-extrabold px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white/80">
                        {c.nivel}
                      </span>
                    </div>

                    <div className="text-white/70 text-sm mt-1">
                      Base: <b className="text-white">{c.baseImponible ?? "—"}</b> · Total:{" "}
                      <b className="text-white">{c.totalFactura ?? "—"}</b>
                      {c.cliente?.nombre ? (
                        <span className="ml-2 text-white/60">
                          · Cliente: <b className="text-white">{c.cliente.nombre}</b>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.href = `/contrataciones/${c.id}`}
                    className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-[13px] font-extrabold text-white transition"
                    >
                    Ver
                  </button>


                  <div className="flex gap-2">
                    {c.estado !== "CANCELADA" && (
                      <button
                        onClick={async () => {
                          try {
                            await cambiarEstado(c.id, "CANCELADA");
                            toast.success("Cancelada");
                            await loadContrataciones();
                          } catch (e: any) {
                            toast.error(String(e?.message || e));
                          }
                        }}
                        className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-[13px] font-extrabold text-white transition"
                      >
                        Cancelar
                      </button>
                    )}

                    {c.estado === "BORRADOR" && (
                      <button
                        onClick={async () => {
                          try {
                            await cambiarEstado(c.id, "PENDIENTE");
                            toast.success("Enviada (PENDIENTE)");
                            await loadContrataciones();
                          } catch (e: any) {
                            toast.error(String(e?.message || e));
                          }
                        }}
                        className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-[13px] font-extrabold text-white transition"
                      >
                        Enviar
                      </button>
                    )}

                    {canConfirm && c.estado === "PENDIENTE" && (
                      <button
                        onClick={async () => {
                          try {
                            await cambiarEstado(c.id, "CONFIRMADA");
                            toast.success("Confirmada ✅ (cliente generado/vinculado)");
                            await loadContrataciones();
                          } catch (e: any) {
                            toast.error(String(e?.message || e));
                          }
                        }}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-[13px] font-extrabold text-slate-950 transition"
                      >
                        Confirmar
                      </button>
                    )}
                  </div>
                </div>

                {c.notas ? <div className="text-white/60 text-sm mt-2">{c.notas}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-white/60 text-sm">
        Al confirmar (ADMIN/SUPERADMIN), se crea/vincula el Cliente automáticamente desde el Lead de la contratación.
      </div>
    </div>
  );
}
