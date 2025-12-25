// src/app/(crm)/agentes/ID/DETALLE/page.tsx
// src/app/(crm)/agentes/[id]/detalle/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fmtPct = (v: any) =>
  v == null ? "—" : `${(Number(v) * 100).toFixed(1)}%`;

const fmtDate = (s?: string) => {
  if (!s) return "—";
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const fmtEur = (n: number) =>
  `${(Number(n) || 0).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;

function normalizarTexto(texto: string) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export default function DetalleAgente() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = searchParams.get("adminId");
  const adminQuery = adminId ? `?adminId=${adminId}` : "";

  const [agente, setAgente] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const withAdmin = (path: string) =>
    adminId ? `${path}${path.includes("?") ? "&" : "?"}adminId=${adminId}` : path;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/agentes/${id}/detalle${adminQuery}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Error cargando agente");
        } else {
          setAgente(data);
        }
      } catch (e) {
        console.error(e);
        setError("Error de conexión al cargar el agente");
      } finally {
        setCargando(false);
      }
    })();
  }, [id, adminQuery]);

  const lugares = agente?.lugares ?? [];
  const comparativas = agente?.comparativas ?? [];
  const usuarios = agente?.usuarios ?? [];
  const leads = agente?.leads ?? [];

  // === FILTROS ===
  const comparativasFiltradas = useMemo(
    () =>
      comparativas.filter((comp: any) => {
        const texto = `${comp.id} ${comp.tipoServicio} ${comp.tipoTarifa} ${
          comp.nombreTarifa
        } ${comp.importeFactura} ${comp.cliente?.nombre ?? ""} ${
          comp.lugar?.nombre ?? ""
        }`;
        return normalizarTexto(texto).includes(normalizarTexto(busqueda));
      }),
    [comparativas, busqueda]
  );

  const lugaresFiltrados = useMemo(
    () =>
      lugares.filter((lugar: any) => {
        const texto = `${lugar.id} ${lugar.nombre} ${lugar.direccion}`;
        return normalizarTexto(texto).includes(normalizarTexto(busqueda));
      }),
    [lugares, busqueda]
  );

  const usuariosFiltrados = useMemo(
    () =>
      usuarios.filter((user: any) => {
        const texto = `${user.nombre} ${user.email} ${user.rol}`;
        return normalizarTexto(texto).includes(normalizarTexto(busqueda));
      }),
    [usuarios, busqueda]
  );

  const leadsFiltrados = useMemo(
    () =>
      leads.filter((lead: any) => {
        const texto = `${lead.nombre} ${lead.email} ${lead.telefono} ${
          lead.estado
        } ${lead.lugar?.nombre ?? ""}`;
        return normalizarTexto(texto).includes(normalizarTexto(busqueda));
      }),
    [leads, busqueda]
  );

  // === RESUMEN ECONÓMICO ===
  const resumenEconomico = useMemo(() => {
    let totalFactura = 0;
    let totalAhorro = 0;
    let totalComision = 0;

    for (const c of comparativas) {
      totalFactura += c?.importeFactura ?? 0;
      totalAhorro += c?.ahorro ?? 0;
      totalComision += c?.comision ?? 0;
    }

    const mediaTicket =
      comparativas.length > 0 ? totalFactura / comparativas.length : 0;

    return { totalFactura, totalAhorro, totalComision, mediaTicket };
  }, [comparativas]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        Cargando agente…
      </div>
    );
  }

  if (error || !agente) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
          <h1 className="text-xl font-bold mb-2">Detalle de agente</h1>
          <p className="text-sm">{error || "Agente no encontrado"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 md:px-10 py-8 text-slate-50">
      <div className="w-full max-w-[1700px] mx-auto space-y-8">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/25 via-sky-500/20 to-fuchsia-500/25 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-6 md:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <Image
                src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                alt="Impulso Energético"
                width={150}
                height={46}
                priority
              />
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                  {agente.nombre}
                </h1>
                <p className="text-xs md:text-sm text-slate-300 font-medium mt-1">
                  Panel completo del agente · actividad, lugares, leads,
                  comparativas y comisiones
                </p>
                {agente.admin && (
                  <p className="mt-1 text-[11px] md:text-xs text-emerald-300 font-semibold">
                    Gestionado por{" "}
                    <span className="font-bold">{agente.admin.nombre}</span>{" "}
                    ({agente.admin.email})
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-slate-900 border border-slate-700 text-slate-100 hover:bg-slate-800 px-4 text-xs md:text-sm font-semibold"
                  onClick={() =>
                    router.push(
                      adminId ? `/agentes?adminId=${adminId}` : "/agentes"
                    )
                  }
                >
                  ⬅ Volver a agentes
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 px-4 text-xs md:text-sm font-semibold"
                  onClick={() =>
                    router.push(
                      adminId ? `/dashboard?adminId=${adminId}` : "/dashboard"
                    )
                  }
                >
                  🏠 Dashboard
                </Button>
              </div>
              <div className="flex flex-wrap justify-end gap-2 text-[11px] md:text-xs">
                <Chip label={`Email · ${agente.email}`} />
                {agente.telefono && <Chip label={`Tel. ${agente.telefono}`} />}
                <Chip label={`% Agente · ${fmtPct(agente.pctAgente)}`} />
              </div>
            </div>
          </div>
        </header>

        {/* KPIs PRINCIPALES */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi
            titulo="Lugares"
            valor={`${lugares.length}`}
            hint="Lugares asignados al agente"
          />
          <Kpi
            titulo="Leads"
            valor={`${leads.length}`}
            hint="Leads captados a través de este agente"
          />
          <Kpi
            titulo="Comparativas"
            valor={`${comparativas.length}`}
            hint="Comparativas realizadas para sus clientes"
          />
          <Kpi
            titulo="Total comisión"
            valor={fmtEur(resumenEconomico.totalComision)}
            hint="Comisión total estimada para el agente"
            resaltado
          />
        </section>

        {/* RESUMEN ECONÓMICO */}
        <section className="rounded-3xl bg-slate-950/90 border border-emerald-500/40 px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm md:text-base font-semibold text-emerald-300">
              Resumen económico de comparativas
            </p>
            <p className="text-[11px] md:text-xs text-slate-400 max-w-xl">
              Totales calculados con las comparativas registradas de este
              agente (facturación estimada, ahorro generado al cliente y
              comisiones totales).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
            <MiniStat
              label="Facturación estimada"
              value={fmtEur(resumenEconomico.totalFactura)}
            />
            <MiniStat
              label="Ahorro generado"
              value={fmtEur(resumenEconomico.totalAhorro)}
            />
            <MiniStat
              label="Ticket medio"
              value={fmtEur(resumenEconomico.mediaTicket)}
            />
          </div>
        </section>

        {/* BUSCADOR GLOBAL */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm md:text-base font-semibold text-slate-100">
              Filtro rápido
            </p>
            <p className="text-[11px] md:text-xs text-slate-400">
              Busca por nombre, email, dirección, cliente, lugar, etc. El filtro
              se aplica a todas las secciones de este panel.
            </p>
          </div>
          <Input
            placeholder="Buscar en toda la actividad del agente…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full md:w-96 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm md:text-base"
          />
        </section>

        {/* GRID PRINCIPAL: LUGARES + ACTIVIDAD RECIENTE */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* LUGARES RESUMEN */}
          <Block
            title="📍 Lugares del agente"
            subtitle="Resumen rápido de los puntos donde trabaja este agente."
            actions={
              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs md:text-sm font-semibold px-3 py-1"
                onClick={() => router.push(withAdmin("/lugares"))}
              >
                Ver todos los lugares
              </Button>
            }
          >
            {lugaresFiltrados.length === 0 ? (
              <Empty texto="Este agente todavía no tiene lugares asignados." />
            ) : (
              <div className="space-y-2">
                {lugaresFiltrados.map((l: any) => (
                  <div
                    key={l.id}
                    className="rounded-2xl bg-slate-900/70 border border-slate-700 px-4 py-3 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-50 text-sm md:text-base">
                        #{l.id} · {l.nombre}
                      </p>
                      <p className="text-xs md:text-sm text-slate-400">
                        {l.direccion}
                      </p>
                      <p className="mt-1 text-[11px] md:text-xs text-slate-400">
                        % Cliente:{" "}
                        <span className="font-semibold text-emerald-300">
                          {fmtPct(l.pctCliente)}
                        </span>{" "}
                        · % Lugar:{" "}
                        <span className="font-semibold text-emerald-300">
                          {fmtPct(l.pctLugar)}
                        </span>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs md:text-sm font-semibold px-3 py-1"
                      onClick={() =>
                        router.push(
                          withAdmin(`/lugares/${l.id}/detalle`)
                        )
                      }
                    >
                      Ver lugar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Block>

          {/* ACTIVIDAD RECIENTE */}
          <Block
            title="📈 Actividad reciente"
            subtitle="Últimos leads y comparativas realizadas por este agente."
            actions={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs md:text-sm font-semibold px-3 py-1"
                  onClick={() =>
                    router.push(withAdmin("/historial-comparativas"))
                  }
                >
                  Ver comparativas
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs md:text-sm font-semibold px-3 py-1"
                  onClick={() => router.push(withAdmin("/leads"))}
                >
                  Ver leads
                </Button>
              </div>
            }
          >
            {leads.length === 0 && comparativas.length === 0 ? (
              <Empty texto="Todavía no hay leads ni comparativas para este agente." />
            ) : (
              <div className="space-y-4">
                {/* Leads últimos 5 */}
                <div>
                  <p className="text-xs md:text-sm font-semibold text-slate-300 mb-2">
                    Últimos leads
                  </p>
                  {leadsFiltrados.slice(0, 5).map((l: any) => (
                    <div
                      key={l.id}
                      className="rounded-2xl bg-slate-900/70 border border-slate-700 px-4 py-3 mb-2"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-50 text-sm md:text-base">
                            {l.nombre}
                          </p>
                          <p className="text-xs md:text-sm text-slate-400">
                            {l.lugar?.nombre || "Sin lugar"} · {l.estado}
                          </p>
                        </div>
                        <p className="text-[11px] md:text-xs text-slate-500">
                          {fmtDate(l.creadoEn)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {leadsFiltrados.length === 0 && (
                    <p className="text-xs text-slate-500">
                      No hay leads que coincidan con el filtro.
                    </p>
                  )}
                </div>

                {/* Comparativas últimas 5 */}
                <div>
                  <p className="text-xs md:text-sm font-semibold text-slate-300 mb-2">
                    Últimas comparativas
                  </p>
                  {comparativasFiltradas.slice(0, 5).map((c: any) => (
                    <div
                      key={c.id}
                      className="rounded-2xl bg-slate-900/70 border border-slate-700 px-4 py-3 mb-2"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-50 text-sm md:text-base">
                            {c.cliente?.nombre || "Cliente"} · {c.tipoServicio}
                          </p>
                          <p className="text-xs md:text-sm text-slate-400">
                            {c.lugar?.nombre || "Sin lugar"} ·{" "}
                            {c.nombreTarifa} · {fmtEur(c.importeFactura ?? 0)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] md:text-xs font-semibold px-3 py-1"
                          onClick={() =>
                            router.push(
                              withAdmin(`/comparador?id=${c.id}`)
                            )
                          }
                        >
                          Cargar comparativa
                        </Button>
                      </div>
                    </div>
                  ))}
                  {comparativasFiltradas.length === 0 && (
                    <p className="text-xs text-slate-500">
                      No hay comparativas que coincidan con el filtro.
                    </p>
                  )}
                </div>
              </div>
            )}
          </Block>
        </section>

        {/* TABLAS DETALLADAS */}
        <section className="space-y-6">
          {/* Tabla Lugares */}
          <Block
            title="📍 Lugares (detalle)"
            subtitle="Listado completo de lugares asociados al agente."
          >
            {lugaresFiltrados.length === 0 ? (
              <Empty texto="Sin lugares para este agente." />
            ) : (
              <TableWrapper>
                <table className="w-full text-[14px] md:text-[15px]">
                  <thead className="bg-slate-900/80 text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">ID</th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Nombre
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Dirección
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        % Cliente
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        % Lugar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lugaresFiltrados.map((l: any) => (
                      <tr
                        key={l.id}
                        className="border-t border-slate-800/70 hover:bg-slate-900/70"
                      >
                        <td className="px-3 py-2 text-slate-400 font-mono text-xs md:text-sm">
                          #{l.id}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-50">
                          {l.nombre}
                        </td>
                        <td className="px-3 py-2 text-slate-200">
                          {l.direccion}
                        </td>
                        <td className="px-3 py-2 text-emerald-300 font-semibold">
                          {fmtPct(l.pctCliente)}
                        </td>
                        <td className="px-3 py-2 text-emerald-300 font-semibold">
                          {fmtPct(l.pctLugar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrapper>
            )}
          </Block>

          {/* Tabla Comparativas */}
          <Block
            title="📊 Comparativas (detalle)"
            subtitle="Todas las comparativas asociadas al agente."
            actions={
              <Button
                size="sm"
                className="bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs md:text-sm font-semibold px-3 py-1"
                onClick={() =>
                  router.push(withAdmin("/historial-comparativas"))
                }
              >
                Ver historial
              </Button>
            }
          >
            {comparativasFiltradas.length === 0 ? (
              <Empty texto="Sin comparativas para este agente." />
            ) : (
              <TableWrapper>
                <table className="w-full text-[14px] md:text-[15px]">
                  <thead className="bg-slate-900/80 text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">ID</th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Tipo
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Tarifa
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Importe
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Ahorro
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Comisión
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Cliente
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Lugar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparativasFiltradas.map((c: any) => (
                      <tr
                        key={c.id}
                        className="border-t border-slate-800/70 hover:bg-slate-900/70"
                      >
                        <td className="px-3 py-2 text-slate-400 font-mono text-xs md:text-sm">
                          #{c.id}
                        </td>
                        <td className="px-3 py-2">{c.tipoServicio}</td>
                        <td className="px-3 py-2">{c.nombreTarifa}</td>
                        <td className="px-3 py-2">
                          {fmtEur(c.importeFactura ?? 0)}
                        </td>
                        <td className="px-3 py-2 text-emerald-300 font-semibold">
                          {fmtEur(c.ahorro ?? 0)}
                        </td>
                        <td className="px-3 py-2 text-emerald-300 font-semibold">
                          {fmtEur(c.comision ?? 0)}
                        </td>
                        <td className="px-3 py-2">
                          {c.cliente?.nombre || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {c.lugar?.nombre || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrapper>
            )}
          </Block>

          {/* Tabla Leads */}
          <Block
            title="🧲 Leads del agente"
            subtitle="Leads captados y asignados al agente."
            actions={
              <Button
                size="sm"
                className="bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs md:text-sm font-semibold px-3 py-1"
                onClick={() => router.push(withAdmin("/leads"))}
              >
                Abrir leads
              </Button>
            }
          >
            {leadsFiltrados.length === 0 ? (
              <Empty texto="Sin leads para este agente." />
            ) : (
              <TableWrapper>
                <table className="w-full text-[14px] md:text-[15px]">
                  <thead className="bg-slate-900/80 text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Nombre
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Teléfono
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Lugar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsFiltrados.map((l: any) => (
                      <tr
                        key={l.id}
                        className="border-t border-slate-800/70 hover:bg-slate-900/70"
                      >
                        <td className="px-3 py-2">{l.nombre}</td>
                        <td className="px-3 py-2">{l.email}</td>
                        <td className="px-3 py-2">{l.telefono}</td>
                        <td className="px-3 py-2">
                          {l.lugar?.nombre || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrapper>
            )}
          </Block>

          {/* Tabla Usuarios vinculados */}
          <Block
            title="👤 Usuarios vinculados al agente"
            subtitle="Accesos de usuario asociados a este agente."
            actions={
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs md:text-sm font-semibold px-3 py-1"
                onClick={() =>
                  router.push(withAdmin("/crear-usuario"))
                }
              >
                Crear acceso usuario
              </Button>
            }
          >
            {usuariosFiltrados.length === 0 ? (
              <Empty texto="No hay usuarios vinculados a este agente." />
            ) : (
              <TableWrapper>
                <table className="w-full text-[14px] md:text-[15px]">
                  <thead className="bg-slate-900/80 text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Nombre
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Rol
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((u: any) => (
                      <tr
                        key={u.id}
                        className="border-t border-slate-800/70 hover:bg-slate-900/70"
                      >
                        <td className="px-3 py-2">{u.nombre}</td>
                        <td className="px-3 py-2">{u.email}</td>
                        <td className="px-3 py-2">{u.rol}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrapper>
            )}
          </Block>
        </section>
      </div>
    </div>
  );
}

/* Componentes auxiliares */

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-[11px] md:text-xs font-semibold text-slate-100">
      {label}
    </span>
  );
}

function Kpi({
  titulo,
  valor,
  hint,
  resaltado,
}: {
  titulo: string;
  valor: string;
  hint?: string;
  resaltado?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-5 border ${
        resaltado
          ? "bg-gradient-to-br from-emerald-600/30 via-emerald-500/10 to-sky-500/20 border-emerald-400/70"
          : "bg-slate-950/80 border-slate-800"
      }`}
    >
      <p className="text-xs md:text-sm text-slate-300 font-semibold">
        {titulo}
      </p>
      <p className="text-3xl md:text-4xl font-extrabold text-emerald-300 mt-2">
        {valor}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] md:text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-700 px-4 py-3">
      <p className="text-[11px] md:text-xs text-slate-400 font-semibold">
        {label}
      </p>
      <p className="text-sm md:text-base font-bold text-emerald-300 mt-1">
        {value}
      </p>
    </div>
  );
}

function Block({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-50">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] md:text-xs text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2 items-center">{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/40 border border-slate-800 px-6 py-8 text-center text-slate-400 text-sm md:text-base font-medium">
      {texto}
    </div>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      {children}
    </div>
  );
}
