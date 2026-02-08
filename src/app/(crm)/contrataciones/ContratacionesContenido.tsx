"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

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

  admin?: { id: number; nombre: string | null; email?: string | null } | null;
  agente?: { id: number; nombre: string | null } | null;
  lugar?: { id: number; nombre: string | null } | null;

  seccion?: { nombre: string } | null;
  subSeccion?: { nombre: string } | null;

  cliente?: { id: number; nombre: string | null } | null;
  lead?: { id: number; nombre: string | null } | null;
};

const ESTADOS: Contratacion["estado"][] = [
  "BORRADOR",
  "PENDIENTE",
  "CONFIRMADA",
  "CANCELADA",
];

const NIVELES: Contratacion["nivel"][] = ["C1", "C2", "C3", "ESPECIAL"];

function money(v: any) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function pill(estado: string) {
  if (estado === "CONFIRMADA")
    return "bg-emerald-400/15 text-emerald-200 border-emerald-400/20";
  if (estado === "PENDIENTE")
    return "bg-orange-400/15 text-orange-200 border-orange-400/20";
  if (estado === "CANCELADA")
    return "bg-red-400/15 text-red-200 border-red-400/20";
  return "bg-white/10 text-white/80 border-white/10";
}

function normalizeItems<T>(json: any): T[] {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.items)) return json.items;
  return [];
}

