"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SolarHeader from "./_shared/SolarHeader";
import SolarFooter from "./_shared/SolarFooter";
import SolarHeroImage from "./_shared/SolarHeroImage";
import { useBuildQuery } from "./_shared/useBuildQuery";

export default function SolarLanding() {
  const router = useRouter();
  const { nombre, agenteId, lugarId, buildQuery } = useBuildQuery();

  // Mini-calculadora (orientativa)
  const [gasto, setGasto] = useState<string>("80");
  const [tipo, setTipo] = useState<"vivienda" | "empresa">("vivienda");
  const [provincia, setProvincia] = useState<string>("");

  const ahorroEstimado = useMemo(() => {
    const g = Number(String(gasto).replace(",", "."));
    if (!isFinite(g) || g <= 0) return null;

    const factor = tipo === "vivienda" ? 0.45 : 0.35;
    const anual = g * 12;
    const ahorro = anual * factor;

    const min = Math.round(ahorro * 0.88);
    const max = Math.round(ahorro * 1.12);

    return { min, max };
  }, [gasto, tipo]);

  const go = (path: string, extra?: Record<string, string>) => {
    router.push(`${path}${buildQuery(extra)}`);
  };

  return (
    <div className="min-h-screen text-slate-50 bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(900px_circle_at_90%_10%,rgba(251,191,36,0.12),transparent_55%),linear-gradient(to_bottom,#020617,#0b1220,#020617)]">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 md:py-10">
        <SolarHeader />

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[32px] border border-emerald-400/35 bg-gradient-to-br from-emerald-500/20 via-slate-950/65 to-slate-950 p-6 md:p-10 shadow-[0_0_60px_rgba(16,185,129,0.35)] mb-10">
          <span className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <span className="pointer-events-none absolute -left-28 bottom-0 h-56 w-56 rounded-full bg-amber-300/15 blur-3xl" />
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_30%_30%,rgba(59,130,246,0.10),transparent_60%)]" />

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr),minmax(0,1fr)] items-start relative z-10">
            {/* Texto */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.8)]" />
                <span className="text-xs md:text-sm font-bold tracking-[0.22em] uppercase text-emerald-200">
                  SOLAR IMPULSO · AUTOCONSUMO FOTOVOLTAICO
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05]">
                {nombre ? (
                  <>
                    Hola,{" "}
                    <span className="text-emerald-300">{nombre}</span>.{" "}
                  </>
                ) : null}
                Ahorra en tu factura con una instalación{" "}
                <span className="text-amber-300">a medida</span>.
              </h1>

              <p className="text-base md:text-lg lg:text-xl text-slate-100/95 leading-relaxed max-w-3xl font-semibold">
                Te hacemos un <span className="text-emerald-200 font-black">estudio gratuito</span> con estimación de ahorro,
                dimensionado y opciones (batería, coche eléctrico o aerotermia). Sin compromiso y con acompañamiento en trámites.
              </p>

              {(agenteId || lugarId) && (
                <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-300/20 bg-slate-950/40 px-4 py-2">
                  <span className="text-sm md:text-base font-bold text-emerald-100/90">
                    QR detectado
                  </span>
                  {agenteId && (
                    <span className="text-sm md:text-base text-slate-200">
                      · Agente: <b className="text-emerald-300">{agenteId}</b>
                    </span>
                  )}
                  {lugarId && (
                    <span className="text-sm md:text-base text-slate-200">
                      · Lugar: <b className="text-emerald-300">{lugarId}</b>
                    </span>
                  )}
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => go("/solar/estudio")}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm md:text-base font-black text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.40)] hover:bg-emerald-300"
                >
                  Quiero mi estudio gratuito (2 min) →
                </button>

                <button
                  onClick={() => go("/solar/tienda")}
                  className="inline-flex items-center justify-center rounded-full border border-amber-300/60 bg-amber-300/10 px-6 py-3 text-sm md:text-base font-black text-amber-100 hover:bg-amber-300/15"
                >
                  Ver tienda solar
                </button>

                <button
                  onClick={() => go("/comparador", { tipo: "luz" })}
                  className="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-950/40 px-6 py-3 text-sm md:text-base font-bold text-slate-100 hover:bg-slate-900/60"
                >
                  Estimar ahorro en mi luz
                </button>
              </div>

              {/* Chips confianza: MÁS GRANDES */}
              <div className="grid gap-3 sm:grid-cols-3 pt-4">
                <TrustChip title="✅ Estudio sin compromiso" subtitle="Respuesta rápida" tone="emerald" />
                <TrustChip title="🧩 Diseño a medida" subtitle="Consumo y tejado" tone="blue" />
                <TrustChip title="🛠️ Instalación profesional" subtitle="Acompañamiento" tone="amber" />
              </div>
            </div>

            {/* Derecha */}
            <div className="space-y-4">
              <SolarHeroImage src="/solar/hero.jpg" alt="Instalación solar profesional" priority />

              <div className="rounded-[28px] border border-slate-600 bg-gradient-to-br from-slate-950/70 via-slate-950/55 to-slate-900/60 p-6 shadow-[0_0_35px_rgba(59,130,246,0.12)]">
                <p className="text-lg font-black text-emerald-200">
                  Te llamamos para tu estudio
                </p>
                <p className="text-sm md:text-base text-slate-200 mt-1 font-semibold">
                  Te llevamos al formulario (2 minutos). Sin compromiso.
                </p>

                <div className="mt-4 grid gap-3">
                  <button
                    onClick={() => go("/solar/estudio")}
                    className="rounded-full bg-emerald-400 px-5 py-3 text-sm md:text-base font-black text-slate-950 hover:bg-emerald-300"
                  >
                    Empezar estudio ahora →
                  </button>

                  <button
                    onClick={() => go("/solar/subvenciones")}
                    className="rounded-full border border-amber-300/60 bg-amber-300/10 px-5 py-3 text-sm md:text-base font-black text-amber-100 hover:bg-amber-300/15"
                  >
                    Ver ayudas y trámites
                  </button>

                  <button
                    onClick={() => go("/solar/faq")}
                    className="rounded-full border border-slate-600 bg-slate-950/40 px-5 py-3 text-sm md:text-base font-bold text-slate-100 hover:bg-slate-900/60"
                  >
                    Dudas frecuentes (FAQ)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="rounded-[32px] border border-slate-600 bg-gradient-to-br from-slate-950/70 via-slate-950/55 to-slate-900/50 p-6 md:p-8 mb-10 shadow-[0_0_55px_rgba(16,185,129,0.10)]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
            <div>
              <div className="text-xs md:text-sm font-black tracking-[0.22em] text-emerald-200 uppercase">
                Proceso claro · sin sorpresas
              </div>
              <h2 className="text-2xl md:text-3xl font-black mt-2">
                ¿Cómo trabajamos tu proyecto solar?
              </h2>
              <p className="text-base md:text-lg text-slate-200 mt-2 font-semibold">
                Te guiamos desde el estudio hasta la puesta en marcha y la monitorización.
              </p>
            </div>

            <button
              onClick={() => go("/solar/como-funciona")}
              className="rounded-full border border-slate-600 bg-slate-950/40 px-5 py-3 text-sm md:text-base font-black hover:bg-slate-900/60 w-fit"
            >
              Ver el proceso completo →
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <StepCard n="1" title="Estudio" desc="Consumo, tejado y objetivos." />
            <StepCard n="2" title="Diseño" desc="Paneles, inversor y protecciones." />
            <StepCard n="3" title="Trámites" desc="Licencias, legalización y ayudas." />
            <StepCard n="4" title="Instalación" desc="Montaje y puesta en marcha." />
            <StepCard n="5" title="Ahorro" desc="Monitorización y optimización." />
          </div>
        </section>

        {/* CALCULADORA */}
        <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr] mb-10">
          <div className="rounded-[32px] border border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 via-slate-950/65 to-slate-950 p-6 md:p-8 shadow-[0_0_55px_rgba(16,185,129,0.16)]">
            <div className="text-xs md:text-sm font-black tracking-[0.22em] text-emerald-200 uppercase">
              Calcula tu ahorro (orientativo)
            </div>
            <h2 className="text-2xl md:text-3xl font-black mt-2">
              Estimación rápida en 20 segundos
            </h2>
            <p className="text-base md:text-lg text-slate-200 mt-2 font-semibold">
              Te damos un rango orientativo y luego lo afinamos con tu factura real.
            </p>

            <div className="grid gap-4 md:grid-cols-3 mt-6">
              <Select
                label="Tipo"
                value={tipo}
                onChange={(v) => setTipo(v as any)}
                options={[
                  { value: "vivienda", label: "Vivienda" },
                  { value: "empresa", label: "Empresa" },
                ]}
              />
              <Input
                label="Gasto mensual (€)"
                value={gasto}
                onChange={setGasto}
                placeholder="Ej. 80"
              />
              <Input
                label="Provincia (opcional)"
                value={provincia}
                onChange={setProvincia}
                placeholder="Ej. Madrid"
              />
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-600 bg-slate-900/55 p-6">
              <p className="text-sm md:text-base text-slate-300 font-bold">
                Resultado orientativo
              </p>

              {ahorroEstimado ? (
                <>
                  <p className="text-3xl md:text-4xl font-black mt-2">
                    <span className="text-emerald-300">
                      {ahorroEstimado.min}€ – {ahorroEstimado.max}€
                    </span>{" "}
                    <span className="text-slate-200 text-xl md:text-2xl font-black">
                      /año
                    </span>
                  </p>
                  <p className="text-sm md:text-base text-slate-300 mt-3 font-semibold">
                    *Depende de horario, tejado, sombras, potencia y tarifas.
                  </p>
                </>
              ) : (
                <p className="text-base md:text-lg text-slate-200 mt-2 font-semibold">
                  Introduce un gasto válido para ver el rango.
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-5">
                <button
                  onClick={() =>
                    go("/solar/estudio", { tipo, gastoMensual: gasto, provincia })
                  }
                  className="rounded-full bg-emerald-400 px-6 py-3 text-sm md:text-base font-black text-slate-950 hover:bg-emerald-300"
                >
                  Afinar con estudio gratuito →
                </button>

                <button
                  onClick={() => go("/solar/tienda")}
                  className="rounded-full border border-amber-300/60 bg-amber-300/10 px-6 py-3 text-sm md:text-base font-black text-amber-100 hover:bg-amber-300/15"
                >
                  Ver equipos en tienda
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SolarHeroImage src="/solar/proceso.jpg" alt="Proceso y equipo técnico" />
            <div className="rounded-[28px] border border-slate-600 bg-slate-950/60 p-6">
              <p className="text-base md:text-lg font-black text-emerald-200">
                Consejo
              </p>
              <p className="mt-2 text-base md:text-lg text-slate-200 font-semibold leading-relaxed">
                Si puedes, ten a mano una factura para ajustar consumo (kWh), potencia y tarifas.
              </p>
            </div>
          </div>
        </section>

        {/* SOLUCIONES */}
        <section className="mb-10">
          <div className="flex items-end justify-between gap-3 mb-5">
            <div>
              <div className="text-xs md:text-sm font-black tracking-[0.22em] text-emerald-200 uppercase">
                Soluciones
              </div>
              <h2 className="text-2xl md:text-3xl font-black mt-2">
                Elige tu camino: ahorro, autonomía o solución integral
              </h2>
            </div>

            <button
              onClick={() => go("/solar/estudio")}
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm md:text-base font-black text-slate-950 hover:bg-emerald-300"
            >
              Estudio gratuito →
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <SolutionCard
              image="/solar/residencial.jpg"
              tone="emerald"
              title="Autoconsumo residencial"
              desc="Dimensionado perfecto para tu vivienda, con ahorro estable y monitorización."
              cta1={{ label: "Pedir estudio", onClick: () => go("/solar/estudio") }}
              cta2={{ label: "Ver tienda", onClick: () => go("/solar/tienda") }}
            />
            <SolutionCard
              image="/solar/empresa.jpg"
              tone="blue"
              title="Empresas y negocios"
              desc="Reduce costes fijos, mejora competitividad y proyecta imagen sostenible."
              cta1={{ label: "Estudio para empresa", onClick: () => go("/solar/estudio", { tipo: "empresa" }) }}
              cta2={{ label: "Ver equipos", onClick: () => go("/solar/tienda") }}
            />
            <SolutionCard
              image="/solar/bateria.jpg"
              tone="amber"
              title="Baterías y autonomía"
              desc="Aprovecha más producción, reduce compra a red y gana independencia."
              cta1={{ label: "Evaluar batería", onClick: () => go("/solar/estudio") }}
              cta2={{ label: "Baterías en tienda", onClick: () => go("/solar/tienda/categoria/baterias") }}
            />
          </div>
        </section>

        {/* CONFIANZA */}
        <section className="rounded-[32px] border border-slate-600 bg-gradient-to-br from-slate-950/70 via-slate-950/55 to-slate-900/50 p-6 md:p-8 mb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
            <div>
              <div className="text-xs md:text-sm font-black tracking-[0.22em] text-emerald-200 uppercase">
                Confianza
              </div>
              <h2 className="text-2xl md:text-3xl font-black mt-2">
                Clientes que ya han dado el paso
              </h2>
              <p className="text-base md:text-lg text-slate-200 mt-2 font-semibold">
                (Aquí luego metemos reseñas reales y quedará brutal)
              </p>
            </div>

            <button
              onClick={() => go("/solar/faq")}
              className="rounded-full border border-slate-600 bg-slate-950/40 px-6 py-3 text-sm md:text-base font-black hover:bg-slate-900/60 w-fit"
            >
              Ver FAQ →
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Testimonial
              name="Cliente residencial"
              text="Me lo explicaron todo con claridad. El estudio fue rápido y la instalación quedó perfecta."
            />
            <Testimonial
              name="Negocio local"
              text="Ahora controlamos el gasto energético y tenemos previsión. Gran acompañamiento en trámites."
            />
            <Testimonial
              name="Vivienda con batería"
              text="Con batería aprovechamos más. La monitorización es muy útil para ver el ahorro real."
            />
          </div>
        </section>

        {/* TIENDA TEASER */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start mb-10">
          <div className="rounded-[32px] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-slate-950/65 to-slate-950 p-6 md:p-8">
            <div className="text-xs md:text-sm font-black tracking-[0.22em] text-emerald-200 uppercase">
              Tienda Solar Impulso
            </div>
            <h2 className="text-2xl md:text-3xl font-black mt-2">
              Kits, paneles, baterías e inversores
            </h2>
            <p className="text-base md:text-lg text-slate-200 mt-2 font-semibold">
              Compra equipos solares con asesoramiento. Si no sabes qué elegir, te guiamos.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <MiniLink label="Kits solares" onClick={() => go("/solar/tienda/categoria/kits")} tone="emerald" />
              <MiniLink label="Paneles solares" onClick={() => go("/solar/tienda/categoria/paneles")} tone="blue" />
              <MiniLink label="Baterías" onClick={() => go("/solar/tienda/categoria/baterias")} tone="amber" />
              <MiniLink label="Inversores" onClick={() => go("/solar/tienda/categoria/inversores")} tone="emerald" />
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => go("/solar/tienda")}
                className="rounded-full bg-emerald-400 px-6 py-3 text-sm md:text-base font-black text-slate-950 hover:bg-emerald-300"
              >
                Entrar en la tienda →
              </button>
              <button
                onClick={() => go("/solar/estudio")}
                className="rounded-full border border-amber-300/60 bg-amber-300/10 px-6 py-3 text-sm md:text-base font-black text-amber-100 hover:bg-amber-300/15"
              >
                Quiero asesoramiento (estudio)
              </button>
            </div>
          </div>

          <SolarHeroImage src="/solar/tienda.jpg" alt="Tienda de productos solares" />
        </section>

        <SolarFooter />
      </div>
    </div>
  );
}

