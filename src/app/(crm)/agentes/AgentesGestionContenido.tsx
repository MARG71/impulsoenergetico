"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

type AdminInfo = {
  id: number;
  nombre: string;
  email: string;
};

type Agente = {
  id: number;
  nombre: string;
  email: string;
  telefono?: string | null;
  pctAgente?: string | number | null;
  creadoEn?: string;
  ocultoParaAdmin?: boolean;
  admin?: AdminInfo | null;
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

  // Campos formulario nuevo agente
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoPctAgente, setNuevoPctAgente] = useState("");
  const [nuevoOculto, setNuevoOculto] = useState(false);

  // Select de admins (solo SUPERADMIN)
  const [adminsDisponibles, setAdminsDisponibles] = useState<AdminInfo[]>([]);
  const [adminSeleccionado, setAdminSeleccionado] = useState<string>("");

  const role: Rol | null =
    ((session?.user as any)?.rol as Rol | undefined) ??
    ((session?.user as any)?.role as Rol | undefined) ??
    null;

  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";

  const adminIdFromQuery = searchParams.get("adminId");
  const adminQuery = adminIdFromQuery ? `?adminId=${adminIdFromQuery}` : "";

  const adminLabel = useMemo(() => {
    if (isAdmin) {
      return `Administrador actual: ${
        (session?.user as any)?.name ??
        (session?.user as any)?.nombre ??
        "ADMIN"
      }`;
    }
    if (isSuperadmin && adminIdFromQuery) {
      return `Tenant seleccionado · adminId = ${adminIdFromQuery}`;
    }
    if (isSuperadmin && !adminIdFromQuery) {
      return "Sin tenant seleccionado · elige un ADMIN en la sección “Admins” y entra con “Ver / Entrar”, o selecciona un admin en el desplegable al crear un agente.";
    }
    return null;
  }, [isAdmin, isSuperadmin, adminIdFromQuery, session]);

  // ─────────────────────
  // Cargar agentes
  // ─────────────────────
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

    // ─────────────────────
    // Cargar lista de admins (solo SUPERADMIN)
    // ─────────────────────
    useEffect(() => {
      if (!isSuperadmin) return;

      (async () => {
        try {
          const res = await fetch("/api/admins");
          const json = await res.json().catch(() => ({}));

          if (!res.ok) {
            console.error("Error cargando admins:", json.error);
            return;
          }

          const lista: AdminInfo[] = Array.isArray(json)
            ? json
            : Array.isArray((json as any).admins)
            ? (json as any).admins
            : Array.isArray((json as any).usuarios)
            ? (json as any).usuarios
            : [];

          setAdminsDisponibles(lista);
        } catch (e) {
          console.error("Error cargando admins para selector", e);
        }
      })();
    }, [isSuperadmin]);

  // Si eres SUPERADMIN y vienes con ?adminId=XXX, preseleccionamos ese admin
  useEffect(() => {
    if (
      isSuperadmin &&
      adminIdFromQuery &&
      !adminSeleccionado &&
      adminsDisponibles.length > 0
    ) {
      const existe = adminsDisponibles.some(
        (a) => String(a.id) === adminIdFromQuery
      );
      if (existe) {
        setAdminSeleccionado(adminIdFromQuery);
      }
    }
  }, [isSuperadmin, adminIdFromQuery, adminSeleccionado, adminsDisponibles]);

  // ─────────────────────
  // Filtrado de la tabla
  // ─────────────────────
  const agentesFiltrados = useMemo(() => {
    const q = normalizarTexto(busqueda);
    return agentes.filter((a) => {
      const camposBase = [
        a.id,
        a.nombre,
        a.email,
        a.telefono ?? "",
        a.pctAgente ?? "",
        a._count?.lugares ?? "",
        a._count?.leads ?? "",
        a._count?.comparativas ?? "",
      ];
      const camposAdmin =
        isSuperadmin && a.admin
          ? [a.admin.id, a.admin.nombre, a.admin.email]
          : [];
      const texto = normalizarTexto(camposBase.concat(camposAdmin).join(" "));
      return texto.includes(q);
    });
  }, [agentes, busqueda, isSuperadmin]);

  // ─────────────────────
  // Crear agente
  // ─────────────────────
  const handleCrearAgente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nuevoNombre || !nuevoEmail) {
      toast.error("Nombre y email son obligatorios");
      return;
    }

    // SUPERADMIN: debe tener o adminSeleccionado o adminIdFromQuery
    if (isSuperadmin && !adminSeleccionado && !adminIdFromQuery) {
      toast.error(
        "Selecciona un administrador en el desplegable o entra en el dashboard de un tenant para crear agentes."
      );
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
          ocultoParaAdmin: nuevoOculto,
          // Para SUPERADMIN pasamos el admin elegido o el de la query.
          adminSeleccionado: isSuperadmin
            ? adminSeleccionado || adminIdFromQuery
            : undefined,
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
      setNuevoOculto(false);

      setAgentes((prev) => [json, ...prev]);
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al crear agente");
    }
  };

  // ─────────────────────
  // Eliminar agente
  // ─────────────────────
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

  // ─────────────────────
  // Navegación
  // ─────────────────────
  const irADetalle = (id: number) => {
    const base = `/agentes/${id}/detalle`;
    router.push(adminIdFromQuery ? `${base}?adminId=${adminIdFromQuery}` : base);
  };

  const irAEditar = (id: number) => {
    const base = `/agentes/${id}`;
    router.push(adminIdFromQuery ? `${base}?adminId=${adminIdFromQuery}` : base);
  };

  // ─────────────────────
  // Render
  // ─────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
          <h1 className="text-xl font-bold mb-2">Gestión de agentes</h1>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-8 py-10 text-slate-50">
      {/* Contenedor ancho */}
      <div className="w-full max-w-[1700px] mx-auto space-y-8">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-fuchsia-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-1">
                Gestión de agentes
              </h1>
              <p className="text-sm md:text-base text-slate-300 max-w-2xl font-medium">
                Crea, edita y controla todos los agentes de este tenant.
              </p>
              {adminLabel && (
                <p className="text-xs md:text-sm text-emerald-300 mt-2 font-semibold">
                  {adminLabel}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 text-xs md:text-sm">
              <span className="text-slate-400 font-semibold">
                Total agentes:{" "}
                <span className="font-bold text-emerald-300">
                  {agentes.length}
                </span>
              </span>
              <Input
                placeholder="Buscar por cualquier campo (nombre, email, teléfono, admin…) "
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-80 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm"
              />
            </div>
          </div>
        </header>

        {/* CREACIÓN NUEVO AGENTE */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-8 py-6">
          <h2 className="text-xl font-bold mb-4">Crear nuevo agente</h2>

          <form onSubmit={handleCrearAgente} className="space-y-4">
            {/* Selector de admin SOLO SUPERADMIN */}
            {isSuperadmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-300 font-semibold">
                    Administrador asignado
                  </Label>
                  <select
                    className="mt-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 w-full text-sm"
                    value={adminSeleccionado}
                    onChange={(e) => setAdminSeleccionado(e.target.value)}
                  >
                    <option value="">
                      {adminIdFromQuery
                        ? "Usar admin del tenant actual o seleccionar otro…"
                        : "Seleccionar admin…"}
                    </option>
                    {adminsDisponibles.map((adm) => (
                      <option key={adm.id} value={adm.id}>
                        {adm.nombre} ({adm.email})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Si dejas esta opción sin elegir y estás en un dashboard de
                    tenant, se usará el admin de ese tenant. Si no, deberás
                    seleccionar un administrador.
                  </p>
                </div>
              </div>
            )}

            {/* Campos principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label className="text-xs text-slate-300 font-semibold">
                  Nombre
                </Label>
                <Input
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 font-medium"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300 font-semibold">
                  Email
                </Label>
                <Input
                  type="email"
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 font-medium"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300 font-semibold">
                  Teléfono
                </Label>
                <Input
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 font-medium"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300 font-semibold">
                  % Agente
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="ej. 15 o 0.15"
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 font-medium"
                  value={nuevoPctAgente}
                  onChange={(e) => setNuevoPctAgente(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-2">
              <div className="flex items-center gap-2">
                <input
                  id="oculto"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                  checked={nuevoOculto}
                  onChange={(e) => setNuevoOculto(e.target.checked)}
                />
                <Label
                  htmlFor="oculto"
                  className="text-xs text-slate-300 font-semibold"
                >
                  Marcar como oculto para el admin
                </Label>
              </div>

              <div className="flex flex-col items-start md:items-end gap-1">
                <Button
                  type="submit"
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold px-8 py-2"
                >
                  Crear agente
                </Button>
                <p className="text-[11px] text-slate-400 font-medium">
                  Al crear el agente se genera un usuario y se envía un email
                  con sus credenciales de acceso. El agente quedará asignado al
                  administrador indicado arriba (o al tenant actual).
                </p>
              </div>
            </div>
          </form>
        </section>

        {/* LISTADO DE AGENTES */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-8 py-6">
          <h2 className="text-xl font-bold mb-4">Listado de agentes</h2>

          {agentesFiltrados.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 px-6 py-10 text-center text-slate-400 font-medium">
              No hay agentes registrados aún.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-[13px] md:text-[15px]">
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    {isSuperadmin && (
                      <th className="px-4 py-3 text-left font-semibold">
                        Admin
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-semibold">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                      Teléfono
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      % Agente
                    </th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">
                      Lugares
                    </th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">
                      Leads
                    </th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">
                      Comparativas
                    </th>
                    <th className="px-4 py-3 text-left font-semibold hidden xl:table-cell">
                      Creado
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agentesFiltrados.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-slate-800/70 hover:bg-slate-900/80"
                    >
                      <td className="px-4 py-3 font-mono text-xs md:text-sm text-slate-400 font-semibold">
                        #{a.id}
                      </td>
                      {isSuperadmin && (
                        <td className="px-4 py-3 text-xs md:text-sm text-slate-200">
                          {a.admin ? (
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {a.admin.nombre}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {a.admin.email}
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-50">
                          {a.nombre}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs md:text-sm text-slate-300 font-medium">
                          {a.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-slate-300 hidden md:table-cell">
                        {a.telefono || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-emerald-300 font-semibold">
                        {fmtPct(a.pctAgente)}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm hidden lg:table-cell">
                        {a._count?.lugares ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm hidden lg:table-cell">
                        {a._count?.leads ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm hidden lg:table-cell">
                        {a._count?.comparativas ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[11px] md:text-xs text-slate-400 hidden xl:table-cell">
                        {fmtDate(a.creadoEn)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1"
                            onClick={() => irADetalle(a.id)}
                          >
                            Detalle
                          </Button>
                          <Button
                            size="sm"
                            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold px-3 py-1"
                            onClick={() => irAEditar(a.id)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700 font-semibold px-3 py-1"
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
