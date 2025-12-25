"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

type Agente = {
  id: number;
  nombre: string;
  email: string;
  telefono?: string | null;
  pctAgente?: string | number | null;
  creadoEn?: string;
  _count?: {
    lugares?: number;
    leads?: number;
    comparativas?: number;
  };
};

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

const toPct = (v: string) => {
  const n = Number((v ?? "").replace(",", "."));
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n;
};

function normalizarTexto(texto: string) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export default function AgentesGestionContenido() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoPctAgente, setNuevoPctAgente] = useState("");

  const role: Rol | null =
    ((session?.user as any)?.rol as Rol | undefined) ??
    ((session?.user as any)?.role as Rol | undefined) ??
    null;

  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";

  const adminId = searchParams.get("adminId");
  const adminQuery = adminId ? `?adminId=${adminId}` : "";

  const adminLabel = useMemo(() => {
    if (isAdmin) {
      return `Administrador actual: ${
        (session?.user as any)?.name ??
        (session?.user as any)?.nombre ??
        "ADMIN"
      }`;
    }
    if (isSuperadmin && adminId) {
      return `Tenant seleccionado · adminId = ${adminId}`;
    }
    if (isSuperadmin && !adminId) {
      return "Sin tenant seleccionado · elige un ADMIN en la sección “Admins” y entra con “Ver / Entrar”.";
    }
    return null;
  }, [isAdmin, isSuperadmin, adminId, session]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setError("Debes iniciar sesión.");
      setCargando(false);
      return;
    }

    if (!isSuperadmin && !isAdmin) {
      setError("Solo SUPERADMIN o ADMIN pueden gestionar agentes.");
      setCargando(false);
      return;
    }

    const cargar = async () => {
      try {
        const res = await fetch(`/api/agentes${adminQuery}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || "Error cargando agentes");
        } else {
          setAgentes(json || []);
        }
      } catch (e) {
        console.error(e);
        setError("Error de conexión al cargar agentes");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [session, status, isSuperadmin, isAdmin, adminQuery]);

  const agentesFiltrados = useMemo(() => {
    const q = normalizarTexto(busqueda);
    return agentes.filter((a) => {
      const texto = normalizarTexto(
        `${a.id} ${a.nombre} ${a.email} ${a.telefono ?? ""}`
      );
      return texto.includes(q);
    });
  }, [agentes, busqueda]);

  const handleCrearAgente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nuevoNombre || !nuevoEmail) {
      toast.error("Nombre y email son obligatorios");
      return;
    }

    try {
      const res = await fetch(`/api/agentes${adminQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoNombre,
          email: nuevoEmail,
          telefono: nuevoTelefono || null,
          pctAgente: toPct(nuevoPctAgente),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json.error || "Error al crear agente");
        return;
      }

      toast.success(
        "Agente creado correctamente. Se ha enviado un email con sus credenciales."
      );

      setNuevoNombre("");
      setNuevoEmail("");
      setNuevoTelefono("");
      setNuevoPctAgente("");

      setAgentes((prev) => [json, ...prev]);
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al crear agente");
    }
  };

  const handleEliminarAgente = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este agente?")) return;
    try {
      const res = await fetch(`/api/agentes/${id}${adminQuery}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json.error || "Error al eliminar agente");
        return;
      }

      toast.success("Agente eliminado");
      setAgentes((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al eliminar agente");
    }
  };

  const irADetalle = (id: number) => {
    const base = `/agentes/${id}/detalle`;
    router.push(adminId ? `${base}?adminId=${adminId}` : base);
  };

  const irAEditar = (id: number) => {
    const base = `/agentes/${id}`;
    router.push(adminId ? `${base}?adminId=${adminId}` : base);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
          <h1 className="text-lg font-bold mb-2">Gestión de agentes</h1>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        Cargando agentes…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-8 text-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-fuchsia-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-1">
                Gestión de agentes
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Crea, edita y controla todos los agentes de este tenant.
              </p>
              {adminLabel && (
                <p className="text-xs text-emerald-300 mt-2">{adminLabel}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 text-xs">
              <span className="text-slate-400">
                Total agentes:{" "}
                <span className="font-semibold text-emerald-300">
                  {agentes.length}
                </span>
              </span>
              <Input
                placeholder="Buscar por nombre, email o teléfono…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-64 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>
        </header>

        {/* CREACIÓN RÁPIDA */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 p-6">
          <h2 className="text-lg font-bold mb-4">Crear nuevo agente</h2>
          <form
            onSubmit={handleCrearAgente}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div>
              <Label className="text-xs text-slate-300">Nombre</Label>
              <Input
                className="bg-slate-900 border-slate-700 text-slate-100"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Email</Label>
              <Input
                type="email"
                className="bg-slate-900 border-slate-700 text-slate-100"
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Teléfono</Label>
              <Input
                className="bg-slate-900 border-slate-700 text-slate-100"
                value={nuevoTelefono}
                onChange={(e) => setNuevoTelefono(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">% Agente</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="ej. 15 o 0.15"
                className="bg-slate-900 border-slate-700 text-slate-100"
                value={nuevoPctAgente}
                onChange={(e) => setNuevoPctAgente(e.target.value)}
              />
            </div>

            <div className="md:col-span-4">
              <Button
                type="submit"
                className="mt-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold px-6"
              >
                Crear agente
              </Button>
              <p className="mt-1 text-xs text-slate-400">
                Al crear el agente se genera un usuario y se envía un email con
                sus credenciales de acceso. El agente quedará asignado al
                administrador indicado arriba (tenant actual).
              </p>
            </div>
          </form>
        </section>

        {/* LISTADO */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 p-6">
          <h2 className="text-lg font-bold mb-4">Listado de agentes</h2>

          {agentesFiltrados.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 px-6 py-10 text-center text-slate-400">
              No hay agentes registrados aún.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left hidden md:table-cell">
                      Teléfono
                    </th>
                    <th className="px-3 py-2 text-left">% Agente</th>
                    <th className="px-3 py-2 text-left hidden lg:table-cell">
                      Lugares
                    </th>
                    <th className="px-3 py-2 text-left hidden lg:table-cell">
                      Leads
                    </th>
                    <th className="px-3 py-2 text-left hidden lg:table-cell">
                      Comparativas
                    </th>
                    <th className="px-3 py-2 text-left hidden xl:table-cell">
                      Creado
                    </th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {agentesFiltrados.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-slate-800/70 hover:bg-slate-900/80"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-slate-400">
                        #{a.id}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-50">
                          {a.nombre}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-slate-300">
                          {a.email}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-300 hidden md:table-cell">
                        {a.telefono || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-emerald-300">
                        {fmtPct(a.pctAgente)}
                      </td>
                      <td className="px-3 py-2 text-xs hidden lg:table-cell">
                        {a._count?.lugares ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs hidden lg:table-cell">
                        {a._count?.leads ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs hidden lg:table-cell">
                        {a._count?.comparativas ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400 hidden xl:table-cell">
                        {fmtDate(a.creadoEn)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => irADetalle(a.id)}
                          >
                            Detalle
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-sky-500/60 text-sky-300 hover:bg-sky-500/10"
                            onClick={() => irAEditar(a.id)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => handleEliminarAgente(a.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
