// src/app/(crm)/admins/AdminsContenido.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

type AdminRow = {
  id: number;
  nombre: string;
  email: string;
  _count?: {
    agentesGestionados?: number;
    lugaresGestionados?: number;
    leadsGestionados?: number;
    comparativasGestionadas?: number;
  };
};

function normalizarTexto(texto: string) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export default function AdminsContenido() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const role: Rol | null =
    ((session?.user as any)?.rol as Rol | undefined) ??
    ((session?.user as any)?.role as Rol | undefined) ??
    null;

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (role !== "SUPERADMIN") {
      setCargando(false);
      return;
    }

    const cargar = async () => {
      try {
        setCargando(true);
        const res = await fetch("/api/admins", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(json.error || "Error cargando admins");
        } else {
          setAdmins(json || []);
        }
      } catch (e) {
        console.error(e);
        setError("Error de conexión al cargar admins");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [role, status]);

  const adminsFiltrados = useMemo(() => {
    const q = normalizarTexto(busqueda);
    if (!q) return admins;
    return admins.filter((a) =>
      normalizarTexto(
        `${a.id} ${a.nombre} ${a.email} ${
          a._count?.agentesGestionados ?? ""
        } ${a._count?.lugaresGestionados ?? ""} ${
          a._count?.leadsGestionados ?? ""
        } ${a._count?.comparativasGestionadas ?? ""}`
      ).includes(q)
    );
  }, [admins, busqueda]);

  const handleCrearAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role !== "SUPERADMIN") {
      toast.error("Solo SUPERADMIN puede crear admins.");
      return;
    }

    if (!nuevoNombre || !nuevoEmail) {
      toast.error("Nombre y email son obligatorios");
      return;
    }

    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoNombre,
          email: nuevoEmail,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json.error || "Error al crear admin");
        return;
      }

      toast.success(
        "Admin creado correctamente. Se ha enviado un email con sus credenciales."
      );

      setNuevoNombre("");
      setNuevoEmail("");

      setAdmins((prev) => [...prev, json]);
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al crear admin");
    }
  };

  const handleEliminarAdmin = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este admin / tenant?")) return;

    try {
      const res = await fetch(`/api/admins/${id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json.error || "Error al eliminar admin");
        return;
      }

      toast.success("Admin eliminado");
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al eliminar admin");
    }
  };

  const irAEditar = (id: number) => {
    router.push(`/admins/${id}`);
  };

  const entrarEnTenant = (id: number) => {
    router.push(`/dashboard?adminId=${id}`);
  };

  // ESTADOS

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        Cargando sesión…
      </div>
    );
  }

  if (role !== "SUPERADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
          <h1 className="text-xl font-bold mb-2">Acceso restringido</h1>
          <p className="text-sm">
            Esta sección es solo para usuarios con rol SUPERADMIN.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
          <h1 className="text-xl font-bold mb-2">Error cargando admins</h1>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // UI PRINCIPAL

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 md:px-10 py-8 text-slate-50">
      <div className="w-full max-w-[1700px] mx-auto space-y-8">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-fuchsia-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-1">
                Admins
              </h1>
              <p className="text-sm md:text-base text-slate-300 max-w-2xl font-medium">
                Lista global de administradores (tenants) de Impulso Energético.
              </p>
              <p className="text-xs md:text-sm text-emerald-300 mt-2 font-semibold">
                Desde aquí creas nuevos tenants y entras a su dashboard con
                “Ver / Entrar”.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 text-xs md:text-sm">
              <span className="text-slate-400 font-semibold">
                Total admins:{" "}
                <span className="font-bold text-emerald-300">
                  {admins.length}
                </span>
              </span>
              <Input
                placeholder="Buscar por nombre, email o ID…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-80 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm"
              />
            </div>
          </div>
        </header>

        {/* CREAR NUEVO ADMIN */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-8 py-6">
          <h2 className="text-xl font-bold mb-1">Crear nuevo admin</h2>
          <p className="text-xs text-slate-400 mb-4">
            Al crear el admin se genera un usuario con rol ADMIN y se envía un
            email con sus credenciales de acceso.
          </p>

          <form
            onSubmit={handleCrearAdmin}
            className="grid grid-cols-1 md:grid-cols-[1.4fr_1.4fr_auto] gap-3 md:items-end"
          >
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Nombre
              </label>
              <Input
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Administrador Impulso"
                className="bg-slate-900 border-slate-700 text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Email
              </label>
              <Input
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                placeholder="admin@impulso.com"
                className="bg-slate-900 border-slate-700 text-slate-100 text-sm"
              />
            </div>
            <div className="flex md:justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6"
              >
                Crear admin
              </Button>
            </div>
          </form>
        </section>

        {/* LISTADO DE ADMINS */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-8 py-6">
          <h2 className="text-xl font-bold mb-4">Listado de admins</h2>

          {cargando ? (
            <div className="text-slate-400 text-sm">Cargando admins…</div>
          ) : adminsFiltrados.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 px-6 py-8 text-center text-slate-400 text-sm">
              No hay admins registrados.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-[13px] md:text-[15px]">
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                      Agentes
                    </th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                      Lugares
                    </th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                      Leads
                    </th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">
                      Comparativas
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adminsFiltrados.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-slate-800/70 hover:bg-slate-900/80"
                    >
                      <td className="px-4 py-3 font-mono text-xs md:text-sm text-slate-400 font-semibold">
                        #{a.id}
                      </td>
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
                      <td className="px-4 py-3 text-xs md:text-sm hidden md:table-cell">
                        {a._count?.agentesGestionados ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm hidden md:table-cell">
                        {a._count?.lugaresGestionados ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm hidden md:table-cell">
                        {a._count?.leadsGestionados ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm hidden lg:table-cell">
                        {a._count?.comparativasGestionadas ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1"
                            onClick={() => entrarEnTenant(a.id)}
                          >
                            Ver / Entrar
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
                            onClick={() => handleEliminarAdmin(a.id)}
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
