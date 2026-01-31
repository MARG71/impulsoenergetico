"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
};

const ESTADOS: Contratacion["estado"][] = [
  "BORRADOR",
  "PENDIENTE",
  "CONFIRMADA",
  "CANCELADA",
];

const NIVELES: Contratacion["nivel"][] = [
  "C1",
  "C2",
  "C3",
  "ESPECIAL",
];

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

export default function ContratacionesContenido() {
  const router = useRouter();
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

  const canCreate =
    role === "SUPERADMIN" || role === "ADMIN" || role === "AGENTE";
  const canConfirm = role === "SUPERADMIN" || role === "ADMIN";

  const subs = useMemo(() => {
    const sec = secciones.find((s) => s.id === seccionId);
    return (sec?.subSecciones ?? []).filter((x) => x.activa);
  }, [secciones, seccionId]);

  function normalizeItems<T>(json: any): T[] {
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.items)) return json.items;
    return [];
  }

  async function loadSecciones() {
    const res = await fetch("/api/crm/secciones", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json?.ok) throw new Error(json?.error);
    const arr = normalizeItems<Sec>(json);
    setSecciones(arr);
    if (!seccionId && arr.length) setSeccionId(arr[0].id);
  }

  async function loadContrataciones() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/contrataciones", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error);
      setItems(normalizeItems<Contratacion>(json));
    } catch (e: any) {
      toast.error(e?.message || "Error cargando");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function cambiarEstado(
    contratacionId: number,
    estado: Contratacion["estado"]
  ) {
    const res = await fetch(
      `/api/crm/contrataciones/${contratacionId}/estado`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      }
    );

    const json = await res.json();
    if (!res.ok || !json?.ok) throw new Error(json?.error);
  }

  useEffect(() => {
    if (status !== "loading" && session) {
      loadSecciones().catch((e) => toast.error(e.message));
      loadContrataciones().catch((e) => toast.error(e.message));
    }
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
    if (!res.ok || !json?.ok)
      return toast.error(json?.error || "No se pudo crear");

    toast.success("Contratación creada");
    setOpen(false);
    setBaseImponible("");
    setTotalFactura("");
    setLeadId("");
    setNotas("");
    await loadContrataciones();
  }

  if (status === "loading")
    return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session)
    return <div className="p-6 text-white/80">No autenticado.</div>;

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Contrataciones
          </h1>
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
              <option key={e}>{e}</option>
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
          <div className="p-5 text-white/70">
            No hay contrataciones todavía.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filtered.map((c) => (
              <div key={c.id} className="p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <div className="text-white font-extrabold">
                        #{c.id} · {c.seccion?.nombre ?? "Sección"}
                        {c.subSeccion?.nombre
                          ? ` / ${c.subSeccion.nombre}`
                          : ""}
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
                      Total:{" "}
                      <b className="text-white">{money(c.totalFactura)}</b>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        router.push(`/contrataciones/${c.id}`)
                      }
                      className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-sm font-extrabold text-white"
                    >
                      Ver
                    </button>

                    {canConfirm && c.estado === "PENDIENTE" && (
                      <button
                        onClick={async () => {
                          await cambiarEstado(c.id, "CONFIRMADA");
                          toast.success("Confirmada");
                          await loadContrataciones();
                        }}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-extrabold text-slate-950"
                      >
                        Confirmar
                      </button>
                    )}
                  </div>
                </div>

                {c.notas && (
                  <div className="text-white/60 text-sm mt-2">
                    {c.notas}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
