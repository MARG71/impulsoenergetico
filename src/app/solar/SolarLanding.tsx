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
    // Fórmula orientativa (NO técnica): rango “bonito” tipo landing.
    // Ajusta si quieres: simplemente es una estimación visual para empujar al estudio.
    const g = Number(String(gasto).replace(",", "."));
    if (!isFinite(g) || g <= 0) return null;

    const factor = tipo === "vivienda" ? 0.45 : 0.35;
    const anual = g * 12;
    const ahorro = anual * factor;

    // rango +- 12%
    const min = Math.round(ahorro * 0.88);
    const max = Math.round(ahorro * 1.12);

    return { min, max };
  }, [gasto, tipo]);

  const go = (path: string, extra?: Record<string, string>) => {
    router.push(`${path}${buildQuery(extra)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 md:py-10">
        <SolarHeader />

        {/* HERO (tipo SotySolar: directo a conversión) */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/35 bg-gradient-to-br from-emerald-600/25 via-emerald-500/5 to-slate-950/95 p-6 md:p-10 shadow-[0_0_40px_rgba(16,185,129,0.45)] mb-8 md:mb-10">
          <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/25 blur-3xl" />
          <span className="pointer-events-none absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-amber-300/15 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr),minmax(0,1fr)] items-start relative z-10">
            {/* Texto */}
            <div className="space-y-4">
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
                SOLAR IMPULSO · AUTOCONSUMO FOTOVOLTAICO
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
                {nombre ? (
                  <>
                    Hola,{" "}
                    <span className="text-emerald-300 font-extrabold">
                      {nombre}
                    </span>
                    .{" "}
                  </>
                ) : null}
                Ahorra en tu factura con una instalación{" "}
                <span className="text-amber-300">a medida</span>.
              </h1>

              <p className="text-sm md:text-base text-slate-100/90 max-w-2xl">
                Te hacemos un <b>estudio gratuito</b> con estimación de ahorro,
                dimensionado y opciones (con batería, coche eléctrico o aerotermia).
                Sin compromiso y con acompañamiento en trámites.
              </p>

              {(agenteId || lugarId) && (
                <p className="text-[11px] text-emerald-100/90">
                  QR detectado ·{" "}
                  {agenteId && (
                    <>
                      Agente: <b>{agenteId}</b>{" "}
                    </>
                  )}
                  {lugarId && (
                    <>
                      · Lugar: <b>{lugarId}</b>
                    </>
                  )}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => go("/solar/estudio")}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-emerald-500/50 hover:bg-emerald-400"
                >
                  Quiero mi estudio gratuito (2 min)
                </button>

                <button
                  onClick={() => go("/solar/tienda")}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-300/70 bg-slate-950/60 px-5 py-2.5 text-xs md:text-sm font-semibold text-emerald-100 hover:bg-slate-900"
                >
                  Ver tienda solar
                </button>

                <button
                  onClick={() => go("/comparador", { tipo: "luz" })}
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/60 px-5 py-2.5 text-xs md:text-sm font-semibold text-slate-100 hover:bg-slate-900"
                >
                  Estimar ahorro en mi luz
                </button>
              </div>

              {/* Confianza tipo landing */}
              <div className="grid gap-3 sm:grid-cols-3 pt-4">
                <TrustChip title="✅ Estudio sin compromiso" subtitle="En 24–48h" />
                <TrustChip title="🧩 Diseño a medida" subtitle="Consumo y tejado" />
                <TrustChip title="🛠️ Instalación profesional" subtitle="Acompañamiento" />
              </div>
            </div>

            {/* Tarjeta derecha tipo “form” + imagen */}
            <div className="space-y-4">
              <SolarHeroImage src="/solar/hero.jpg" alt="Instalación solar profesional" priority />

              <div className="rounded-3xl border border-slate-700 bg-slate-950/65 p-5">
                <p className="text-xs font-semibold text-emerald-200">
                  Recibe una llamada para tu estudio
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  Te llevamos al formulario de estudio (2 minutos).
                </p>

                <div className="mt-4 grid gap-2 text-xs">
                  <button
                    onClick={() => go("/solar/estudio")}
                    className="rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    Empezar estudio ahora →
                  </button>

                  <button
                    onClick={() => go("/solar/subvenciones")}
                    className="rounded-full border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-100 hover:bg-slate-900"
                  >
                    Ver ayudas y trámites
                  </button>

                  <button
                    onClick={() => go("/solar/faq")}
                    className="rounded-full border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-100 hover:bg-slate-900"
                  >
                    Dudas frecuentes (FAQ)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE: CÓMO FUNCIONA (tipo SotySolar: pasos claros) */}
        <section className="rounded-3xl border border-slate-700 bg-slate-950/75 p-6 md:p-7 mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
            <div>
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
                Proceso claro · sin sorpresas
              </div>
              <h2 className="text-lg md:text-xl font-extrabold mt-1">
                ¿Cómo trabajamos tu proyecto solar?
              </h2>
              <p className="text-sm text-slate-200 mt-1 max-w-3xl">
                Te guiamos desde el estudio hasta la puesta en marcha y la monitorización.
              </p>
            </div>

            <button
              onClick={() => go("/solar/como-funciona")}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-900 w-fit"
            >
              Ver el proceso completo →
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-5 text-xs md:text-sm">
            <StepCard n="1" title="Estudio" desc="Consumo, tejado y objetivos." />
            <StepCard n="2" title="Diseño" desc="Paneles, inversor y protecciones." />
            <StepCard n="3" title="Trámites" desc="Licencias, legalización y ayudas." />
            <StepCard n="4" title="Instalación" desc="Montaje y puesta en marcha." />
            <StepCard n="5" title="Ahorro" desc="Monitorización y optimización." />
          </div>
        </section>

        {/* BLOQUE: CALCULADORA (lead magnet) */}
        <section className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr] mb-8 md:mb-10">
          <div className="rounded-3xl border border-emerald-500/25 bg-slate-950/70 p-6 md:p-8 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
            <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
              Calcula tu ahorro (orientativo)
            </div>
            <h2 className="text-lg md:text-xl font-extrabold mt-2">
              Estimación rápida en 20 segundos
            </h2>
            <p className="text-sm text-slate-200 mt-2">
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

            <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-900/55 p-5">
              <p className="text-xs text-slate-300">
                Resultado orientativo
              </p>

              {ahorroEstimado ? (
                <>
                  <p className="text-xl md:text-2xl font-extrabold mt-1">
                    <span className="text-emerald-300">
                      {ahorroEstimado.min}€ – {ahorroEstimado.max}€
                    </span>{" "}
                    <span className="text-slate-200 text-base font-semibold">
                      /año
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    *Depende de horario, tejado, sombras, potencia y tarifas. El estudio gratuito ajusta números reales.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-200 mt-1">
                  Introduce un gasto válido para ver el rango.
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() =>
                    go("/solar/estudio", {
                      tipo,
                      gastoMensual: gasto,
                      provincia,
                    })
                  }
                  className="rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Afinar con estudio gratuito →
                </button>

                <button
                  onClick={() => go("/solar/tienda")}
                  className="rounded-full border border-slate-700 px-5 py-2.5 text-xs font-semibold hover:bg-slate-900"
                >
                  Ver equipos en tienda
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SolarHeroImage src="/solar/proceso.jpg" alt="Proceso y equipo técnico" />
            <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5 text-xs text-slate-200">
              <p className="font-semibold text-emerald-200">Consejo</p>
              <p className="mt-2">
                Si puedes, ten a mano una factura para ajustar consumo (kWh), potencia y tarifas.
              </p>
            </div>
          </div>
        </section>

        {/* BLOQUE: SOLUCIONES (tarjetas como SotySolar) */}
        <section className="mb-8 md:mb-10">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
                Soluciones
              </div>
              <h2 className="text-lg md:text-xl font-extrabold mt-1">
                Elige tu camino: ahorro, autonomía o solución integral
              </h2>
            </div>

            <button
              onClick={() => go("/solar/estudio")}
              className="rounded-full border border-emerald-300/70 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-slate-900"
            >
              Estudio gratuito →
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <SolutionCard
              image="/solar/residencial.jpg"
              title="Autoconsumo residencial"
              desc="Dimensionado perfecto para tu vivienda, con ahorro estable y monitorización."
              cta1={{ label: "Pedir estudio", onClick: () => go("/solar/estudio") }}
              cta2={{ label: "Ver tienda", onClick: () => go("/solar/tienda") }}
            />
            <SolutionCard
              image="/solar/empresa.jpg"
              title="Empresas y negocios"
              desc="Reduce costes fijos, mejora tu competitividad y proyecta imagen sostenible."
              cta1={{ label: "Estudio para empresa", onClick: () => go("/solar/estudio", { tipo: "empresa" }) }}
              cta2={{ label: "Ver equipos", onClick: () => go("/solar/tienda") }}
            />
            <SolutionCard
              image="/solar/bateria.jpg"
              title="Baterías y autonomía"
              desc="Aprovecha más producción, reduce compra a red y gana independencia."
              cta1={{ label: "Evaluar batería", onClick: () => go("/solar/estudio") }}
              cta2={{ label: "Baterías en tienda", onClick: () => go("/solar/tienda/categoria/baterias") }}
            />
          </div>
        </section>

        {/* BLOQUE: PRUEBA SOCIAL (testimonios placeholder) */}
        <section className="rounded-3xl border border-slate-700 bg-slate-950/70 p-6 md:p-8 mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
            <div>
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
                Confianza
              </div>
              <h2 className="text-lg md:text-xl font-extrabold mt-1">
                Clientes que ya han dado el paso
              </h2>
              <p className="text-sm text-slate-200 mt-1">
                Sustituye estos textos por reseñas reales cuando quieras.
              </p>
            </div>

            <button
              onClick={() => go("/solar/faq")}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-900 w-fit"
            >
              Ver FAQ →
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Testimonial
              name="Cliente residencial"
              text="Me explicaron todo con claridad. El estudio fue rápido y la instalación quedó perfecta."
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

        {/* BLOQUE: TIENDA TEASER */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start mb-10">
          <div className="rounded-3xl border border-emerald-500/25 bg-slate-950/70 p-6 md:p-8">
            <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
              Tienda Solar Impulso
            </div>
            <h2 className="text-lg md:text-xl font-extrabold mt-2">
              Kits, paneles, baterías e inversores
            </h2>
            <p className="text-sm text-slate-200 mt-2 max-w-2xl">
              Compra equipos solares con asesoramiento. Si no sabes qué elegir, te guiamos.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <MiniLink label="Kits solares" onClick={() => go("/solar/tienda/categoria/kits")} />
              <MiniLink label="Paneles solares" onClick={() => go("/solar/tienda/categoria/paneles")} />
              <MiniLink label="Baterías" onClick={() => go("/solar/tienda/categoria/baterias")} />
              <MiniLink label="Inversores" onClick={() => go("/solar/tienda/categoria/inversores")} />
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => go("/solar/tienda")}
                className="rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Entrar en la tienda →
              </button>
              <button
                onClick={() => go("/solar/estudio")}
                className="rounded-full border border-slate-700 px-5 py-2.5 text-xs font-semibold hover:bg-slate-900"
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

/* ---------- UI helpers ---------- */

function TrustChip({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/55 px-4 py-3">
      <p className="text-xs font-semibold text-slate-100">{title}</p>
      <p className="text-[11px] text-slate-300 mt-0.5">{subtitle}</p>
    </div>
  );
}

function StepCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-700 p-4">
      <p className="text-[11px] font-semibold text-emerald-300 mb-1">
        {n} · {title}
      </p>
      <p className="text-slate-200 text-xs md:text-sm">{desc}</p>
    </div>
  );
}

function SolutionCard({
  image,
  title,
  desc,
  cta1,
  cta2,
}: {
  image: string;
  title: string;
  desc: string;
  cta1: { label: string; onClick: () => void };
  cta2: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-950/65 overflow-hidden">
      <div className="relative h-40">
        <Image src={image} alt={title} fill className="object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      </div>
      <div className="p-5">
        <p className="text-emerald-300 font-semibold">{title}</p>
        <p className="text-sm text-slate-200 mt-1">{desc}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={cta1.onClick}
            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
          >
            {cta1.label}
          </button>
          <button
            onClick={cta2.onClick}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-900"
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
    <div className="rounded-3xl border border-slate-700 bg-slate-950/55 p-5">
      <p className="text-sm font-semibold text-emerald-200">{name}</p>
      <p className="text-sm text-slate-200 mt-2 leading-relaxed">“{text}”</p>
      <p className="text-[11px] text-slate-500 mt-3">★★★★★</p>
    </div>
  );
}

function MiniLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border border-slate-700 bg-slate-950/55 px-4 py-3 hover:bg-slate-900 transition"
    >
      <p className="text-xs font-semibold text-slate-100">{label}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">Ver productos →</p>
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
    <label className="grid gap-1">
      <span className="text-xs text-slate-200 font-semibold">{label}</span>
      <input
        className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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
    <label className="grid gap-1">
      <span className="text-xs text-slate-200 font-semibold">{label}</span>
      <select
        className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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
