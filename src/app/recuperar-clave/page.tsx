// src/app/recuperar-clave/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecuperarClavePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo procesar la solicitud");
      }

      setMensaje(
        data?.message ||
          "Si el email existe en nuestra base de datos, recibirás un correo con tu nueva contraseña."
      );
    } catch (err: any) {
      console.error("[recuperar-clave] error:", err);
      setError(
        err?.message ||
          "Ha ocurrido un error al solicitar el cambio de contraseña."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 text-slate-50">
      <div className="w-full max-w-md rounded-3xl bg-slate-950/90 border border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.6)] p-6 md:p-8 space-y-6">
        <header className="space-y-2">
          <p className="text-[10px] md:text-xs font-semibold tracking-[0.28em] text-emerald-300 uppercase">
            IMPULSO ENERGÉTICO
          </p>
          <h1 className="text-xl md:text-2xl font-extrabold leading-snug">
            Recupera tu contraseña
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Introduce el email con el que te registraste y te enviaremos una
            nueva contraseña provisional.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-200">
              Email de acceso
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              required
            />
          </div>

          {error && <p className="text-xs text-red-300">{error}</p>}
          {mensaje && <p className="text-xs text-emerald-300">{mensaje}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full mt-2 px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-slate-950 shadow shadow-emerald-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviando ? "Enviando..." : "Enviar nueva contraseña"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full text-center text-xs text-slate-300 hover:text-emerald-300 mt-2"
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}