export default function ContratacionesContenido() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const searchParams = useSearchParams();
  const adminIdQs = searchParams.get("adminId");

  const [secciones, setSecciones] = useState<Sec[]>([]);
  const [items, setItems] = useState<Contratacion[]>([]);
  const [loading, setLoading] = useState(true);

  const [fEstado, setFEstado] = useState<string>("TODOS");

  // Crear
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [seccionId, setSeccionId] = useState<number | null>(null);
  const [subSeccionId, setSubSeccionId] = useState<number | "null">("null");
  const [nivel, setNivel] = useState<Contratacion["nivel"]>("C1");
  const [baseImponible, setBaseImponible] = useState("");
  const [totalFactura, setTotalFactura] = useState("");
  const [leadId, setLeadId] = useState("");
  const [notas, setNotas] = useState("");

  const canCreate =
    role === "SUPERADMIN" || role === "ADMIN" || role === "AGENTE";
  const canConfirm = role === "SUPERADMIN" || role === "ADMIN";

  const subs = useMemo(() => {
    const sec = secciones.find((s) => s.id === seccionId);
    return (sec?.subSecciones ?? []).filter((x) => x.activa);
  }, [secciones, seccionId]);

  const filtered = useMemo(() => {
    if (fEstado === "TODOS") return items;
    return items.filter((x) => x.estado === fEstado);
  }, [items, fEstado]);

  async function loadSecciones() {
    try {
      const url = adminIdQs
        ? `/api/crm/secciones?adminId=${encodeURIComponent(adminIdQs)}`
        : "/api/crm/secciones";
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok) throw new Error(json?.error || "Error cargando secciones");
      if (json && json.ok === false)
        throw new Error(json?.error || "Error cargando secciones");

      const arr = normalizeItems<Sec>(json);
      setSecciones(arr);

      if (!seccionId && arr.length) setSeccionId(arr[0].id);
    } catch (e: any) {
      toast.error(String(e?.message || "Error cargando secciones"));
    }
  }

  async function loadContrataciones() {
    setLoading(true);
    try {
      const url = adminIdQs
        ? `/api/crm/contrataciones?adminId=${encodeURIComponent(adminIdQs)}`
        : "/api/crm/contrataciones";
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok)
        throw new Error(json?.error || "Error cargando contrataciones");
      if (json && json.ok === false)
        throw new Error(json?.error || "Error cargando contrataciones");

      const arr = normalizeItems<Contratacion>(json);
      setItems(arr);
    } catch (e: any) {
      setItems([]);
      toast.error(String(e?.message || "Error cargando contrataciones"));
    } finally {
      setLoading(false);
    }
  }

  async function cambiarEstado(
    contratacionId: number,
    estado: Contratacion["estado"]
  ) {
    const url = adminIdQs
      ? `/api/crm/contrataciones/${contratacionId}/estado?adminId=${encodeURIComponent(
          adminIdQs
        )}`
      : `/api/crm/contrataciones/${contratacionId}/estado`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estado,
        ...(adminIdQs ? { adminId: Number(adminIdQs) } : {}),
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || "No se pudo cambiar el estado");
    }
  }

  async function crear() {
    if (!seccionId) return toast.error("Selecciona sección");

    setCreating(true);
    try {
      const url = adminIdQs
        ? `/api/crm/contrataciones?adminId=${encodeURIComponent(adminIdQs)}`
        : "/api/crm/contrataciones";

      const res = await fetch(url, {
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
          ...(adminIdQs ? { adminId: Number(adminIdQs) } : {}),
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "No se pudo crear");
      }

      toast.success("Contratación creada ✅");

      // reset + cerrar modal
      setOpen(false);
      setBaseImponible("");
      setTotalFactura("");
      setLeadId("");
      setNotas("");

      // recargar lista
      await loadContrataciones();

      // ✅ ir al detalle para que “se vea” que se creó
      const newId = json?.item?.id ?? json?.contratacion?.id ?? json?.id;
      if (newId) {
        const href = adminIdQs
          ? `/contrataciones/${newId}?adminId=${encodeURIComponent(adminIdQs)}`
          : `/contrataciones/${newId}`;
        router.push(href);
      }
    } catch (e: any) {
      toast.error(String(e?.message || "Error creando"));
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    if (status !== "loading" && session) {
      loadSecciones();
      loadContrataciones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, adminIdQs]);

  if (status === "loading")
    return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session)
    return <div className="p-6 text-white/80">No autenticado.</div>;

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Contrataciones</h1>
          <p className="text-white/70">
            Centro de cierres y origen del histórico de comisiones.
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
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          {canCreate && (
            <button
              onClick={() => setOpen(true)}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-[13px] font-extrabold text-slate-950"
            >
              Nueva contratación
            </button>
          )}
        </div>
      </div>

      {/* LISTADO */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {loading ? (
          <div className="p-5 text-white/70">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-white/70">No hay contrataciones todavía.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {filtered.map((c) => (
              <div key={c.id} className="p-5">
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <div className="text-white font-extrabold">
                        #{c.id} · {c.seccion?.nombre ?? "Sección"}
                        {c.subSeccion?.nombre ? ` / ${c.subSeccion.nombre}` : ""}
                      </div>

                      <span
                        className={`text-xs px-2 py-1 rounded-lg border font-bold ${pill(
                          c.estado
                        )}`}
                      >
                        {c.estado}
                      </span>

                      <span className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white/80 font-bold">
                        {c.nivel}
                      </span>
                    </div>

                    <div className="text-white/70 text-sm mt-1">
                      Base: <b className="text-white">{money(c.baseImponible)}</b>
                      {" · "}
                      Total: <b className="text-white">{money(c.totalFactura)}</b>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {c.admin?.nombre ? (
                      <span className="px-2 py-1 rounded-lg border border-slate-600 bg-slate-950/40 text-slate-200 font-extrabold">
                        Admin: {c.admin.nombre}
                      </span>
                    ) : null}

                    {c.agente?.nombre ? (
                      <span className="px-2 py-1 rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 font-extrabold">
                        Agente: {c.agente.nombre}
                      </span>
                    ) : null}

                    {c.lugar?.nombre ? (
                      <span className="px-2 py-1 rounded-lg border border-amber-400/20 bg-amber-400/10 text-amber-200 font-extrabold">
                        Lugar: {c.lugar.nombre}
                      </span>
                    ) : null}

                    {c.cliente?.nombre || c.lead?.nombre ? (
                      <span className="px-2 py-1 rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-200 font-extrabold">
                        Cliente: {c.cliente?.nombre ?? c.lead?.nombre}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const href = adminIdQs
                          ? `/contrataciones/${c.id}?adminId=${encodeURIComponent(
                              adminIdQs
                            )}`
                          : `/contrataciones/${c.id}`;
                        router.push(href);
                      }}
                      className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-sm font-extrabold text-white"
                    >
                      Ver
                    </button>

                    {canConfirm && c.estado === "PENDIENTE" && (
                      <button
                        onClick={async () => {
                          try {
                            await cambiarEstado(c.id, "CONFIRMADA");
                            toast.success("Confirmada ✅");
                            await loadContrataciones();
                          } catch (e: any) {
                            toast.error(String(e?.message || "Error"));
                          }
                        }}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-extrabold text-slate-950"
                      >
                        Confirmar
                      </button>
                    )}
                  </div>
                </div>

                {c.notas && (
                  <div className="text-white/60 text-sm mt-2">{c.notas}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ MODAL NUEVA CONTRATACIÓN (ANTES NO EXISTÍA) */}
      {open && (
        <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="text-white font-extrabold">Nueva contratación</div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-extrabold text-sm"
              >
                Cerrar
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Sección */}
              <div className="sm:col-span-2">
                <div className="text-white/80 text-sm font-bold mb-1">
                  Sección
                </div>
                <select
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={seccionId ?? ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSeccionId(Number.isFinite(v) ? v : null);
                    setSubSeccionId("null");
                  }}
                >
                  {secciones.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* SubSección */}
              <div>
                <div className="text-white/80 text-sm font-bold mb-1">
                  SubSección
                </div>
                <select
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={String(subSeccionId)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSubSeccionId(v === "null" ? "null" : Number(v));
                  }}
                >
                  <option value="null">— Sin subsección —</option>
                  {subs.map((ss) => (
                    <option key={ss.id} value={ss.id}>
                      {ss.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nivel */}
              <div>
                <div className="text-white/80 text-sm font-bold mb-1">Nivel</div>
                <select
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value as any)}
                >
                  {NIVELES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base imponible */}
              <div>
                <div className="text-white/80 text-sm font-bold mb-1">
                  Base imponible (€)
                </div>
                <input
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={baseImponible}
                  onChange={(e) => setBaseImponible(e.target.value)}
                  placeholder="Ej: 500"
                />
              </div>

              {/* Total factura */}
              <div>
                <div className="text-white/80 text-sm font-bold mb-1">
                  Total factura (€)
                </div>
                <input
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={totalFactura}
                  onChange={(e) => setTotalFactura(e.target.value)}
                  placeholder="Ej: 650"
                />
              </div>

              {/* LeadId */}
              <div className="sm:col-span-2">
                <div className="text-white/80 text-sm font-bold mb-1">
                  LeadId (opcional)
                </div>
                <input
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  placeholder="Ej: 123"
                />
              </div>

              {/* Notas */}
              <div className="sm:col-span-2">
                <div className="text-white/80 text-sm font-bold mb-1">Notas</div>
                <textarea
                  className="w-full min-h-[90px] rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Notas internas…"
                />
              </div>

              <div className="sm:col-span-2 flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-sm font-extrabold text-white"
                >
                  Cancelar
                </button>

                <button
                  onClick={crear}
                  disabled={creating}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-4 py-2 text-sm font-extrabold text-slate-950"
                >
                  {creating ? "Creando…" : "Crear contratación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
