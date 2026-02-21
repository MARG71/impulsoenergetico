// src/app/registro/RegistroFormulario.tsx
"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const IMPULSO_LOGO = "/logo-impulso.png";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

export default function RegistroFormulario() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const agenteIdParam = searchParams.get("agenteId") || "";
  const lugarIdParam = searchParams.get("lugarId") || "";
  const qrParam = searchParams.get("qr") || "";
  const vParam = searchParams.get("v") || "";

  // ✅ nombre del lugar por query (lo pasamos desde /share/lugar/[id])
  const lugarNombreParam = searchParams.get("lugarNombre") || "";

  const nombreParam = searchParams.get("nombre") || "";

  const [nombre, setNombre] = useState(nombreParam);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (nombreParam) setNombre(nombreParam);
  }, [nombreParam]);

  const accesoTexto = useMemo(() => {
    if (lugarNombreParam) return `Acceso detectado desde: ${lugarNombreParam}`;
    if (lugarIdParam) return "Acceso detectado desde un lugar autorizado";
    return "Acceso seguro · Registro en 1 minuto";
  }, [lugarNombreParam, lugarIdParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setOk(false);

    try {
      // ✅ fallback a localStorage si faltan IDs
      const agenteLs =
        typeof window !== "undefined" ? localStorage.getItem("agenteId") : null;
      const lugarLs =
        typeof window !== "undefined" ? localStorage.getItem("lugarId") : null;

      const agenteToSend = agenteIdParam || agenteLs || null;
      const lugarToSend = lugarIdParam || lugarLs || null;

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          agenteId: agenteToSend ? Number(agenteToSend) : null,
          lugarId: lugarToSend ? Number(lugarToSend) : null,
        }),
      });

      if (!res.ok) {
        const dataErr = await res.json().catch(() => ({}));
        throw new Error(dataErr?.error || "Error al registrar tus datos");
      }

      const data = await res.json();
      const lead = data.lead || {};
      const esNuevoLead = !!data.nuevoLead;

      const nombreFinal: string = lead.nombre || nombre;

      const lugarFinal: number | undefined =
        typeof lead.lugarId === "number"
          ? lead.lugarId
          : lugarToSend
          ? Number(lugarToSend)
          : undefined;

      const agenteFinal: number | undefined =
        typeof lead.agenteId === "number"
          ? lead.agenteId
          : agenteToSend
          ? Number(agenteToSend)
          : undefined;

      // ✅ Guardamos en localStorage
      try {
        if (nombreFinal) localStorage.setItem("clienteNombre", nombreFinal);
        if (email) localStorage.setItem("clienteEmail", email);
        if (telefono) localStorage.setItem("clienteTelefono", telefono);
        if (agenteFinal) localStorage.setItem("agenteId", String(agenteFinal));
        if (lugarFinal) localStorage.setItem("lugarId", String(lugarFinal));
        if (qrParam) localStorage.setItem("qr", qrParam);
        if (vParam) localStorage.setItem("v", vParam);
        localStorage.setItem("leadOK", "1");
      } catch {
        // ignore
      }

      if (!esNuevoLead) {
        alert(
          "Este email ya estaba registrado. Te llevamos a tus ofertas."
        );
      }

      // ✅ Redirigir (no mostramos agente aquí)
      const params = new URLSearchParams();
      if (nombreFinal) params.set("nombre", nombreFinal);
      if (lugarFinal) params.set("lugarId", String(lugarFinal));
      if (agenteFinal) params.set("agenteId", String(agenteFinal));
      if (qrParam) params.set("qr", qrParam);
      if (vParam) params.set("v", vParam);

      setOk(true);
      router.push(`/bienvenida?${params.toString()}`);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Ha ocurrido un error al registrar tus datos. Inténtalo de nuevo."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 text-slate-50">
      {/* Fondo PRO */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.22),transparent_58%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.12),transparent_58%)]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      <div className="mx-auto w-full max-w-[780px]">
        <div className="rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.55)] overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-10 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-8 rounded-full bg-emerald-400/20 blur-3xl" />
                <Image
                  src={IMPULSO_LOGO}
                  alt="Impulso Energético"
                  width={140}
                  height={140}
                  priority
                  className="relative h-[78px] w-[78px] sm:h-[100px] sm:w-[100px] object-contain"
                />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-black tracking-[0.35em] text-emerald-300 uppercase">
                  IMPULSO ENERGÉTICO
                </p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold leading-[1.08]">
                  Regístrate para{" "}
                  <span className="text-emerald-300">desbloquear ofertas</span>{" "}
                  y recibir tu estudio de ahorro.
                </h1>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-base sm:text-lg font-extrabold text-white">
                ✅ {accesoTexto}
              </div>
              <div className="mt-1 text-sm sm:text-base text-slate-300 font-semibold">
                Tus datos se usan solo para darte el estudio y las ofertas. Sin
                spam.
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 sm:px-10 pb-10">
            <div className="grid gap-4">
              <div className="space-y-1">
                <label className="block text-sm sm:text-base font-extrabold text-slate-200">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Miguel Ángel Reyes"
                  className="w-full rounded-2xl bg-slate-900/60 border border-white/10 px-4 py-4 text-base sm:text-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm sm:text-base font-extrabold text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  className="w-full rounded-2xl bg-slate-900/60 border border-white/10 px-4 py-4 text-base sm:text-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm sm:text-base font-extrabold text-slate-200">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="600 000 000"
                  className="w-full rounded-2xl bg-slate-900/60 border border-white/10 px-4 py-4 text-base sm:text-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                  required
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 font-extrabold">
                  {error}
                </div>
              )}

              {ok && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200 font-extrabold">
                  Datos registrados correctamente. Te estamos redirigiendo…
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className={cx(
                  "group relative overflow-hidden rounded-2xl px-6 py-5 text-lg sm:text-xl font-extrabold",
                  "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
                  "shadow-[0_20px_80px_rgba(16,185,129,0.25)]",
                  "disabled:opacity-60 disabled:cursor-not-allowed transition"
                )}
              >
                <span className="relative z-10">
                  {cargando ? "Guardando..." : "Guardar mis datos y ver ofertas 👇"}
                </span>
                <span className="absolute -inset-10 opacity-0 group-hover:opacity-100 transition">
                  <span className="absolute -inset-10 bg-white/20 blur-2xl animate-pulse" />
                </span>
              </button>

              <p className="text-center text-xs sm:text-sm text-slate-300 font-semibold">
                🔒 Registro seguro · Cancelas cuando quieras
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
