// src/app/(crm)/agentes/ID/page.tsx
// src/app/(crm)/agentes/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const toPct = (v: string) => {
  const n = Number((v ?? "").replace(",", "."));
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n;
};

export default function EditarAgentePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = searchParams.get("adminId");
  const adminQuery = adminId ? `?adminId=${adminId}` : "";

  const { data: session, status } = useSession();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pctAgente, setPctAgente] = useState("");
  const [ocultoParaAdmin, setOcultoParaAdmin] = useState(false);

  const [adminNombre, setAdminNombre] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setError("Debes iniciar sesión.");
      setCargando(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/agentes/${id}${adminQuery}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || "Error cargando agente");
        } else {
          setNombre(json.nombre || "");
          setEmail(json.email || "");
          setTelefono(json.telefono || "");
          setPctAgente(
            json.pctAgente != null ? String(Number(json.pctAgente) * 100) : ""
          );
          setOcultoParaAdmin(Boolean(json.ocultoParaAdmin));

          if (json.admin) {
            setAdminNombre(json.admin.nombre || null);
            setAdminEmail(json.admin.email || null);
          }
        }
      } catch (e) {
        console.error(e);
        setError("Error de conexión al cargar agente");
      } finally {
        setCargando(false);
      }
    })();
  }, [session, status, id, adminQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !email) {
      toast.error("Nombre y email son obligatorios");
      return;
    }

    try {
      const res = await fetch(`/api/agentes/${id}${adminQuery}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono: telefono || null,
          pctAgente: toPct(pctAgente),
          ocultoParaAdmin,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json.error || "Error al actualizar agente");
        return;
      }

      toast.success("Agente actualizado correctamente");
      // Volvemos al listado manteniendo el adminId si lo había
      router.push(adminId ? `/agentes?adminId=${adminId}` : "/agentes");
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al actualizar agente");
    }
  };

  const volverAgentes = () => {
    router.push(adminId ? `/agentes?adminId=${adminId}` : "/agentes");
  };

  const irDashboard = () => {
    router.push(adminId ? `/dashboard?adminId=${adminId}` : "/dashboard");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
          <h1 className="text-xl font-bold mb-2">Editar agente</h1>
          <p className="text-sm">{error}</p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="border-slate-600 text-slate-100"
              onClick={volverAgentes}
            >
              Volver a agentes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        Cargando agente…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 md:px-10 py-8 text-slate-50">
      <div className="w-full max-w-[1400px] mx-auto space-y-8">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/25 via-sky-500/20 to-fuchsia-500/25 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                Editar agente
              </h1>
              <p className="text-sm md:text-base text-slate-300 max-w-2xl font-medium">
                Actualiza los datos básicos del agente y su visibilidad en el CRM.
              </p>
              {adminNombre && (
                <p className="text-xs md:text-sm text-emerald-300 mt-2 font-semibold">
                  Administrador: {adminNombre}{" "}
                  {adminEmail && (
                    <span className="text-slate-300 font-normal">
                      ({adminEmail})
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-slate-900 border border-slate-700 text-slate-100 hover:bg-slate-800 px-4"
                  onClick={volverAgentes}
                >
                  ⬅ Volver a agentes
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 px-4"
                  onClick={irDashboard}
                >
                  🏠 Dashboard
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                ID agente: <span className="font-mono">#{id}</span>
              </p>
            </div>
          </div>
        </header>

        {/* FORMULARIO */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6">
          <h2 className="text-xl font-bold mb-4">Datos del agente</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-slate-100 font-semibold">Nombre</Label>
              <Input
                type="text"
                className="bg-slate-900 border-slate-700 text-slate-100"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-100 font-semibold">Email</Label>
              <Input
                type="email"
                className="bg-slate-900 border-slate-700 text-slate-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-100 font-semibold">Teléfono</Label>
              <Input
                type="text"
                className="bg-slate-900 border-slate-700 text-slate-100"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-100 font-semibold">
                % Agente (sobre comisión)
              </Label>
              <Input
                type="number"
                step="0.01"
                className="bg-slate-900 border-slate-700 text-slate-100"
                placeholder="Ej. 15 (para 15%)"
                value={pctAgente}
                onChange={(e) => setPctAgente(e.target.value)}
              />
              <p className="text-[11px] text-slate-500">
                Si pones 15, se guardará como 0.15 en base de datos.
              </p>
            </div>

            <div className="col-span-1 md:col-span-2 flex items-center gap-3 mt-2">
              <input
                id="ocultoParaAdmin"
                type="checkbox"
                checked={ocultoParaAdmin}
                onChange={(e) => setOcultoParaAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500"
              />
              <Label
                htmlFor="ocultoParaAdmin"
                className="text-slate-100 text-sm cursor-pointer"
              >
                Marcar agente como <span className="font-semibold">oculto para el administrador</span>{" "}
                (no aparecerá en los listados normales).
              </Label>
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 text-slate-100"
                onClick={volverAgentes}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6"
              >
                Guardar cambios
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
