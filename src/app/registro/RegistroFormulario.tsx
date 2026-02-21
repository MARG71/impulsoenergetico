"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

const IMPULSO_LOGO = "/logo-impulso-definitivo.png";

// ✅ AJUSTA si tu home pública es /home
const HOME_PUBLIC_PATH = "/";

type Estado = "idle" | "loading" | "ok" | "error";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

export default function RegistroFormulario() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const agenteIdParam = searchParams.get("agenteId");
  const lugarIdParam = searchParams.get("lugarId");
  const qrParam = searchParams.get("qr");
  const vParam = searchParams.get("v");
  const nombreParam = searchParams.get("nombre") || "";

  const [nombre, setNombre] = useState(nombreParam);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (nombreParam) setNombre(nombreParam);
  }, [nombreParam]);

  const qsBase = useMemo(() => {
    const p = new URLSearchParams();
    if (agenteIdParam) p.set("agenteId", agenteIdParam);
    if (lugarIdParam) p.set("lugarId", lugarIdParam);
    if (qrParam) p.set("qr", qrParam);
    if (vParam) p.set("v", vParam);
    return p;
  }, [agenteIdParam, lugarIdParam, qrParam, vParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("loading");
    setError(null);

    try {
      // ✅ fallback localStorage (lo que querías)
      const agenteLs =
        typeof window !== "undefined" ? localStorage.getItem("agenteId") : null;
      const lugarLs =
        typeof window !== "undefined" ? localStorage.getItem("lugarId") : null;

      const agenteToSend = agenteIdParam || agenteLs;
      const lugarToSend = lugarIdParam || lugarLs;

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          agenteId: agenteToSend,
          lugarId: lugarToSend,
        }),
      });

      if (!res.ok) {
        const dataErr = await res.json().catch(() => ({}));
        throw new Error(dataErr?.error || "Error al registrar tus datos");
      }

      const data = await res.json().catch(() => ({}));
      const lead = data?.lead || {};
      const esNuevoLead = !!data?.nuevoLead;

      const nombreFinal: string = lead.nombre || nombre;

      const agenteFinal =
        typeof lead.agenteId === "number"
          ? lead.agenteId
          : agenteToSend
          ? Number(agenteToSend)
          : undefined;

      const lugarFinal =
        typeof lead.lugarId === "number"
          ? lead.lugarId
          : lugarToSend
          ? Number(lugarToSend)
          : undefined;

      // ✅ Guardamos para futuras visitas
      try {
        if (nombreFinal) localStorage.setItem("clienteNombre", nombreFinal);
        if (email) localStorage.setItem("clienteEmail", email);
        if (telefono) localStorage.setItem("clienteTelefono", telefono);
        if (agenteFinal) localStorage.setItem("agenteId", String(agenteFinal));
        if (lugarFinal) localStorage.setItem("lugarId", String(lugarFinal));
        localStorage.setItem("leadOK", "1");
      } catch {
        // ignore
      }

      if (!esNuevoLead) {
        alert(
          "Este email ya estaba registrado. Te llevamos a las ofertas igualmente."
        );
      }

      // ✅ Redirigir directo a HOME (pantallazo 5) con QS
      const p = new URLSearchParams(qsBase.toString());
      if (nombreFinal) p.set("nombre", nombreFinal);
      if (agenteFinal) p.set("agenteId", String(agenteFinal));
      if (lugarFinal) p.set("lugarId", String(lugarFinal));

      setEstado("ok");
      router.push(`${HOME_PUBLIC_PATH}?${p.toString()}`);
    } catch (err: any) {
      console.error(err);
      setEstado("error");
      setError(
        err?.message ||
          "Ha ocurrido un error al registrar tus datos. Inténtalo de nuevo."
      );
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Fondo ULTRA */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.22),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.18),transparent_55%)]" />
        <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_25px_120px_rgba(0,0,0,0.55)] p-6 md:p-8">
          {/* Header con logo grande */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-emerald-400/20 blur-2xl" />
              <Image
                src={IMPULSO_LOGO}
                alt="Impulso Energético"
                width={92}
                height={92}
                priority
                className="relative rounded-2xl"
              />
            </div>

            <div className="min-w-0">
              <div className="text-[11px] md:text-xs font-extrabold tracking-[0.32em] uppercase text-emerald-300">
                IMPULSO ENERGÉTICO
              </div>
              <h1 className="mt-1 text-2xl md:text-3xl font-extrabold leading-snug">
                Regístrate para{" "}
                <span className="text-emerald-300 drop-shadow-[0_0_18px_rgba(16,185,129,0.35)]">
                  desbloquear tus ofertas
                </span>{" "}
                y recibir el estudio de ahorro.
              </h1>
            </div>
          </div>

          {/* QR detectado */}
          {(agenteIdParam || lugarIdParam) && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-extrabold text-slate-100">
                ✅ Acceso detectado
              </div>
              <div className="mt-1 text-sm text-slate-200 font-semibold">
                {agenteIdParam ? (
                  <>
                    Agente: <b className="text-white">{agenteIdParam}</b>{" "}
                  </>
                ) : null}
                {lugarIdParam ? (
                  <>
                    · Lugar: <b className="text-white">{lugarIdParam}</b>
                  </>
                ) : null}
              </div>
              <div className="mt-2 text-xs text-slate-300 font-semibold">
                Tus datos quedan asociados para atención prioritaria.
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-100">
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-2xl bg-slate-950/40 border border-white/10 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                required
                placeholder="Ej: Miguel Ángel Reyes"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-100">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-slate-950/40 border border-white/10 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                required
                placeholder="tuemail@gmail.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-100">
                Teléfono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full rounded-2xl bg-slate-950/40 border border-white/10 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                required
                placeholder="600 000 000"
              />
            </div>

            {estado === "error" && error ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 font-extrabold text-sm">
                {error}
              </div>
            ) : null}

            {estado === "ok" ? (
              <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-emerald-200 font-extrabold text-sm">
                ✅ Datos registrados. Te estamos llevando a las ofertas…
              </div>
            ) : null}

            <button
              type="submit"
              disabled={estado === "loading"}
              className={cx(
                "mt-2 w-full rounded-2xl",
                "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
                "font-extrabold px-6 py-4 text-lg",
                "shadow-2xl transition active:scale-[0.99]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "hover:shadow-[0_0_0_10px_rgba(16,185,129,0.18)]",
                estado === "loading" && "animate-pulse"
              )}
            >
              {estado === "loading" ? "Guardando..." : "Guardar mis datos y ver ofertas 👇"}
            </button>

            <div className="pt-2 text-xs text-slate-300 font-semibold text-center">
              🔒 Tus datos se usan solo para darte el estudio y ofertas. Sin spam.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
