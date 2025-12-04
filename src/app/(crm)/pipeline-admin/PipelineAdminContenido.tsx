"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type Lead = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado: string | null;
  creadoEn: string;
  agente?: { id: number; nombre: string } | null;
  lugar?: { id: number; nombre: string } | null;
};

type Comparativa = {
  id: number;
  leadId?: number | null;
};

type ApiLeadsResponse = {
  leads?: Lead[];
} & any;

type ApiComparativasResponse = {
  comparativas?: Comparativa[];
} & any;

type GrupoEstado = {
  key: string;
  label: string;
  leads: Lead[];
};

export default function PipelineAdminContenido() {
  const { data: session, status } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [comparativas, setComparativas] = useState<Comparativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setError("Debes iniciar sesión para ver el pipeline.");
      setLoading(false);
      return;
    }

    const rol =
      (session.user as any)?.rol ?? (session.user as any)?.role ?? null;

    if (rol !== "ADMIN") {
      setError("Este pipeline está disponible solo para usuarios con rol ADMIN.");
      setLoading(false);
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [resLeads, resComparativas] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/comparativas"),
        ]);

        if (!resLeads.ok) {
          const err = await resLeads.json().catch(() => ({}));
          throw new Error(err.error || "Error al cargar los leads");
        }

        const dataLeads = (await resLeads.json()) as ApiLeadsResponse;
        const dataComparativas = (await resComparativas.json().catch(() => ({}))) as ApiComparativasResponse;

        const listaLeads = Array.isArray(dataLeads?.leads)
          ? dataLeads.leads
          : Array.isArray(dataLeads)
          ? (dataLeads as Lead[])
          : [];

        const listaComp = Array.isArray(dataComparativas?.comparativas)
          ? dataComparativas.comparativas
          : Array.isArray(dataComparativas)
          ? (dataComparativas as Comparativa[])
          : [];

        setLeads(listaLeads);
        setComparativas(listaComp);
        setError(null);
      } catch (e: any) {
        console.error("Error cargando pipeline admin:", e);
        setError(e.message || "Error al cargar el pipeline");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [session, status]);

  const grupos = useMemo<GrupoEstado[]>(() => {
    if (!leads.length) return [];

    const gruposRaw: Record<string, Lead[]> = {};

    for (const lead of leads) {
      const key =
        (lead.estado || "Sin estado").trim().toUpperCase() || "SIN ESTADO";
      if (!gruposRaw[key]) gruposRaw[key] = [];
      gruposRaw[key].push(lead);
    }

    const ORDEN: { key: string; label: string }[] = [
      { key: "NUEVO", label: "Nuevos" },
      { key: "CONTACTADO", label: "Contactados" },
      { key: "EN ESTUDIO", label: "En estudio" },
      { key: "EN_ESTUDIO", label: "En estudio" },
      { key: "PROPUESTA", label: "Propuesta enviada" },
      { key: "CERRADO", label: "Cerrados" },
      { key: "PERDIDO", label: "Perdidos" },
      { key: "SIN ESTADO", label: "Sin estado" },
    ];

    const usados = new Set<string>();
    const resultado: GrupoEstado[] = [];

    for (const item of ORDEN) {
      if (gruposRaw[item.key]) {
        usados.add(item.key);
        resultado.push({
          key: item.key,
          label: item.label,
          leads: gruposRaw[item.key],
        });
      }
    }

    const extras = Object.keys(gruposRaw)
      .filter((k) => !usados.has(k))
      .sort();

    for (const key of extras) {
      const label =
        key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, " ");
      resultado.push({
        key,
        label,
        leads: gruposRaw[key],
      });
    }

    return resultado;
  }, [leads]);

  const totalLeads = leads.length;
  const totalConComparativa = useMemo(() => {
    const setLeadsConComp = new Set<number>();
    for (const c of comparativas) {
      if (c.leadId) setLeadsConComp.add(c.leadId);
    }
    return setLeadsConComp.size;
  }, [comparativas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-300">Cargando pipeline global…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
          <h1 className="text-lg font-bold mb-2">Pipeline de administración</h1>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-4 py-8">
      {/* CABECERA */}
      <header className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
          Pipeline global de clientes
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          Vista general de todos los leads que han entrado por QR, registros y
          acciones comerciales. Agrupados por estado para que tengas el control
          total desde IMPULSO ENERGÉTICO.
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <div className="rounded-full bg-slate-900 border border-slate-700 px-4 py-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-100">
              {totalLeads} leads totales
            </span>
          </div>
          <div className="rounded-full bg-slate-900 border border-slate-700 px-4 py-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="font-semibold text-slate-100">
              {totalConComparativa} con comparativa
            </span>
          </div>
          <div className="rounded-full bg-slate-900 border border-slate-700 px-4 py-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400" />
            <span className="font-semibold text-slate-100">
              {grupos.length} estados en uso
            </span>
          </div>
        </div>
      </header>

      {/* TABLERO PIPELINE */}
      <main className="max-w-7xl mx-auto">
        {grupos.length === 0 ? (
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 py-10 text-center text-sm text-slate-300">
            No hay leads registrados todavía. Cuando entren clientes por QR o
            registro, los verás aquí organizados por estado.
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-950/70 border border-slate-800 px-4 py-4 overflow-x-auto">
            <div className="flex gap-4 min-w-full">
              {grupos.map((grupo) => (
                <ColumnaEstado
                  key={grupo.key}
                  grupo={grupo}
                  comparativas={comparativas}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ColumnaEstado({
  grupo,
  comparativas,
}: {
  grupo: GrupoEstado;
  comparativas: Comparativa[];
}) {
  const setLeadsConComp = useMemo(() => {
    const s = new Set<number>();
    for (const c of comparativas) {
      if (c.leadId) s.add(c.leadId);
    }
    return s;
  }, [comparativas]);

  const tonoCabecera =
    grupo.key === "NUEVO"
      ? "from-emerald-500 to-emerald-400"
      : grupo.key.includes("CONTACT")
      ? "from-sky-500 to-blue-500"
      : grupo.key.includes("ESTUDIO")
      ? "from-amber-400 to-orange-400"
      : grupo.key.includes("CERRADO")
      ? "from-lime-400 to-emerald-400"
      : grupo.key.includes("PERDIDO")
      ? "from-rose-500 to-red-500"
      : "from-slate-500 to-slate-400";

  return (
    <div className="flex-1 min-w-[260px] max-w-[320px] flex flex-col">
      {/* Cabecera columna */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-700 mb-3 p-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-100 uppercase tracking-wide">
            {grupo.label}
          </p>
          <p className="text-[11px] text-slate-400">
            {grupo.leads.length} lead{grupo.leads.length === 1 ? "" : "s"}
          </p>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-[10px] font-semibold text-slate-950 bg-gradient-to-r ${tonoCabecera}`}
        >
          Pipeline
        </div>
      </div>

      {/* Tarjetas de leads */}
      <div className="flex-1 rounded-2xl bg-slate-950/80 border border-slate-800 p-2 space-y-2 max-h-[540px] overflow-y-auto">
        {grupo.leads.map((lead) => {
          const tieneComparativa = setLeadsConComp.has(lead.id);
          return (
            <div
              key={lead.id}
              className="rounded-xl bg-slate-900/90 border border-slate-700 px-3 py-2.5 text-xs space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-100">
                    {lead.nombre || "Sin nombre"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(lead.creadoEn).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {tieneComparativa && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-400/70 text-emerald-300">
                    Con comparativa
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-0.5 text-[11px] text-slate-300">
                <p>
                  <span className="text-slate-400">Email: </span>
                  {lead.email || "-"}
                </p>
                <p>
                  <span className="text-slate-400">Teléfono: </span>
                  {lead.telefono || "-"}
                </p>
                <p>
                  <span className="text-slate-400">Lugar: </span>
                  {lead.lugar?.nombre || "-"}
                </p>
                <p>
                  <span className="text-slate-400">Agente: </span>
                  {lead.agente?.nombre || "-"}
                </p>
              </div>
            </div>
          );
        })}

        {grupo.leads.length === 0 && (
          <p className="text-[11px] text-slate-500 text-center py-4">
            No hay leads en este estado.
          </p>
        )}
      </div>
    </div>
  );
}
