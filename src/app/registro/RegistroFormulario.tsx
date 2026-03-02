"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const IMPULSO_LOGO = "/logo-impulso.png";

type ServicioKey =
  | "luz"
  | "gas"
  | "telefonia"
  | "seguros"
  | "otros"
  | "solar"
  | "hogar"
  | "viajes"
  | "repuestos"
  | "inmobiliaria";

function cx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}

function onlyPhoneChars(v: string) {
  return v.replace(/[^0-9+\s]/g, "");
}

export default function RegistroFormulario() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const agenteIdParam = searchParams.get("agenteId") || "";
  const lugarIdParam = searchParams.get("lugarId") || "";
  const qrParam = searchParams.get("qr") || "";
  const vParam = searchParams.get("v") || "";
  const lugarNombreParam = searchParams.get("lugarNombre") || "";
  const nombreParam = searchParams.get("nombre") || "";

  const [theme, setTheme] = useState<
    "default" | "verano" | "invierno" | "navidad" | "primavera"
  >("default");

  // ✅ Solo un campo: nombre completo
  const [nombre, setNombre] = useState(nombreParam);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [interes, setInteres] = useState<ServicioKey | "general">("general");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ Chatbot
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ from: "bot" | "user"; text: string }>
  >([{ from: "bot", text: "👋 ¡Hola! Soy tu asistente. ¿En qué puedo ayudarte?" }]);

  function addBot(text: string) {
    setMessages((m) => [...m, { from: "bot", text }]);
  }
  function addUser(text: string) {
    setMessages((m) => [...m, { from: "user", text }]);
  }
  function sendQuick(text: string) {
    addUser(text);
    setTimeout(() => {
      const responses: Record<string, string> = {
        "¿Cuánto puedo ahorrar?":
          "📊 La media está en torno a 340€/año (según perfil). Si te registras, te hacemos un estudio personalizado con ofertas reales.",
        "¿Es gratis registrarse?":
          "✅ Sí, es totalmente gratis. Sin compromiso y sin permanencia.",
        "¿Cómo funciona?":
          "1️⃣ Te registras → 2️⃣ Te preparamos tu estudio → 3️⃣ Te mostramos ofertas → 4️⃣ Te ayudamos con la gestión.",
        "Hablar con una persona":
          "👤 Perfecto. Regístrate y un asesor te contactará. Si ya estás registrado, dime tu servicio (luz/gas/telefonía/seguros) y tu provincia.",
      };
      addBot(responses[text] || "Genial 😊 ¿Qué te interesa: luz, gas, telefonía o seguros?");
    }, 450);
  }
  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    addUser(text);
    setChatInput("");
    setTimeout(() => {
      addBot(
        "¡Gracias! Si quieres, regístrate y te preparamos un estudio de ahorro con ofertas reales para ti."
      );
    }, 650);
  }

  useEffect(() => {
    if (nombreParam) setNombre(nombreParam);
  }, [nombreParam]);

  // Load saved theme
  useEffect(() => {
    try {
      const saved = (localStorage.getItem("impulso-theme") as any) || "default";
      if (
        saved === "verano" ||
        saved === "invierno" ||
        saved === "navidad" ||
        saved === "primavera" ||
        saved === "default"
      ) {
        setTheme(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Apply theme to <html data-theme="...">
  useEffect(() => {
    try {
      if (theme === "default") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", theme);
      }
      localStorage.setItem("impulso-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const accesoTexto = useMemo(() => {
    if (lugarNombreParam) return `Acceso detectado desde: ${lugarNombreParam}`;
    if (lugarIdParam) return "Acceso detectado desde un lugar autorizado";
    return "Acceso seguro · Registro en 30 segundos";
  }, [lugarNombreParam, lugarIdParam]);

  const utm = useMemo(() => {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    return {
      utm_source: params.get("utm_source") || "qr",
      utm_medium: params.get("utm_medium") || "social",
      utm_campaign: params.get("utm_campaign") || "landing_capture_v3",
    };
  }, []);

  const savingsLabel = useMemo(() => {
    return interes === "general" ? "340€" : "Hasta 400€";
  }, [interes]);

  const btnCfg = useMemo(() => {
    const base =
      "w-full rounded-2xl px-6 py-5 text-base sm:text-lg font-extrabold transition disabled:opacity-60 disabled:cursor-not-allowed " +
      "shadow-[0_20px_80px_rgba(0,0,0,0.22)]";

    const map: Record<string, { cls: string; text: string }> = {
      luz: {
        cls: "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_20px_80px_rgba(245,158,11,0.22)]",
        text: "Quiero ahorrar en LUZ →",
      },
      gas: {
        cls: "bg-red-500 hover:bg-red-400 text-slate-950 shadow-[0_20px_80px_rgba(239,68,68,0.18)]",
        text: "Quiero ahorrar en GAS →",
      },
      telefonia: {
        cls: "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_20px_80px_rgba(59,130,246,0.18)]",
        text: "Mejorar mi TELEFONÍA →",
      },
      seguros: {
        cls: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_20px_80px_rgba(16,185,129,0.20)]",
        text: "Cotizar SEGUROS →",
      },
      otros: {
        cls: "bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 shadow-[0_20px_80px_rgba(168,85,247,0.16)]",
        text: "Ver más OFERTAS →",
      },
      solar: {
        cls: "bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-[0_20px_80px_rgba(251,191,36,0.18)]",
        text: "Quiero info de SOLAR →",
      },
      hogar: { cls: "bg-teal-500 hover:bg-teal-400 text-slate-950", text: "Servicios para el HOGAR →" },
      viajes: { cls: "bg-cyan-500 hover:bg-cyan-400 text-slate-950", text: "Ver VIAJES →" },
      repuestos: { cls: "bg-orange-500 hover:bg-orange-400 text-slate-950", text: "Ver REPUESTOS →" },
      inmobiliaria: { cls: "bg-violet-500 hover:bg-violet-400 text-slate-950", text: "Ver INMOBILIARIA →" },
      general: {
        cls: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_20px_80px_rgba(16,185,129,0.22)]",
        text: "Registrarme Gratis →",
      },
    };

    const key = interes === "general" ? "general" : interes;
    return { className: cx(base, map[key]?.cls), text: map[key]?.text || map.general.text };
  }, [interes]);

  const testimonials = useMemo(
    () => [
      {
        initials: "MC",
        name: "María C.",
        city: "Toledo",
        text: "Antes pagaba 94€ de luz, ahora 56€. Me lo explicaron todo y en 48h ya tenía tarifa nueva.",
        tag: "Ahorro: 456€/año",
      },
      {
        initials: "AL",
        name: "Antonio L.",
        city: "Madrid",
        text: "Contraté luz y gas. Ahorro mensual real y sin complicaciones. Atención 10.",
        tag: "Ahorro: 456€/año",
      },
      {
        initials: "CR",
        name: "Carmen R.",
        city: "Ávila",
        text: "Portabilidad de internet rapidísima. Mejor velocidad y mismo precio. Muy profesionales.",
        tag: "Mejora: +300 Mbps",
      },
      {
        initials: "JG",
        name: "Javier G.",
        city: "Cáceres",
        text: "Seguro de hogar con buena cobertura y precio competitivo. Comparar opciones ayuda muchísimo.",
        tag: "Ahorro: 120€/año",
      },
    ],
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setOk(false);

    try {
      const agenteLs =
        typeof window !== "undefined" ? localStorage.getItem("agenteId") : null;
      const lugarLs =
        typeof window !== "undefined" ? localStorage.getItem("lugarId") : null;

      const agenteToSend = agenteIdParam || agenteLs || null;
      const lugarToSend = lugarIdParam || lugarLs || null;

      const nombreCompleto = String(nombre || "").trim();

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreCompleto || nombre,
          email,
          telefono,
          interes: interes === "general" ? null : interes,
          utm,
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

      const nombreFinal: string = lead.nombre || (nombreCompleto || nombre);

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

      try {
        if (nombreFinal) localStorage.setItem("clienteNombre", nombreFinal);
        if (email) localStorage.setItem("clienteEmail", email);
        if (telefono) localStorage.setItem("clienteTelefono", telefono);
        if (agenteFinal) localStorage.setItem("agenteId", String(agenteFinal));
        if (lugarFinal) localStorage.setItem("lugarId", String(lugarFinal));
        if (qrParam) localStorage.setItem("qr", qrParam);
        if (vParam) localStorage.setItem("v", vParam);
        if (interes && interes !== "general")
          localStorage.setItem("clienteInteres", interes);
        localStorage.setItem("leadOK", "1");
      } catch {
        // ignore
      }

      // ✅ Redirigir
      const params = new URLSearchParams();
      if (nombreFinal) params.set("nombre", nombreFinal);
      if (lugarFinal) params.set("lugarId", String(lugarFinal));
      if (agenteFinal) params.set("agenteId", String(agenteFinal));
      if (qrParam) params.set("qr", qrParam);
      if (vParam) params.set("v", vParam);
      if (interes && interes !== "general") params.set("interes", interes);

      setOk(true);
      setShowSuccess(true);

      // Pausa para que se vea el modal
      setTimeout(() => {
        router.push(`/bienvenida?${params.toString()}`);
      }, esNuevoLead ? 900 : 600);
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
    <div className="min-h-screen text-slate-50">
      {/* ====== Variables + themes (como tu HTML) ====== */}
      <style jsx global>{`
        :root {
          --primary: #00d4aa;
          --secondary: #1e3a5f;
          --base: #071a24; /* ✅ NO negro */
          --base2: #0b2430;
          --panel: rgba(255, 255, 255, 0.07);
          --panel2: rgba(255, 255, 255, 0.11);
          --border: rgba(255, 255, 255, 0.12);
          --border2: rgba(255, 255, 255, 0.2);
        }
        [data-theme="verano"] {
          --primary: #f59e0b;
        }
        [data-theme="invierno"] {
          --primary: #3b82f6;
        }
        [data-theme="navidad"] {
          --primary: #ef4444;
        }
        [data-theme="primavera"] {
          --primary: #10b981;
        }
      `}</style>

      {/* Fondo corporativo (azul/verde) */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "var(--base)" }} />
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background:
              "radial-gradient(ellipse_at_top, rgba(0,212,170,0.18), transparent 55%), radial-gradient(ellipse_at_bottom, rgba(14,165,233,0.12), transparent 62%), radial-gradient(ellipse_at_left, rgba(34,197,94,0.10), transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />
      </div>

      {/* Header fijo (logo IMPULSO, NO “PRO”) */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image
              src={IMPULSO_LOGO}
              alt="Impulso Energético"
              width={120}
              height={120}
              priority
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
            />
            <div className="leading-tight">
              <div className="text-sm sm:text-base font-black tracking-[0.18em] text-emerald-200">
                IMPULSO ENERGÉTICO
              </div>
              <div className="text-xs font-semibold text-slate-300">
                Acceso a ofertas y estudio de ahorro
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="text-xs font-extrabold text-slate-100 rounded-full px-4 py-2 border border-white/10 bg-white/5">
              ✅ Seguro • RGPD
            </div>

            <div className="flex items-center gap-2">
              {(["verano", "invierno", "navidad", "primavera"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={cx(
                    "h-6 w-6 rounded-full border border-white/15 transition",
                    theme === t && "ring-2 ring-white/60"
                  )}
                  style={{
                    background:
                      t === "verano"
                        ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                        : t === "invierno"
                        ? "linear-gradient(135deg,#3b82f6,#06b6d4)"
                        : t === "navidad"
                        ? "linear-gradient(135deg,#ef4444,#10b981)"
                        : "linear-gradient(135deg,#10b981,#fbbf24)",
                  }}
                  aria-label={`Tema ${t}`}
                  title={`Tema ${t}`}
                />
              ))}
              <button
                type="button"
                onClick={() => setTheme("default")}
                className={cx(
                  "text-xs font-extrabold px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition",
                  theme === "default" && "ring-2 ring-white/40"
                )}
                title="Tema por defecto"
              >
                Default
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO + Servicios (ancho PRO en PC) */}
      <section className="mx-auto max-w-[1400px] px-4 pt-8 pb-6">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-extrabold text-sm text-slate-950"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, #1e3a5f 100%)",
              }}
            >
              🎁 Oferta exclusiva por QR / enlace
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl xl:text-5xl font-extrabold leading-[1.05]">
              Ahorra hasta{" "}
              <span style={{ color: "var(--primary)" }}>400€/año</span> en
              energía y servicios esenciales
            </h1>

            <p className="mt-3 text-slate-200/90 font-semibold text-base sm:text-lg max-w-[56ch]">
              Registro en 30 segundos, sin compromiso. Accede a ofertas reales y
              te preparamos tu estudio de ahorro.
            </p>

            <div className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 inline-flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <div className="text-2xl font-extrabold text-emerald-200">
                  {savingsLabel}
                </div>
                <div className="text-sm font-bold text-slate-200/80">
                  ahorro medio anual (según perfil)
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/6 p-4">
              <div className="text-base sm:text-lg font-extrabold">
                ✅ {accesoTexto}
              </div>
              <div className="mt-1 text-sm sm:text-base text-slate-200/80 font-semibold">
                Tus datos se usan solo para darte el estudio y las ofertas. Sin
                spam.
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/7 backdrop-blur-xl p-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-10 rounded-full bg-emerald-400/15 blur-3xl" />
                <Image
                  src={IMPULSO_LOGO}
                  alt="Impulso Energético"
                  width={120}
                  height={120}
                  priority
                  className="relative h-[76px] w-[76px] object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black tracking-[0.35em] text-emerald-200 uppercase">
                  impulso energético
                </div>
                <div className="mt-1 text-lg font-extrabold">
                  Todo en una plataforma
                </div>
                <div className="text-sm text-slate-200/80 font-semibold">
                  Selecciona tu servicio y te llevamos al registro
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  k: "luz",
                  label: "LUZ",
                  sub: "Comparador inteligente",
                  emoji: "💡",
                  cls: "bg-amber-400/14 border-amber-300/25 hover:bg-amber-400/18",
                },
                {
                  k: "gas",
                  label: "GAS",
                  sub: "Tarifas optimizadas",
                  emoji: "🔥",
                  cls: "bg-red-500/14 border-red-300/25 hover:bg-red-500/18",
                },
                {
                  k: "telefonia",
                  label: "TELEFONÍA",
                  sub: "Fibra + móvil",
                  emoji: "📶",
                  cls: "bg-sky-500/14 border-sky-300/25 hover:bg-sky-500/18",
                },
                {
                  k: "seguros",
                  label: "SEGUROS",
                  sub: "Protección total",
                  emoji: "🛡️",
                  cls: "bg-emerald-500/14 border-emerald-300/25 hover:bg-emerald-500/18",
                },
                {
                  k: "solar",
                  label: "SOLAR",
                  sub: "Autoconsumo + IA",
                  emoji: "☀️",
                  cls: "bg-yellow-400/14 border-yellow-300/25 hover:bg-yellow-400/18",
                },
                {
                  k: "otros",
                  label: "OTROS",
                  sub: "Más servicios",
                  emoji: "⭐",
                  cls: "bg-fuchsia-500/14 border-fuchsia-300/25 hover:bg-fuchsia-500/18",
                },
              ].map((s) => {
                const active = interes === s.k;
                return (
                  <button
                    key={s.k}
                    type="button"
                    onClick={() => setInteres(s.k as ServicioKey)}
                    className={cx(
                      "text-left rounded-2xl border p-4 transition",
                      s.cls,
                      active
                        ? "ring-2 ring-white/55 scale-[0.99]"
                        : "hover:-translate-y-0.5"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-extrabold">{s.label}</div>
                      <div className="text-xl">{s.emoji}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-200/80 font-semibold">
                      {s.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("registro");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-5 py-4 font-extrabold"
              >
                Ir al registro ↓
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios (ancho PRO en PC) */}
      <section className="mx-auto max-w-[1400px] px-4 pb-6">
        <div className="rounded-[26px] border border-white/10 bg-white/7 backdrop-blur-xl p-5">
          <div className="text-xl font-extrabold">
            Lo que dicen{" "}
            <span style={{ color: "var(--primary)" }}>nuestros clientes</span>
          </div>
          <div className="mt-1 text-sm text-slate-200/80 font-semibold">
            Clientes reales (Toledo, Madrid, Ávila, Cáceres…)
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="min-w-[290px] sm:min-w-[360px] rounded-2xl border border-white/10 bg-white/5 p-4 hover:-translate-y-0.5 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center font-extrabold text-slate-950"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--primary) 0%, #1e3a5f 100%)",
                    }}
                  >
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold">{t.name}</div>
                    <div className="text-xs text-slate-200/80 font-semibold">
                      📍 {t.city}
                    </div>
                  </div>
                  <div className="ml-auto text-amber-300 font-extrabold text-sm">
                    ★★★★★
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-200/80 font-semibold italic">
                  “{t.text}”
                </p>

                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 px-3 py-2 text-emerald-200 font-extrabold text-xs">
                  ✅ {t.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM (más ancho en PC) */}
      <section id="registro" className="mx-auto max-w-[1100px] px-4 pb-14">
        <div className="rounded-[30px] border border-white/10 bg-white/7 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="px-6 sm:px-10 pt-8 pb-6">
            <div className="text-xs font-black tracking-[0.35em] text-emerald-200 uppercase">
              registro
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold leading-[1.08]">
              🎁 Crea tu cuenta gratis y{" "}
              <span style={{ color: "var(--primary)" }}>desbloquea ofertas</span>
            </h2>
            <p className="mt-2 text-slate-200/80 font-semibold">
              Te preparamos tu estudio personalizado y te mostramos opciones reales según tu perfil.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 sm:px-10 pb-10">
            <div className="grid gap-4">
              {/* ✅ SOLO Nombre completo */}
              <div className="space-y-1">
                <label className="block text-sm sm:text-base font-extrabold text-slate-200">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre y apellidos"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-4 text-base sm:text-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm sm:text-base font-extrabold text-slate-200">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-4 text-base sm:text-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm sm:text-base font-extrabold text-slate-200">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(onlyPhoneChars(e.target.value))}
                  placeholder="+34 600 000 000"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-4 text-base sm:text-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                  required
                  inputMode="tel"
                />
                <p className="text-xs text-slate-200/70 font-semibold mt-1">
                  Solo lo usaremos para ayudarte con el estudio y ofertas (sin spam).
                </p>
              </div>

              {/* Interés (fondo con color, NO negro/gris) */}
              <div className="mt-1 rounded-2xl border border-white/10 bg-white/6 p-4">
                <div className="font-extrabold text-slate-100">
                  ¿Qué servicio te interesa más?
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { k: "luz", label: "LUZ", cls: "border-amber-300/25 bg-amber-400/10 hover:bg-amber-400/15" },
                    { k: "gas", label: "GAS", cls: "border-red-300/25 bg-red-500/10 hover:bg-red-500/15" },
                    { k: "telefonia", label: "TELÉFONO", cls: "border-sky-300/25 bg-sky-500/10 hover:bg-sky-500/15" },
                    { k: "seguros", label: "SEGUROS", cls: "border-emerald-300/25 bg-emerald-500/10 hover:bg-emerald-500/15" },
                    { k: "otros", label: "OTROS", cls: "border-fuchsia-300/25 bg-fuchsia-500/10 hover:bg-fuchsia-500/15" },
                  ].map((x) => {
                    const active = interes === x.k;
                    return (
                      <button
                        key={x.k}
                        type="button"
                        onClick={() => setInteres(x.k as ServicioKey)}
                        className={cx(
                          "rounded-xl border px-3 py-3 text-xs sm:text-sm font-extrabold transition",
                          x.cls,
                          active ? "ring-2 ring-white/55" : ""
                        )}
                      >
                        {x.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legal (NO negro/gris) */}
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 cursor-pointer">
                <input type="checkbox" required className="mt-1 h-5 w-5 accent-emerald-400" />
                <span className="text-xs sm:text-sm text-slate-200/80 font-semibold leading-relaxed">
                  Acepto la Política de Privacidad y el Aviso Legal. Consiento el tratamiento de mis datos para recibir ofertas personalizadas.
                </span>
              </label>

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

              <button type="submit" disabled={cargando} className={btnCfg.className}>
                {cargando ? "Procesando..." : btnCfg.text}
              </button>

              <p className="text-center text-xs sm:text-sm text-slate-200/80 font-semibold">
                🔒 Registro seguro · Cancelas cuando quieras
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* Chatbot floating button */}
      <button
        type="button"
        onClick={() => {
          setChatOpen((v) => !v);
          if (!chatOpen) {
            setTimeout(
              () => addBot("¿Te gustaría saber cuánto podrías ahorrar? 💡"),
              350
            );
          }
        }}
        className="fixed bottom-6 right-6 z-[120] h-14 w-14 rounded-full font-extrabold text-slate-950 shadow-[0_0_60px_rgba(0,212,170,0.35)] hover:scale-[1.05] transition"
        style={{
          background: "linear-gradient(135deg, var(--primary) 0%, #1e3a5f 100%)",
        }}
        aria-label="Abrir chat"
        title="Asistente Impulso"
      >
        💬
      </button>

      {/* Chat window */}
      <div
        className={cx(
          "fixed bottom-24 right-6 z-[120] w-[360px] max-w-[calc(100vw-2rem)] rounded-[26px] border border-white/15 overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.40)] transition",
          chatOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none"
        )}
        style={{ background: "linear-gradient(145deg, #0c2a33, #0a1624)" }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between text-slate-950 font-extrabold"
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, #1e3a5f 100%)",
          }}
        >
          <span>🤖 Asistente IMPULSO</span>
          <button
            type="button"
            onClick={() => setChatOpen(false)}
            className="text-xl font-black"
            aria-label="Cerrar chat"
          >
            ×
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cx(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm font-semibold leading-relaxed",
                m.from === "bot"
                  ? "bg-white/5 border border-white/10 text-slate-100"
                  : "ml-auto text-slate-950"
              )}
              style={
                m.from === "user"
                  ? {
                      background:
                        "linear-gradient(135deg, var(--primary) 0%, #1e3a5f 100%)",
                    }
                  : {}
              }
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              "¿Cuánto puedo ahorrar?",
              "¿Es gratis registrarse?",
              "¿Cómo funciona?",
              "Hablar con una persona",
            ].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => sendQuick(t)}
                className="px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-extrabold text-slate-100 transition"
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChat();
              }}
              placeholder="Escribe tu pregunta…"
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
            />
            <button
              type="button"
              onClick={sendChat}
              className="rounded-2xl px-4 py-3 font-extrabold text-slate-950"
              style={{ background: "var(--primary)" }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* Success modal */}
      <div
        className={cx(
          "fixed inset-0 z-[100] flex items-center justify-center p-4 transition",
          showSuccess
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        style={{ background: "rgba(7,26,36,0.92)" }}
      >
        <div className="w-full max-w-[420px] rounded-[28px] border border-white/15 bg-[#0b2430] p-7 text-center shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="mx-auto h-16 w-16 rounded-full border-2 border-emerald-400/70 bg-emerald-400/10 flex items-center justify-center text-2xl">
            ✅
          </div>
          <h3 className="mt-4 text-2xl font-extrabold">
            ¡Registro completado! 🎉
          </h3>
          <p className="mt-2 text-slate-200/80 font-semibold">
            En breve tendrás tu acceso a ofertas y tu estudio personalizado.
          </p>

          <button
            type="button"
            onClick={() => setShowSuccess(false)}
            className="mt-5 w-full rounded-2xl px-5 py-4 font-extrabold text-slate-950"
            style={{
              background:
                "linear-gradient(135deg, var(--primary) 0%, #1e3a5f 100%)",
            }}
          >
            Continuar →
          </button>

          <p className="mt-3 text-xs text-slate-200/60 font-semibold">
            Redirigiendo automáticamente…
          </p>
        </div>
      </div>
    </div>
  );
}