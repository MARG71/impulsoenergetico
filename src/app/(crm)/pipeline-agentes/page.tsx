"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CRMClienteLayout from "../CRMClienteLayout";

type Lead = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  estado?: string | null;
  creadoEn?: string;
  origen?: string | null;
  agenteId?: number | null;
  agente?: { id: number; nombre: string } | null;
  lugar?: { id: number; nombre: string } | null;
};

type RespuestaLeads = {
  leads?: Lead[];
} | Lead[];

type AgenteOption = {
  id: number;
  nombre: string;
};

const ESTADOS_BASE = [
  { id: "NUEVO", label: "Nuevos", descripcion: "Acaban de registrarse" },
  { id: "CONTACTADO", label: "Contactados", descripcion: "Ya se ha hablado con ellos" },
  { id: "EN_ESTUDIO", label: "En estudio", descripcion: "Pendiente de hacer propuesta" },
  { id: "COMPARATIVA", label: "Con comparativa", descripcion: "Ya se les ha hecho estudio" },
  { id: "CERRADO", label: "Cerrados / Alta", descripcion: "Convertidos en cliente" },
];

type RangoFechas = "HOY" | "7" | "30" | "TODO";
type OrigenFiltro = "TODOS" | "QR" | "WEB" | "IMPORTADO";

function normalizarEstado(raw?: string | null): string {
  if (!raw) return "NUEVO";
  const v = raw.toString().trim().toUpperCase();
  if (["NUEVO", "NEW"].includes(v)) return "NUEVO";
  if (["CONTACTADO", "LLAMADO", "CONTACT"].includes(v)) return "CONTACTADO";
  if (["ESTUDIO", "EN_ESTUDIO", "PENDIENTE"].includes(v)) return "EN_ESTUDIO";
  if (["COMPARATIVA", "COMPARATIVA_REALIZADA"].includes(v)) return "COMPARATIVA";
  if (["CERRADO", "ALTA", "GANADO"].includes(v)) return "CERRADO";
  return "NUEVO";
}

function normalizarOrigen(raw?: string | null): OrigenFiltro | "DESCONOCIDO" {
  if (!raw) return "DESCONOCIDO";
  const v = raw.toString().trim().toUpperCase();
  if (v.includes("QR")) return "QR";
  if (v.includes("WEB") || v.includes("FORM")) return "WEB";
  if (v.includes("IMPORT")) return "IMPORTADO";
  return "DESCONOCIDO";
}

