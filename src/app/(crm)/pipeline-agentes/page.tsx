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
  agenteId?: number | null; // por si viene desde la API
  agente?: { id: number; nombre: string } | null;
  lugar?: { id: number; nombre: string } | null;
};

type RespuestaLeads = {
  leads?: Lead[];
} | Lead[];

const ESTADOS_BASE = [
  { id: "NUEVO", label: "Nuevos", descripcion: "Acaban de registrarse" },
  { id: "CONTACTADO", label: "Contactados", descripcion: "Ya se ha hablado con ellos" },
  { id: "EN_ESTUDIO", label: "En estudio", descripcion: "Pendiente de hacer propuesta" },
  { id: "COMPARATIVA", label: "Con comparativa", descripcion: "Ya se les ha hecho estudio" },
  { id: "CERRADO", label: "Cerrados / Alta", descripcion: "Convertidos en cliente" },
];

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

export default function PipelineAgentesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    // Permitimos ADMIN y AGENTE
    if (rol !== "ADMIN" && rol !== "AGENTE") {
      setError("Solo usuarios con rol ADMIN o AGENTE pueden ver este pipeline.");
      setLoading(false);
      return;
    }

    const cargarLeads = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/leads");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al cargar los leads");
        }
        const data = (await res.json()) as RespuestaLeads;
        const lista = Array.isArray(data) ? data : data.leads || [];
        setLeads(lista);
        setError(null);
      } catch (err: any) {
        console.error("Error cargando leads en pipeline:", err);
        setError(err.message || "Error al cargar el pipeline");
      } finally {
        setLoading(false);
      }
    };

    cargarLeads();
  }, [session, status, rol]);

  // 👇 Leads visibles según rol
  const visibleLeads = useMemo(() => {
    if (rol === "AGENTE" && agenteIdUsuario) {
      return leads.filter((l) => {
        const aid = l.agenteId ?? l.agente?.id ?? (l as any).agenteId ?? null;
        return aid === agenteIdUsuario;
      });
    }
    return leads;
  }, [leads, rol, agenteIdUsuario]);

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
            <p>No hay leads registrados todavía.</p>
            <p className="text-xs text-slate-400 mt-1">
              Cuando entren clientes por QR o formulario, los verás aquí
              organizados por estado.
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

          {contenido()}
        </div>
      </div>
    </CRMClienteLayout>
  );
}
