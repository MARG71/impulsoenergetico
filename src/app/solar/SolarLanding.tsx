// src/app/solar/SolarLanding.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import SolarHeader from "./_shared/SolarHeader";
import SolarFooter from "./_shared/SolarFooter";
import SolarLeadPopup from "./_shared/SolarLeadPopup";
import SolarQuickActions from "./_shared/SolarQuickActions";

const CTA_PRIMARY_HREF = "/solar/estudio";
const CTA_SECONDARY_HREF = "/solar/tienda";

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={[
        "w-full",
        "px-4 sm:px-6 lg:px-10",
        "py-14 sm:py-16 lg:py-20",
        className,
      ].join(" ")}
    >
      <div className="mx-auto w-full max-w-[1600px]">{children}</div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#FFC107]/30 bg-[#FFC107]/10 px-4 py-2 text-sm md:text-base font-extrabold tracking-wide text-[#FFE8A3]">
      {children}
    </span>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur",
        className,
      ].join(" ")}
    >
      <h3 className="text-xl md:text-2xl font-extrabold text-white">{title}</h3>
      <div className="mt-3 text-base md:text-lg leading-8 text-white/80">{children}</div>
    </div>
  );
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-4 text-base md:text-lg font-extrabold text-white transition hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-[#FFC107] px-7 py-4 text-base md:text-lg font-extrabold text-black transition hover:opacity-95"
    >
      {children}
    </Link>
  );
}

function GammaPreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
      <Image
        src={src}
        alt={alt}
        width={2000}
        height={1125}
        className="h-auto w-full object-cover"
        priority={false}
      />
    </div>
  );
}

