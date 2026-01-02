"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

const fmtPct = (v: any) => (v == null ? "—" : `${(Number(v) * 100).toFixed(1)}%`);
const euro = (v: any) =>
  v == null || Number.isNaN(Number(v)) ? "—" : `${Number(v).toFixed(2)} €`;

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

export default function DetalleLugar() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";
  const isAgente = role === "AGENTE";
  const isLugar = role === "LUGAR";

  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;

  const tenantMode =
    isSuperadmin &&
    typeof adminIdContext === "number" &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  const adminQuery = tenantMode && adminIdContext ? `?adminId=${adminIdContext}` : "";

  const withTenant = (href: string) => {
    if (!tenantMode || !adminIdContext) return href;
    const hasQuery = href.includes("?");
    return `${href}${hasQuery ? "&" : "?"}adminId=${adminIdContext}`;
  };

  const [lugar, setLugar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [qUsuarios, setQUsuarios] = useState("");
  const [qLeads, setQLeads] = useState("");
  const [qComps, setQComps] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/lugares/${id}/detalle${adminQuery}`, { cache: "no-store" });
        const data = await res.json();
        setLugar(res.ok ? data : null);
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id, adminQuery]);

  const usuariosFiltrados = useMemo(() => {
    const q = qUsuarios.trim().toLowerCase();
    const arr = lugar?.usuarios ?? [];
    if (!q) return arr;
    return arr.filter((u: any) =>
      `${u.nombre} ${u.email} ${u.rol}`.toLowerCase().includes(q)
    );
  }, [lugar, qUsuarios]);

  const leadsFiltrados = useMemo(() => {
    const q = qLeads.trim().toLowerCase();
    const arr = lugar?.leads ?? [];
    if (!q) return arr;
    return arr.filter((l: any) =>
      `${l.nombre} ${l.email} ${l.telefono} ${l.estado}`.toLowerCase().includes(q)
    );
  }, [lugar, qLeads]);

  const comparativasFiltradas = useMemo(() => {
    const q = qComps.trim().toLowerCase();
    const arr = lugar?.comparativas ?? [];
    if (!q) return arr;
    return arr.filter((c: any) =>
      `${c.id} ${c.tipoServicio} ${c.nombreTarifa} ${c.cliente?.nombre ?? ""} ${c.agente?.nombre ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [lugar, qComps]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">
        <div className="text-slate-300 font-semibold">Cargando detalle del lugar…</div>
      </div>
    );
  }

  if (!lugar) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center">
          <div className="text-xl font-bold mb-2">Lugar no encontrado</div>
          <Button onClick={() => router.push(withTenant("/lugares"))} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold">
            Volver a lugares
          </Button>
        </div>
      </div>
    );
  }

  const canManage = isAdmin || isSuperadmin; // editar/eliminar/acciones sensibles

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 py-8 text-slate-50">
      <div className="w-full max-w-[1700px] mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
              alt="Impulso Energético"
              width={150}
              height={40}
              className="hidden md:block"
              priority
            />
            <div>
              <div className="text-sm text-slate-300 font-semibold">
                CRM · Lugares · Detalle
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                {lugar.nombre} <span className="text-slate-400 font-semibold">· #{lugar.id}</span>
              </h1>
              <div className="text-slate-300 font-medium">{lugar.direccion}</div>
              {tenantMode && (
                <div className="text-xs text-emerald-300 mt-1 font-semibold">
                  Modo tenant · admin #{adminIdContext}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              onClick={() => router.push(withTenant("/lugares"))}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold"
            >
              ⬅ Volver
            </Button>
            <Button
              onClick={() => router.push(withTenant("/dashboard"))}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
            >
              🏠 Dashboard
            </Button>
            <Button
              onClick={() =>
                window.open(`/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`, "_blank")
              }
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold"
            >
              🔗 Abrir landing
            </Button>
            <Button
              onClick={() => router.push(withTenant(`/lugares/cartel/${lugar.id}`))}
              className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold"
            >
              🧾 Cartel A4
            </Button>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="text-slate-300 text-sm font-semibold">Comparativas</div>
            <div className="text-3xl font-extrabold text-emerald-300">{lugar?._count?.comparativas ?? (lugar.comparativas?.length ?? 0)}</div>
            <div className="text-xs text-slate-400 mt-1">Últimas comparativas y ahorro/comisión</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="text-slate-300 text-sm font-semibold">Leads</div>
            <div className="text-3xl font-extrabold text-sky-300">{lugar?._count?.leads ?? (lugar.leads?.length ?? 0)}</div>
            <div className="text-xs text-slate-400 mt-1">Contactos captados por este lugar</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="text-slate-300 text-sm font-semibold">Usuarios</div>
            <div className="text-3xl font-extrabold text-fuchsia-300">{lugar?._count?.usuarios ?? (lugar.usuarios?.length ?? 0)}</div>
            <div className="text-xs text-slate-400 mt-1">Accesos vinculados a este lugar</div>
          </div>
        </section>

        {/* Datos del lugar */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <h2 className="text-xl font-extrabold mb-4">📍 Datos del lugar</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs text-slate-400 font-semibold mb-1">QR interno</div>
              <div className="font-mono text-sm text-slate-200 break-all">{lugar.qrCode}</div>
              <div className="text-xs text-slate-400 mt-2">
                % Cliente: <span className="text-emerald-300 font-semibold">{fmtPct(lugar.pctCliente)}</span>{" "}
                · % Lugar: <span className="text-emerald-300 font-semibold">{fmtPct(lugar.pctLugar)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs text-slate-400 font-semibold mb-1">Agente</div>
              <div className="text-slate-100 font-bold">{lugar.agente?.nombre ?? "—"}</div>
              <div className="text-sm text-slate-300">{lugar.agente?.email ?? "—"}</div>
              <div className="text-sm text-slate-300">{lugar.agente?.telefono ?? "—"}</div>
              {lugar.agenteId && (
                <Button
                  onClick={() => router.push(withTenant(`/agentes/${lugar.agenteId}/detalle`))}
                  className="mt-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold"
                  size="sm"
                >
                  Ver detalle del agente
                </Button>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs text-slate-400 font-semibold mb-1">Especial</div>
              <div className="text-slate-100 font-bold">
                {lugar.especial ? "✅ Lugar especial" : "— Lugar normal"}
              </div>
              <div className="text-sm text-slate-300 mt-1">
                Aportación acumulada:{" "}
                <span className="text-emerald-300 font-semibold">
                  {Number(lugar.aportacionAcumulada ?? 0)} €
                </span>
              </div>
              {lugar.especialMensaje && (
                <div className="mt-2 text-sm text-slate-200 italic">
                  “{lugar.especialMensaje}”
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Usuarios */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-extrabold">👥 Usuarios vinculados</h2>
            <Input
              value={qUsuarios}
              onChange={(e) => setQUsuarios(e.target.value)}
              placeholder="Buscar por nombre, email o rol…"
              className="md:w-[420px] bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {usuariosFiltrados.length === 0 ? (
            <div className="text-slate-400">No hay usuarios vinculados a este lugar.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/70 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u: any) => (
                    <tr key={u.id} className="border-t border-slate-800/70 hover:bg-slate-900/60">
                      <td className="px-4 py-3 font-semibold">{u.nombre}</td>
                      <td className="px-4 py-3 text-slate-200">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200">
                          {u.rol}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Leads */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-extrabold">🧲 Leads</h2>
            <Input
              value={qLeads}
              onChange={(e) => setQLeads(e.target.value)}
              placeholder="Buscar por nombre, email, teléfono o estado…"
              className="md:w-[420px] bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {leadsFiltrados.length === 0 ? (
            <div className="text-slate-400">No hay leads en este lugar.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/70 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsFiltrados.map((l: any) => (
                    <tr key={l.id} className="border-t border-slate-800/70 hover:bg-slate-900/60">
                      <td className="px-4 py-3 font-semibold">{l.nombre}</td>
                      <td className="px-4 py-3 text-slate-200">{l.email}</td>
                      <td className="px-4 py-3 text-slate-200">{l.telefono}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200">
                          {l.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {l.creadoEn ? new Date(l.creadoEn).toLocaleString("es-ES") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Comparativas */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-extrabold">📊 Comparativas</h2>
            <Input
              value={qComps}
              onChange={(e) => setQComps(e.target.value)}
              placeholder="Buscar por ID, tipo, tarifa, cliente o agente…"
              className="md:w-[420px] bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {comparativasFiltradas.length === 0 ? (
            <div className="text-slate-400">No hay comparativas asociadas al lugar.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/70 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Tarifa</th>
                    <th className="px-4 py-3 text-left font-semibold">Importe</th>
                    <th className="px-4 py-3 text-left font-semibold">Ahorro</th>
                    <th className="px-4 py-3 text-left font-semibold">Comisión</th>
                    <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {comparativasFiltradas.map((c: any) => (
                    <tr key={c.id} className="border-t border-slate-800/70 hover:bg-slate-900/60">
                      <td className="px-4 py-3 font-mono text-slate-300 font-semibold">#{c.id}</td>
                      <td className="px-4 py-3 text-slate-200">{c.tipoServicio}</td>
                      <td className="px-4 py-3 text-slate-200">{c.nombreTarifa}</td>
                      <td className="px-4 py-3 text-slate-200">{euro(c.importeFactura)}</td>
                      <td className="px-4 py-3 text-emerald-300 font-semibold">{euro(c.ahorro)}</td>
                      <td className="px-4 py-3 text-sky-300 font-semibold">{euro(c.comision)}</td>
                      <td className="px-4 py-3 text-slate-200">{c.cliente?.nombre ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {c.fecha ? new Date(c.fecha).toLocaleDateString("es-ES") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Nota para roles */}
          {(isAgente || isLugar) && (
            <div className="mt-4 text-xs text-slate-400">
              Estás viendo este detalle en modo <span className="font-semibold text-slate-300">{role}</span>.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