export default function PipelineAgentesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [agentes, setAgentes] = useState<AgenteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroAgenteId, setFiltroAgenteId] = useState<"todos" | number>("todos");
  const [filtroLugarId, setFiltroLugarId] = useState<"todos" | number>("todos");
  const [filtroRango, setFiltroRango] = useState<RangoFechas>("TODO");
  const [filtroOrigen, setFiltroOrigen] = useState<OrigenFiltro>("TODOS");

  const rol =
    (session?.user as any)?.rol ?? (session?.user as any)?.role ?? null;
  const agenteIdUsuario = (session?.user as any)?.agenteId
    ? Number((session?.user as any).agenteId)
    : null;

  const nombreUsuario =
    (session?.user as any)?.nombre ?? session?.user?.name ?? "Usuario Impulso";
  const labelRol =
    rol === "ADMIN" ? "Administrador" : rol === "AGENTE" ? "Agente" : rol || "";

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setError("Debes iniciar sesión para ver el pipeline.");
      setLoading(false);
      return;
    }

    if (rol !== "ADMIN" && rol !== "AGENTE") {
      setError("Solo usuarios con rol ADMIN o AGENTE pueden ver este pipeline.");
      setLoading(false);
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);

        // 1) Leads
        const [resLeads, resAgentes] = await Promise.all([
          fetch("/api/leads"),
          rol === "ADMIN" ? fetch("/api/agentes") : Promise.resolve(null),
        ]);

        if (!resLeads.ok) {
          const err = await resLeads.json().catch(() => ({}));
          throw new Error(err.error || "Error al cargar los leads");
        }

        const dataLeads = (await resLeads.json()) as RespuestaLeads;
        const listaLeads = Array.isArray(dataLeads)
          ? dataLeads
          : dataLeads.leads || [];
        setLeads(listaLeads);

        // 2) Agentes (solo admin)
        if (rol === "ADMIN" && resAgentes) {
          if (!resAgentes.ok) {
            console.warn("No se pudieron cargar agentes para el filtro.");
          } else {
            const dataA = await resAgentes.json();
            const listaAgentes: any[] = Array.isArray(dataA)
              ? dataA
              : Array.isArray(dataA.agentes)
              ? dataA.agentes
              : [];
            setAgentes(
              listaAgentes.map((a) => ({
                id: a.id,
                nombre: a.nombre || a.name || `Agente ${a.id}`,
              }))
            );
          }
        }

        setError(null);
      } catch (err: any) {
        console.error("Error cargando datos en pipeline:", err);
        setError(err.message || "Error al cargar el pipeline");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [session, status, rol]);

  // Leads base según rol (ADMIN ve todos, AGENTE solo los suyos)
  const leadsSegunRol = useMemo(() => {
    if (rol === "AGENTE" && agenteIdUsuario) {
      return leads.filter((l) => {
        const aid = l.agenteId ?? l.agente?.id ?? (l as any).agenteId ?? null;
        return aid === agenteIdUsuario;
      });
    }
    return leads;
  }, [leads, rol, agenteIdUsuario]);

  // Opciones de lugar en función de los leads según rol y filtro de agente
  const lugaresOpciones = useMemo(() => {
    const setIds = new Set<number>();
    const arr: { id: number; nombre: string }[] = [];

    let base = leadsSegunRol;

    // si ADMIN y hay filtro de agente, aplicarlo antes de sacar lugares
    if (rol === "ADMIN" && typeof filtroAgenteId === "number") {
      base = base.filter((l) => {
        const aid = l.agenteId ?? l.agente?.id ?? (l as any).agenteId ?? null;
        return aid === filtroAgenteId;
      });
    }

    base.forEach((l) => {
      if (l.lugar && typeof l.lugar.id === "number") {
        if (!setIds.has(l.lugar.id)) {
          setIds.add(l.lugar.id);
          arr.push({ id: l.lugar.id, nombre: l.lugar.nombre });
        }
      }
    });

    return arr.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [leadsSegunRol, rol, filtroAgenteId]);

  // Asegurarnos de que si cambiamos agente, el lugar filtrado siga siendo válido
  useEffect(() => {
    if (
      filtroLugarId !== "todos" &&
      !lugaresOpciones.some((l) => l.id === filtroLugarId)
    ) {
      setFiltroLugarId("todos");
    }
  }, [lugaresOpciones, filtroLugarId]);

  // Leads filtrados por agente, lugar, rango fechas y origen
  const visibleLeads = useMemo(() => {
    let base = [...leadsSegunRol];

    // Filtro por agente (solo ADMIN)
    if (rol === "ADMIN" && typeof filtroAgenteId === "number") {
      base = base.filter((l) => {
        const aid = l.agenteId ?? l.agente?.id ?? (l as any).agenteId ?? null;
        return aid === filtroAgenteId;
      });
    }

    // Filtro por lugar
    if (typeof filtroLugarId === "number") {
      base = base.filter((l) => l.lugar?.id === filtroLugarId);
    }

    // Filtro por rango de fechas
    if (filtroRango !== "TODO") {
      const ahora = new Date();
      let desde: Date;

      if (filtroRango === "HOY") {
        desde = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
          0,
          0,
          0,
          0
        );
      } else {
        const dias = filtroRango === "7" ? 7 : 30;
        desde = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate() - dias,
          0,
          0,
          0,
          0
        );
      }

      base = base.filter((l) => {
        if (!l.creadoEn) return false;
        const d = new Date(l.creadoEn);
        if (filtroRango === "HOY") {
          return (
            d.getFullYear() === desde.getFullYear() &&
            d.getMonth() === desde.getMonth() &&
            d.getDate() === desde.getDate()
          );
        }
        return d >= desde;
      });
    }

    // Filtro por origen
    if (filtroOrigen !== "TODOS") {
      base = base.filter((l) => normalizarOrigen(l.origen) === filtroOrigen);
    }

    return base;
  }, [
    leadsSegunRol,
    rol,
    filtroAgenteId,
    filtroLugarId,
    filtroRango,
    filtroOrigen,
  ]);

  // Agrupamos por columnas usando SOLO los visibles
  const columnas = useMemo(() => {
    const agrupado: Record<string, Lead[]> = {};
    for (const lead of visibleLeads) {
      const est = normalizarEstado(lead.estado);
      if (!agrupado[est]) agrupado[est] = [];
      agrupado[est].push(lead);
    }
    return ESTADOS_BASE.map((col) => ({
      ...col,
      leads: agrupado[col.id] || [],
    }));
  }, [visibleLeads]);

  const totalLeads = visibleLeads.length;

  const contenido = () => {
    if (status === "loading" || loading) {
      return (
        <div className="flex justify-center items-center py-10 text-slate-300 text-sm">
          Cargando pipeline de leads…
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="bg-red-900/70 border border-red-500/70 text-red-50 px-6 py-4 rounded-2xl max-w-md text-sm text-center">
            <h2 className="font-semibold mb-1">Pipeline de leads</h2>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (!totalLeads) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="bg-slate-900/80 border border-slate-700 text-slate-200 px-6 py-4 rounded-2xl max-w-md text-sm text-center">
            <p>No hay leads registrados con los filtros actuales.</p>
            <p className="text-xs text-slate-400 mt-1">
              Ajusta los filtros o espera a que entren nuevos registros por QR o
              formulario.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {columnas.map((col) => (
          <div
            key={col.id}
            className="flex flex-col rounded-3xl bg-slate-950/80 border border-slate-800"
          >
            {/* Cabecera columna */}
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 rounded-t-3xl">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-50">
                  {col.label}
                </h3>
                <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-full bg-emerald-500/90 text-slate-950 text-xs font-bold">
                  {col.leads.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {col.descripcion}
              </p>
            </div>

            {/* Lista de leads */}
            <div className="flex-1 overflow-y-auto max-h-[550px] px-3 py-3 space-y-3">
              {col.leads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => router.push("/panel-agente")}
                  className="w-full text-left rounded-2xl bg-slate-900/80 border border-slate-700 hover:border-emerald-400/70 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] px-3.5 py-3 transition"
                >
                  <p className="text-xs font-semibold text-slate-50 truncate">
                    {lead.nombre || "Lead sin nombre"}
                  </p>
                  <p className="text-[11px] text-slate-300 truncate">
                    {lead.email || lead.telefono || "Sin datos de contacto"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {lead.lugar?.nombre
                      ? `Lugar: ${lead.lugar.nombre}`
                      : "Sin lugar asignado"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {lead.agente?.nombre
                      ? `Agente: ${lead.agente.nombre}`
                      : "Sin agente asignado"}
                  </p>
                  {lead.creadoEn && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(lead.creadoEn).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <CRMClienteLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Cabecera */}
          <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-fuchsia-500/25 via-emerald-400/15 to-sky-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <div className="rounded-3xl bg-slate-950/95 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white mb-1">
                  {rol === "ADMIN"
                    ? "Pipeline global de leads"
                    : "Pipeline de tus leads"}
                </h1>
                <p className="text-sm text-slate-300 max-w-xl">
                  {rol === "ADMIN"
                    ? "Vista para ADMIN con todos los leads que han entrado por QR o formularios, organizados por estado."
                    : "Vista para AGENTE con todos tus leads que han entrado por QR o formularios, organizados por estado."}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Conectado como{" "}
                  <span className="font-semibold text-emerald-300">
                    {nombreUsuario}
                  </span>{" "}
                  · <span className="font-semibold">{labelRol}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total de leads visibles</p>
                <p className="text-3xl font-extrabold text-emerald-300">
                  {totalLeads}
                </p>
              </div>
            </div>
          </header>

          {/* Filtros */}
          <section className="rounded-3xl bg-slate-950/90 border border-slate-800 px-4 py-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              {/* Filtro agente (solo admin) */}
              {rol === "ADMIN" && (
                <div className="flex flex-col">
                  <label className="text-xs text-slate-400 mb-1">
                    Filtrar por agente
                  </label>
                  <select
                    value={
                      typeof filtroAgenteId === "number"
                        ? filtroAgenteId
                        : "todos"
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      setFiltroAgenteId(
                        v === "todos" ? "todos" : Number(v)
                      );
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  >
                    <option value="todos">Todos los agentes</option>
                    {agentes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtro lugar */}
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1">
                  Filtrar por lugar
                </label>
                <select
                  value={
                    typeof filtroLugarId === "number"
                      ? filtroLugarId
                      : "todos"
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setFiltroLugarId(
                      v === "todos" ? "todos" : Number(v)
                    );
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 min-w-[200px]"
                >
                  <option value="todos">Todos los lugares</option>
                  {lugaresOpciones.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro origen */}
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1">
                  Origen del lead
                </label>
                <select
                  value={filtroOrigen}
                  onChange={(e) =>
                    setFiltroOrigen(e.target.value as OrigenFiltro)
                  }
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                >
                  <option value="TODOS">Todos</option>
                  <option value="QR">Desde QR</option>
                  <option value="WEB">Formulario web</option>
                  <option value="IMPORTADO">Importados</option>
                </select>
              </div>
            </div>

            {/* Filtro rango de fechas */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <span className="text-xs text-slate-400 mb-1">
                Rango de fechas
              </span>
              <div className="inline-flex rounded-full bg-slate-900 border border-slate-700 p-1">
                {[
                  { id: "HOY", label: "Hoy" },
                  { id: "7", label: "7 días" },
                  { id: "30", label: "30 días" },
                  { id: "TODO", label: "Todo" },
                ].map((r) => {
                  const activo = filtroRango === (r.id as RangoFechas);
                  return (
                    <button
                      key={r.id}
                      onClick={() =>
                        setFiltroRango(r.id as RangoFechas)
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        activo
                          ? "bg-emerald-500 text-slate-950"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {contenido()}
        </div>
      </div>
    </CRMClienteLayout>
  );
}