/* ---------- UI helpers (TODOS con fuente grande + negrita) ---------- */

function toneClasses(tone: "emerald" | "blue" | "amber") {
  if (tone === "blue") {
    return {
      border: "border-sky-300/25",
      bg: "bg-sky-400/10",
      text: "text-sky-200",
      glow: "shadow-[0_0_30px_rgba(59,130,246,0.20)]",
    };
  }
  if (tone === "amber") {
    return {
      border: "border-amber-300/25",
      bg: "bg-amber-300/10",
      text: "text-amber-100",
      glow: "shadow-[0_0_30px_rgba(251,191,36,0.18)]",
    };
  }
  return {
    border: "border-emerald-300/25",
    bg: "bg-emerald-400/10",
    text: "text-emerald-200",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.18)]",
  };
}

function TrustChip({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: "emerald" | "blue" | "amber";
}) {
  const t = toneClasses(tone);
  return (
    <div className={`rounded-2xl border ${t.border} ${t.bg} px-4 py-4 ${t.glow}`}>
      <p className="text-sm md:text-base font-black text-slate-50">{title}</p>
      <p className={`text-sm md:text-base mt-1 font-bold ${t.text}`}>{subtitle}</p>
    </div>
  );
}

function StepCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-600 p-5">
      <p className="text-sm md:text-base font-black text-emerald-300 mb-1">
        {n} · {title}
      </p>
      <p className="text-base md:text-lg text-slate-200 font-semibold leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function SolutionCard({
  image,
  tone,
  title,
  desc,
  cta1,
  cta2,
}: {
  image: string;
  tone: "emerald" | "blue" | "amber";
  title: string;
  desc: string;
  cta1: { label: string; onClick: () => void };
  cta2: { label: string; onClick: () => void };
}) {
  const t = toneClasses(tone);
  return (
    <div className={`rounded-[28px] border ${t.border} bg-slate-950/65 overflow-hidden ${t.glow}`}>
      <div className="relative h-44">
        <Image src={image} alt={title} fill className="object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
      </div>
      <div className="p-6">
        <p className={`text-xl font-black ${t.text}`}>{title}</p>
        <p className="text-base md:text-lg text-slate-200 mt-2 font-semibold leading-relaxed">
          {desc}
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={cta1.onClick}
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm md:text-base font-black text-slate-950 hover:bg-emerald-300"
          >
            {cta1.label}
          </button>
          <button
            onClick={cta2.onClick}
            className="rounded-full border border-slate-600 bg-slate-950/40 px-6 py-3 text-sm md:text-base font-black hover:bg-slate-900/60"
          >
            {cta2.label}
          </button>
        </div>
      </div>
    </div>
  );
}

