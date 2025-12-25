"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

export default function AdminEditarContenido() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: session, status } = useSession();
  const role =
    ((session?.user as any)?.rol as Rol | undefined) ??
    ((session?.user as any)?.role as Rol | undefined) ??
    null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");

  // 1) Cargar datos del admin
  useEffect(() => {
    if (!id) return;
    if (status === "loading") return;

    if (role !== "SUPERADMIN") {
      setError("Solo el SUPERADMIN puede editar administradores.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admins/${id}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error || "Error cargando admin");
        } else {
          setNombre(data.nombre || "");
          setEmail(data.email || "");
        }
      } catch (e) {
        console.error(e);
        setError("Error de conexión al cargar el admin");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, status, role]);

  // 2) Guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email) {
      toast.error("Nombre y email son obligatorios.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/admins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Error al guardar cambios");
        return;
      }

      toast.success("Administrador actualizado correctamente.");
      // Vuelves a la lista de admins
      router.push("/admins");
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        Cargando admin…
      </div>
    );
  }

  if (error || role !== "SUPERADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
          <h1 className="text-xl font-bold mb-2">Editar administrador</h1>
          <p className="text-sm">
            {error || "Solo SUPERADMIN puede acceder a esta pantalla."}
          </p>
          <div className="mt-4 flex justify-end">
            <Button
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
              onClick={() => router.push("/dashboard")}
            >
              Ir al dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 md:px-10 py-8 text-slate-50">
      <div className="w-full max-w-[1200px] mx-auto space-y-8">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/25 via-sky-500/20 to-fuchsia-500/25 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Image
                src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                alt="Impulso Energético"
                width={140}
                height={42}
                priority
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                  Editar administrador
                </h1>
                <p className="text-xs md:text-sm text-slate-300">
                  Actualiza los datos del tenant (nombre y email de acceso).
                </p>
                <p className="mt-1 text-[11px] md:text-xs text-slate-400">
                  ID admin: <span className="font-semibold text-emerald-300">#{id}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-slate-900 border border-slate-700 text-slate-100 hover:bg-slate-800 px-4"
                  onClick={() => router.push("/admins")}
                >
                  ⬅ Volver a admins
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 px-4"
                  onClick={() => router.push(`/dashboard?adminId=${id}`)}
                >
                  Ir al dashboard de este tenant
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* FORMULARIO */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6">
          <h2 className="text-xl font-bold mb-4">Datos del administrador</h2>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Nombre
                </label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                  placeholder="Nombre del administrador / tenant"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Email de acceso
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                  placeholder="correo@empresa.com"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Estos datos se usan como referencia del tenant y como email de
              acceso del ADMIN principal.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 text-slate-100 bg-slate-900 hover:bg-slate-800"
                onClick={() => router.push("/admins")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
