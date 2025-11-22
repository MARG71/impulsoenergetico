"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegistroFormulario() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const agenteIdParam = searchParams.get("agenteId");
  const lugarIdParam = searchParams.get("lugarId");
  const nombreParam = searchParams.get("nombre") || "";

  const [nombre, setNombre] = useState(nombreParam);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (nombreParam) setNombre(nombreParam);
  }, [nombreParam]);

  const buildQuery = () => {
    const p = new URLSearchParams();
    if (nombre) p.set("nombre", nombre);
    if (agenteIdParam) p.set("agenteId", agenteIdParam);
    if (lugarIdParam) p.set("lugarId", lugarIdParam);
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setOk(false);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          agenteId: agenteIdParam,
          lugarId: lugarIdParam,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "No se pudo registrar el lead");
      }

      // Guardar en localStorage para que BienvenidaContenido lo use
      try {
        localStorage.setItem("clienteNombre", nombre);
        localStorage.setItem("clienteEmail", email);
        localStorage.setItem("clienteTelefono", telefono);
        if (agenteIdParam) localStorage.setItem("agenteId", agenteIdParam);
        if (lugarIdParam) localStorage.setItem("lugarId", lugarIdParam);
        localStorage.setItem("leadOK", "1");
      } catch {
        // si falla localStorage no rompemos el flujo
      }

      setOk(true);

      // Redirigir a la pantalla de bienvenida con los mismos parámetros
      const qs = buildQuery();
      router.push(`/bienvenida${qs}`);
    } catch (err: any) {
      console.error("Error al registrar lead:", err);
      setError(
        err?.message ||
          "Ha ocurrido un error al registrar tus datos. Inténtalo de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-50">
      <div className="w-full max-w-lg rounded-3xl bg-slate-950/90 border border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.6)] p-6 md:p-8 space-y-6">
        <header className="space-y-2">
          <p className="text-[10px] md:text-xs font-semibold tracking-[0.28em] text-emerald-300 uppercase">
            IMPULSO ENERGÉTICO
          </p>
          <h1 className="text-xl md:text-2xl font-extrabold leading-snug">
            Regístrate para{" "}
            <span className="text-emerald-400">desbloquear tus ofertas</span> y
            recibir el estudio de ahorro.
          </h1>
          {(agenteIdParam || lugarIdParam) && (
            <p className="text-[11px] text-slate-400">
              QR detectado ·{" "}
              {agenteIdParam && (
                <>
                  Agente: <b>{agenteIdParam}</b>{" "}
                </>
              )}
              {lugarIdParam && (
                <>
                  · Lugar: <b>{lugarIdParam}</b>
                </>
              )}
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-200">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-200">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-200">
              Teléfono
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              required
            />
          </div>

          {error && <p className="text-xs text-red-300">{error}</p>}
          {ok && (
            <p className="text-xs text-emerald-300">
              Datos registrados correctamente. Te estamos redirigiendo…
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 w-full px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-slate-950 shadow shadow-emerald-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviando ? "Enviando..." : "Guardar mis datos y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
