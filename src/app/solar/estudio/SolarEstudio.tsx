// src/app/solar/estudio/SolarEstudio.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SolarHeader from "../_shared/SolarHeader";
import SolarFooter from "../_shared/SolarFooter";

type Estado = "idle" | "loading" | "ok" | "error";

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-3">
      <span className="text-lg font-extrabold text-white/90">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
        className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 text-lg text-white outline-none placeholder:text-white/40 focus:border-emerald-300/60"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-3">
      <span className="text-lg font-extrabold text-white/90">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 text-lg text-white outline-none focus:border-emerald-300/60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#070A16]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SolarEstudio() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensaje, setMensaje] = useState<string>("");

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cp, setCp] = useState("");
  const [tipo, setTipo] = useState("vivienda");
  const [interes, setInteres] = useState("fotovoltaica");

  const year = useMemo(() => new Date().getFullYear(), []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("loading");
    setMensaje("");

    try {
      // Guarda en /api/leads si existe (tu CRM ya lo tenía en otras partes)
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          codigoPostal: cp,
          servicio: "SOLAR",
          tipoInstalacion: tipo,
          productoInteres: interes,
          origen: "solar/estudio",
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "No se pudo enviar");
      }

      setEstado("ok");
      setMensaje(
        "¡Perfecto! Hemos recibido tu solicitud. Te contactaremos lo antes posible."
      );
      setNombre("");
      setEmail("");
      setTelefono("");
      setCp("");
      setTipo("vivienda");
      setInteres("fotovoltaica");
    } catch (err) {
      setEstado("error");
      setMensaje(
        "No hemos podido enviar el formulario automáticamente. Escríbenos a info@impulsoenergetico.es y te lo gestionamos al momento."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#070A16] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_10%,rgba(16,185,129,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(800px_450px_at_80%_20%,rgba(34,211,238,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A16] via-[#070A16] to-[#050712]" />
      </div>

      <SolarHeader />

      <section className="px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-2 items-start">
          <div>
            <div className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-400/10 px-5 py-2 text-base font-extrabold text-emerald-100">
              ESTUDIO GRATUITO
            </div>

            <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.02]">
              Solicita tu estudio en 3 minutos
            </h1>

            <p className="mt-6 text-xl text-white/75 leading-8">
              Te diremos cuánto puedes ahorrar, qué kit encaja contigo y opciones de financiación.
              Sin compromiso y con asesoramiento real.
            </p>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-lg text-white/80">
                ✅ Respuesta rápida · ✅ Estudio orientativo · ✅ Trámites incluidos
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/solar"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-base font-bold text-white/80 hover:bg-white/10"
                >
                  Volver a la landing
                </Link>
                <Link
                  href="/solar/faq"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-transparent px-6 py-3 text-base font-bold text-emerald-100 hover:bg-emerald-300/10"
                >
                  Ver FAQ
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-7 sm:p-8">
            <h2 className="text-2xl font-extrabold">Datos de contacto</h2>
            <p className="mt-2 text-lg text-white/70 leading-7">
              Completa el formulario y te llamamos para preparar el estudio.
            </p>

            <form onSubmit={enviar} className="mt-7 grid gap-6">
              <Input
                label="Nombre y apellidos"
                value={nombre}
                onChange={setNombre}
                placeholder="Tu nombre"
              />
              <Input
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="tuemail@dominio.com"
              />
              <Input
                label="Teléfono"
                value={telefono}
                onChange={setTelefono}
                placeholder="600 000 000"
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <Input
                  label="Código Postal"
                  value={cp}
                  onChange={setCp}
                  placeholder="31001"
                />
                <Select
                  label="Tipo de instalación"
                  value={tipo}
                  onChange={setTipo}
                  options={[
                    { value: "vivienda", label: "Vivienda unifamiliar" },
                    { value: "comunidad", label: "Comunidad de vecinos" },
                    { value: "empresa", label: "Empresa / Nave" },
                  ]}
                />
              </div>

              <Select
                label="¿Qué te interesa?"
                value={interes}
                onChange={setInteres}
                options={[
                  { value: "fotovoltaica", label: "Fotovoltaica" },
                  { value: "baterias", label: "Baterías" },
                  { value: "cargador", label: "Cargador VE" },
                  { value: "kit", label: "Kit completo" },
                ]}
              />

              <button
                type="submit"
                disabled={estado === "loading"}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-400 px-7 py-4 text-lg font-extrabold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
              >
                {estado === "loading" ? "Enviando..." : "Solicitar Estudio Gratis"}
              </button>

              {mensaje ? (
                <div
                  className={[
                    "rounded-2xl border p-5 text-base font-bold",
                    estado === "ok"
                      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                      : "border-red-300/30 bg-red-500/10 text-red-100",
                  ].join(" ")}
                >
                  {mensaje}
                </div>
              ) : null}

              <div className="text-sm text-white/50 leading-6">
                Al enviar aceptas que te contactemos para el estudio. Email: info@impulsoenergetico.es
              </div>
            </form>
          </div>
        </div>
      </section>

      <SolarFooter />

      <div className="py-6 text-center text-xs text-white/40">
        © {year} Impulso Energético
      </div>
    </div>
  );
}