function Testimonial({ name, text }: { name: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-slate-600 bg-slate-950/55 p-6">
      <p className="text-lg font-black text-emerald-200">{name}</p>
      <p className="text-base md:text-lg text-slate-200 mt-3 leading-relaxed font-semibold">
        “{text}”
      </p>
      <p className="text-sm text-amber-200 mt-4 font-black">★★★★★</p>
    </div>
  );
}

function MiniLink({
  label,
  onClick,
  tone,
}: {
  label: string;
  onClick: () => void;
  tone: "emerald" | "blue" | "amber";
}) {
  const t = toneClasses(tone);
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border ${t.border} ${t.bg} px-5 py-4 hover:bg-slate-900/40 transition ${t.glow}`}
    >
      <p className="text-base md:text-lg font-black text-slate-50">{label}</p>
      <p className={`text-sm md:text-base mt-1 font-bold ${t.text}`}>Ver productos →</p>
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm md:text-base text-slate-100 font-black">{label}</span>
      <input
        className="rounded-2xl border border-slate-600 bg-slate-950/55 px-5 py-3.5 text-base md:text-lg font-semibold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/45"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
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
    <label className="grid gap-2">
      <span className="text-sm md:text-base text-slate-100 font-black">{label}</span>
      <select
        className="rounded-2xl border border-slate-600 bg-slate-950/55 px-5 py-3.5 text-base md:text-lg font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/45"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-950">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