export default function SolarLanding() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen text-white bg-[#061513]">
      {/* Fondo “solar” más colorido */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_10%,rgba(255,193,7,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_80%_20%,rgba(16,185,129,0.20),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_70%_90%,rgba(255,140,0,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#061513] via-[#061513] to-[#040B0A]" />
      </div>

      <SolarHeader />
      <SolarLeadPopup />

      {/* Botonera fija estilo Sotysolar */}
      <SolarQuickActions
        phone="+34 692 137 048"
        estudioHref={CTA_PRIMARY_HREF}
        guiaHref="/solar/faq"
      />

      {/* HERO */}
      <Section className="pt-10 sm:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-3">
              <Chip>ENERGÍA SOLAR</Chip>
              <Chip>AHORRO REAL</Chip>
              <Chip>INSTALACIÓN PROFESIONAL</Chip>
            </div>

            <h1 className="mt-7 text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.03] tracking-tight">
              IMPULSO ENERGÉTICO
              <span className="block text-white/80">Tu futuro solar comienza aquí</span>
            </h1>

            <p className="mt-6 max-w-2xl text-xl md:text-2xl leading-9 text-white/75">
              Diseñamos e instalamos sistemas fotovoltaicos para hogar y empresa.
              Ahorra desde el primer mes, con garantías y acompañamiento total.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <PrimaryButton href={CTA_PRIMARY_HREF}>Solicita tu Presupuesto Gratis</PrimaryButton>
              <GhostButton href={CTA_SECONDARY_HREF}>Ver Productos</GhostButton>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-white/75">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-white text-2xl font-extrabold">Hasta 70%</div>
                <div className="mt-1 text-base">Ahorro estimado</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-white text-2xl font-extrabold">1–2 días</div>
                <div className="mt-1 text-base">Instalación</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-white text-2xl font-extrabold">Financiación</div>
                <div className="mt-1 text-base">A tu medida</div>
              </div>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/01-hero.png" alt="Hero Gamma" />
        </div>
      </Section>

      {/* POR QUÉ */}
      <Section id="por-que">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>POR QUÉ ELEGIRNOS</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              Líderes en Energía Solar Residencial
            </h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Tecnología de vanguardia, instalación certificada y diseño a medida.
              Nos enfocamos en que el cliente entienda el ahorro y lo vea reflejado.
            </p>

            <div className="mt-9 grid gap-5 sm:grid-cols-3">
              <Card title="+3.300 clientes">Confianza y satisfacción acumulada.</Card>
              <Card title="Paneles Tier-1">Componentes premium y duraderos.</Card>
              <Card title="Diseño personalizado">Estudio adaptado a tu consumo real.</Card>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/02-por-que.png" alt="Por qué elegirnos Gamma" />
        </div>
      </Section>

      {/* BENEFICIOS */}
      <Section id="beneficios">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>BENEFICIOS</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              Beneficios de la Energía Solar
            </h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Reduce gastos, gana independencia y mejora el valor de tu vivienda,
              mientras contribuyes al cuidado del planeta.
            </p>

            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              <Card title="Ahorro inmediato">Reduce tu factura desde el primer mes.</Card>
              <Card title="Sostenibilidad">Energía limpia y reducción de emisiones.</Card>
              <Card title="Revalorización">Mejora el valor y atractivo de tu propiedad.</Card>
              <Card title="Independencia">Protégete ante subidas del precio de la luz.</Card>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/03-beneficios.png" alt="Beneficios Gamma" />
        </div>
      </Section>

      {/* TIENDA */}
      <Section id="tienda">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>TIENDA ONLINE</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              Nuestros Productos Estrella
            </h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Paneles, inversores, baterías y kits listos para instalar.
              Materiales seleccionados y garantías extendidas.
            </p>

            <div className="mt-9 grid gap-5">
              <Card title="Placas Solares Premium">Alta eficiencia y garantía de producción.</Card>
              <Card title="Inversores Inteligentes">Monitorización en tiempo real desde tu móvil.</Card>
              <Card title="Baterías de Almacenamiento">Autonomía y máximo aprovechamiento.</Card>
            </div>

            <div className="mt-9 flex flex-wrap gap-4">
              <PrimaryButton href="/solar/tienda">Ver Tienda</PrimaryButton>
              <GhostButton href="/solar/estudio">Pedir Estudio</GhostButton>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/04-tienda.png" alt="Tienda Gamma" />
        </div>
      </Section>

      {/* KITS */}
      <Section id="kits">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>KITS SOLARES</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              Kits Solares Completos
            </h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Soluciones integrales según consumo y presupuesto. Incluimos instalación y legalización.
            </p>

            <div className="mt-9 grid gap-5">
              <Card title="Kit Solar Básico">Consumo moderado: placas + inversor + instalación.</Card>
              <Card title="Kit Solar Avanzado">Máximo ahorro: más potencia + opción batería.</Card>
              <Card title="Kit Solar Premium">Autosuficiencia: batería + gestión inteligente.</Card>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/05-kits.png" alt="Kits Gamma" />
        </div>
      </Section>

      {/* PROCESO */}
      <Section id="proceso">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>PROCESO</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              Proceso de Instalación Simple y Rápido
            </h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Nos encargamos de todo: estudio, trámites, instalación y puesta en marcha.
            </p>

            <ol className="mt-9 space-y-5">
              {[
                ["Solicita tu estudio", "Formulario rápido y asesoramiento inicial."],
                ["Presupuesto detallado", "Opciones adaptadas a tu consumo y objetivos."],
                ["Planificación", "Coordinación de fecha y permisos necesarios."],
                ["Instalación profesional", "Equipo certificado en 1–2 días."],
                ["Activación y ahorro", "Monitorización y soporte continuo."],
              ].map(([t, d], idx) => (
                <li key={t} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFC107] text-black text-lg font-extrabold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xl font-extrabold">{t}</div>
                      <div className="mt-1 text-lg text-white/70 leading-8">{d}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-9">
              <PrimaryButton href="/solar/como-funciona">Ver cómo funciona</PrimaryButton>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/06-proceso.png" alt="Proceso Gamma" />
        </div>
      </Section>

      {/* CASOS */}
      <Section id="casos">
        <Chip>RESULTADOS REALES</Chip>
        <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
          Casos de Éxito
        </h2>
        <p className="mt-5 max-w-4xl text-xl md:text-2xl text-white/75 leading-9">
          Ejemplos para transmitir confianza. Más adelante podemos hacerlos dinámicos si quieres.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Card title="Familia Martínez — Madrid">
            “Bajamos la factura y ahora controlamos la producción desde la app.”
            <div className="mt-4 text-[#FFE8A3] text-xl font-extrabold">Ahorro anual: 1.620€</div>
          </Card>
          <Card title="Chalet García — Valencia">
            “Con baterías somos casi autosuficientes.”
            <div className="mt-4 text-[#FFE8A3] text-xl font-extrabold">Ahorro anual: 2.890€</div>
          </Card>
          <Card title="Vivienda López — Barcelona">
            “La monitorización en tiempo real es increíble.”
            <div className="mt-4 text-[#FFE8A3] text-xl font-extrabold">Ahorro anual: 1.340€</div>
          </Card>
        </div>

        <div className="mt-10">
          <GammaPreview src="/solar/gamma/07-casos.png" alt="Casos Gamma" />
        </div>
      </Section>

      {/* FINANCIACIÓN */}
      <Section id="financiacion">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>FINANCIACIÓN</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              Financiación Flexible a tu Medida
            </h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Opciones para empezar sin fricción: sin entrada, plazos flexibles y cuota sostenible con el ahorro.
            </p>

            <div className="mt-9 grid gap-5">
              <Card title="Sin entrada">Empieza sin desembolso inicial.</Card>
              <Card title="Hasta 20 años">Plazos adaptados a tu economía familiar.</Card>
              <Card title="Cuota baja">Paga menos en cuota que lo que ahorras.</Card>
              <Card title="Aprobación rápida">Respuesta rápida (según entidad).</Card>
            </div>

            <div className="mt-9 flex flex-wrap gap-4">
              <PrimaryButton href="/solar/estudio">Calcular mi ahorro</PrimaryButton>
              <GhostButton href="/solar/subvenciones">Ver subvenciones</GhostButton>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/08-financiacion.png" alt="Financiación Gamma" />
        </div>
      </Section>

      {/* TECNOLOGÍA */}
      <Section id="tecnologia">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>TECNOLOGÍA</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              Monitorización Inteligente 24/7
            </h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Controla tu instalación desde cualquier lugar. Informes claros, alertas y métricas para ver tu ahorro.
            </p>

            <ul className="mt-9 space-y-3 text-xl text-white/80">
              {[
                "Dashboard intuitivo y fácil de usar",
                "Histórico completo de producción",
                "Predicciones meteorológicas integradas",
                "Comparativas y análisis de consumo",
                "Soporte técnico integrado",
              ].map((x) => (
                <li key={x} className="flex items-start gap-3">
                  <span className="mt-4 h-2 w-2 rounded-full bg-[#FFC107]" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>

          <GammaPreview src="/solar/gamma/09-tecnologia.png" alt="Tecnología Gamma" />
        </div>
      </Section>

      {/* GARANTÍAS */}
      <Section id="garantias">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>GARANTÍAS</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              Garantías y Servicio Post-Venta
            </h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Te acompañamos antes, durante y después. Mantenimiento, revisiones y soporte para máximo rendimiento.
            </p>

            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              <Card title="25 años">Garantía de producción en paneles (según fabricante).</Card>
              <Card title="15 años">Equipos e inversores (según modelo).</Card>
              <Card title="10 años">Mano de obra e instalación (según condiciones).</Card>
              <Card title="Clientes satisfechos">Servicio cercano y transparente.</Card>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/10-garantias.png" alt="Garantías Gamma" />
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <Chip>PREGUNTAS FRECUENTES</Chip>
        <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
          Resolvemos tus Dudas
        </h2>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {[
            [
              "¿Cuánto puedo ahorrar realmente?",
              "El ahorro medio suele estar en el 60–70% (depende de consumo, orientación y hábitos).",
            ],
            [
              "¿Cuánto dura la instalación?",
              "La instalación física suele completarse en 1–2 días. El proceso completo puede variar por permisos.",
            ],
            [
              "¿Qué pasa los días nublados?",
              "Los paneles siguen produciendo (menos). Con baterías aprovechas energía almacenada; si no, la red complementa.",
            ],
            [
              "¿Necesito permisos especiales?",
              "Nos encargamos de trámites, legalización y conexión con distribuidora cuando aplica.",
            ],
            [
              "¿Qué mantenimiento requiere?",
              "Mínimo: limpieza ocasional y revisiones preventivas. Te asesoramos según zona e instalación.",
            ],
            [
              "¿Puedo vender el excedente?",
              "Sí, en modalidad de compensación simplificada el excedente puede descontarse en factura (según condiciones).",
            ],
          ].map(([q, a]) => (
            <div key={q} className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <div className="text-xl md:text-2xl font-extrabold">{q}</div>
              <div className="mt-3 text-lg md:text-xl leading-9 text-white/75">{a}</div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <PrimaryButton href="/solar/faq">Ver FAQ completa</PrimaryButton>
        </div>

        <div className="mt-12">
          <GammaPreview src="/solar/gamma/11-faq.png" alt="FAQ Gamma" />
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section id="cta" className="pb-12">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>EMPIEZA HOY</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              Comienza tu Revolución Solar Hoy
            </h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Solicita tu estudio y te damos un plan claro: ahorro estimado, diseño recomendado, financiación y pasos.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <PrimaryButton href="/solar/estudio">Solicitar Estudio Gratis</PrimaryButton>
              <GhostButton href="/solar/tienda">Ver Productos</GhostButton>
            </div>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-7 text-lg md:text-xl text-white/75">
              <div className="font-extrabold text-white">Atención al cliente</div>
              <div className="mt-2">Lunes a viernes de 9:00 a 20:00</div>
              <div className="mt-4">
                <span className="font-extrabold text-white">Email:</span>{" "}
                info@impulsoenergetico.es
              </div>
            </div>

            <div className="mt-8 text-sm text-white/50">
              © {year} Impulso Energético — Energía Solar
            </div>
          </div>

          <GammaPreview src="/solar/gamma/12-cta.png" alt="CTA Gamma" />
        </div>
      </Section>

      <SolarFooter />
    </div>
  );
}
