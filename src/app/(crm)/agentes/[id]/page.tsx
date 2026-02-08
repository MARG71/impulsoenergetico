// src/app/(crm)/agentes/ID/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";
type NivelComision = "C1" | "C2" | "C3" | "ESPECIAL";

type AdminInfo = {
  id: number;
  nombre: string;
  email: string;
};

const toPct = (v: string) => {
  const n = Number((v ?? "").replace(",", "."));
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n;
};

function pickNivelComisionFromAgente(json: any): NivelComision {
  // Intentamos leer el nivel de varios sitios posibles para no romper
  const candidates = [
    json?.nivelComisionDefault,
    json?.usuario?.nivelComisionDefault,
    Array.isArray(json?.usuarios) ? json?.usuarios?.[0]?.nivelComisionDefault : undefined,
  ];

  const v = candidates.find((x) => typeof x === "string" && x.length > 0);
  if (v === "C1" || v === "C2" || v === "C3" || v === "ESPECIAL") return v;

  return "C1";
}

export default function EditarAgentePage() {
  const router = useRouter();
  const params = useParams() as { id: string };
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const { id } = params;
  const adminIdFromQuery = searchParams.get("adminId");

  const qs = useMemo(() => (adminIdFromQuery ? `?adminId=${adminIdFromQuery}` : ""), [adminIdFromQuery]);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pctAgente, setPctAgente] = useState("");
  const [ocultoParaAdmin, setOcultoParaAdmin] = useState(false);

  // ✅ NUEVO: nivel comisión por defecto del agente (C1/C2/C3/ESPECIAL)
  const [nivelComisionDefault, setNivelComisionDefault] = useState<NivelComision>("C1");

  const [adminAsignado, setAdminAsignado] = useState<AdminInfo | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role: Rol | null =
    ((session?.user as any)?.rol as Rol | undefined) ??
    ((session?.user as any)?.role as Rol | undefined) ??
    null;

  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";

  // ────────────────────────────────────
  // Cargar datos del agente
  // ────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    if (status === "loading") return;

    if (!session) {
      setError("Debes iniciar sesión.");
      setCargando(false);
      return;
    }

    if (!isSuperadmin && !isAdmin) {
      setError("Solo SUPERADMIN o ADMIN pueden editar agentes.");
      setCargando(false);
      return;
    }

    const cargar = async () => {
      try {
        const res = await fetch(`/api/agentes/${id}${qs}`);
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(json.error || "Error cargando agente");
          setCargando(false);
          return;
        }

        setNombre(json.nombre || "");
        setEmail(json.email || "");
        setTelefono(json.telefono || "");
        setPctAgente(json.pctAgente != null ? String(Number(json.pctAgente) * 100) : "");
        setOcultoParaAdmin(!!json.ocultoParaAdmin);
        setAdminAsignado(json.admin || null);

        // ✅ NUEVO
        setNivelComisionDefault(pickNivelComisionFromAgente(json));
      } catch (e) {
        console.error(e);
        setError("Error de conexión al cargar agente");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [id, status, session, isSuperadmin, isAdmin, qs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !email) {
      toast.error("Nombre y email son obligatorios");
      return;
    }

    try {
      const res = await fetch(`/api/agentes/${id}${qs}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono: telefono || null,
          pctAgente: toPct(pctAgente),
          ocultoParaAdmin,

          // ✅ NUEVO: lo enviamos para que backend lo guarde (en Usuario o en Agente, según tu implementación)
          nivelComisionDefault,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json.error || "Error al actualizar agente");
        return;
      }

      toast.success("Agente actualizado correctamente");
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión al actualizar agente");
    }
  };

  const volverAAgentes = () => {
    const base = "/agentes";
    router.push(adminIdFromQuery ? `${base}?adminId=${adminIdFromQuery}` : base);
  };

  const irADashboard = () => {
    const base = "/dashboard";
    router.push(adminIdFromQuery ? `${base}?adminId=${adminIdFromQuery}` : base);
  };

  // ────────────────────────────────────
  // Render
  // ────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4">
          <h1 className="text-xl font-bold mb-2">Editar agente</h1>
          <p className="text-sm">{error}</p>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-8 py-10 text-slate-50">
      <div className="w-full max-w-[1700px] mx-auto space-y-8">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-fuchsia-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-1">Editar agente</h1>
              <p className="text-sm md:text-base text-slate-300 max-w-2xl font-medium">
                Actualiza los datos básicos del agente, su visibilidad y el nivel de comisión por defecto.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                ID agente:{" "}
                <span className="font-mono font-semibold text-slate-300">#{id}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                className="bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800 text-xs md:text-sm"
                onClick={volverAAgentes}
              >
                ⬅ Volver a agentes
              </Button>
              <Button
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs md:text-sm"
                onClick={irADashboard}
              >
                🏠 Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* FORMULARIO */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-8 py-8">
          <h2 className="text-2xl font-bold mb-6">Datos del agente</h2>

          {/* Admin asignado (solo info) */}
          <div className="mb-6">
            <Label className="text-xs uppercase tracking-wide text-slate-400">
              Administrador asignado
            </Label>
            <div className="mt-1 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <input
                type="text"
                disabled
                value={adminAsignado ? `${adminAsignado.nombre} (${adminAsignado.email})` : "—"}
                className="w-full sm:max-w-lg bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
              />
              {isSuperadmin && (
                <p className="text-[11px] text-slate-500 max-w-sm">
                  (Solo lectura por ahora. Si quieres mover un agente de tenant lo hacemos en un flujo seguro.)
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-slate-200">Nombre</Label>
                <Input
                  type="text"
                  className="bg-slate-900 border-slate-700 text-slate-100 mt-1"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label className="text-slate-200">Teléfono</Label>
                <Input
                  type="text"
                  className="bg-slate-900 border-slate-700 text-slate-100 mt-1"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="oculto"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900"
                  checked={ocultoParaAdmin}
                  onChange={(e) => setOcultoParaAdmin(e.target.checked)}
                />
                <Label htmlFor="oculto" className="text-xs md:text-sm text-slate-300">
                  Marcar agente como{" "}
                  <span className="font-semibold">oculto para el administrador</span>{" "}
                  <span className="text-slate-500">(no aparecerá en los listados normales).</span>
                </Label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-200">Email</Label>
                <Input
                  type="email"
                  className="bg-slate-900 border-slate-700 text-slate-100 mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label className="text-slate-200">% Agente (sobre comisión)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="ej. 15 o 0.15"
                  className="bg-slate-900 border-slate-700 text-slate-100 mt-1"
                  value={pctAgente}
                  onChange={(e) => setPctAgente(e.target.value)}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Si pones <strong>15</strong>, se guardará como <strong>0.15</strong> en base de datos.
                </p>
              </div>

              {/* ✅ NUEVO: NIVEL COMISIÓN */}
              <div>
                <Label className="text-slate-200">Nivel comisión por defecto</Label>
                <select
                  className="mt-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 w-full text-sm"
                  value={nivelComisionDefault}
                  onChange={(e) => setNivelComisionDefault(e.target.value as NivelComision)}
                >
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                  <option value="C3">C3</option>
                  <option value="ESPECIAL">ESPECIAL</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Este nivel se usa como base para reglas y cálculo de comisiones (si no hay override).
                </p>
              </div>

              <div className="flex justify-end items-center pt-4 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800"
                  onClick={volverAAgentes}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
                >
                  Guardar cambios
                </Button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
