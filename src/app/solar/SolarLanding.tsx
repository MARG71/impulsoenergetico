// src/app/solar/SolarLanding.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import SolarHeader from "./_shared/SolarHeader";
import SolarFooter from "./_shared/SolarFooter";
import SolarLeadPopup from "./_shared/SolarLeadPopup";

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
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-100">
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
        "rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur",
        className,
      ].join(" ")}
    >
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-white/80">{children}</div>
    </div>
  );
}

function GhostButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-transparent px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200/70 hover:bg-emerald-300/10"
    >
      {children}
    </Link>
  );
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300"
    >
      {children}
    </Link>
  );
}

function GammaPreview({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={900}
        className="h-auto w-full object-cover"
        priority={false}
      />
    </div>
  );
}

export default function SolarLanding() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-[#070A16] text-white">
      {/* Fondo general estilo Gamma (oscuro con gradiente) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_10%,rgba(16,185,129,0.20),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(800px_450px_at_80%_20%,rgba(34,211,238,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_400px_at_70%_90%,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A16] via-[#070A16] to-[#050712]" />
      </div>

      <SolarHeader />

      {/* Popup tipo SotySolar (sale “de vez en cuando”) */}
      <SolarLeadPopup />

      {/* HERO (Gamma 1) */}
      <Section className="pt-10 sm:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-2">
              <Chip>ENERGÍA SOLAR</Chip>
              <Chip>AHORRO REAL</Chip>
              <Chip>INSTALACIÓN PROFESIONAL</Chip>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              IMPULSO ENERGÉTICO
              <span className="block text-white/80">
                Tu futuro solar comienza aquí
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              Diseñamos e instalamos sistemas fotovoltaicos para hogar y empresa.
              Ahorra desde el primer mes, con garantías y acompañamiento total.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryButton href={CTA_PRIMARY_HREF}>
                Solicita tu Presupuesto Gratis
              </PrimaryButton>
              <GhostButton href={CTA_SECONDARY_HREF}>
                Ver Productos
              </GhostButton>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 text-xs text-white/70">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-white font-extrabold">Hasta 70%</div>
                <div className="mt-1">Ahorro estimado</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-white font-extrabold">1–2 días</div>
                <div className="mt-1">Instalación</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-white font-extrabold">Financiación</div>
                <div className="mt-1">A tu medida</div>
              </div>
            </div>
          </div>

          <GammaPreview
            src="/solar/gamma/01-hero.png"
            alt="Hero Gamma"
          />
        </div>
      </Section>

      {/* POR QUÉ ELEGIRNOS (Gamma 2) */}
      <Section id="por-que">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Chip>POR QUÉ ELEGIRNOS</Chip>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Líderes en Energía Solar Residencial
            </h2>
            <p className="mt-4 text-white/75 leading-7">
              Tecnología de vanguardia, instalación certificada y diseño a medida.
              Nos enfocamos en que el cliente entienda el ahorro y lo vea reflejado.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <Card title="+3.300 clientes">
                Confianza y satisfacción acumulada.
              </Card>
              <Card title="Paneles Tier-1">
                Componentes premium y duraderos.
              </Card>
              <Card title="Diseño personalizado">
                Estudio adaptado a tu consumo real.
              </Card>
            </div>
          </div>

          <GammaPreview
            src="/solar/gamma/02-por-que.png"
            alt="Por qué elegirnos Gamma"
          />
        </div>
      </Section>

      {/* BENEFICIOS (Gamma 3) */}
      <Section id="beneficios">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Chip>BENEFICIOS</Chip>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Beneficios de la Energía Solar
            </h2>
            <p className="mt-4 text-white/75 leading-7">
              Reduce gastos, gana independencia y mejora el valor de tu vivienda,
              mientras contribuyes al cuidado del planeta.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Card title="Ahorro inmediato">
                Reduce tu factura desde el primer mes.
              </Card>
              <Card title="Sostenibilidad">
                Energía limpia y reducción de emisiones.
              </Card>
              <Card title="Revalorización">
                Aumenta el atractivo y el valor de tu propiedad.
              </Card>
              <Card title="Independencia">
                Protégete frente a subidas del precio de la luz.
              </Card>
            </div>
          </div>

          <GammaPreview
            src="/solar/gamma/03-beneficios.png"
            alt="Beneficios Gamma"
          />
        </div>
      </Section>

      {/* TIENDA / PRODUCTOS (Gamma 4) */}
      <Section id="tienda">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Chip>TIENDA ONLINE</Chip>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Nuestros Productos Estrella
            </h2>
            <p className="mt-4 text-white/75 leading-7">
              Paneles, inversores, baterías y kits listos para instalar.
              Materiales seleccionados y garantías extendidas.
            </p>

            <div className="mt-7 grid gap-4">
              <Card title="Placas Solares Premium">
                Alta eficiencia y garantía de producción.
              </Card>
              <Card title="Inversores Inteligentes">
                Monitorización en tiempo real desde tu móvil.
              </Card>
              <Card title="Baterías de Almacenamiento">
                Autonomía y máximo aprovechamiento de tu energía.
              </Card>
            </div>

            <div className="mt-7 flex gap-3">
              <PrimaryButton href="/solar/tienda">Ver Tienda</PrimaryButton>
              <GhostButton href="/solar/estudio">Pedir Estudio</GhostButton>
            </div>
          </div>

          <GammaPreview
            src="/solar/gamma/04-tienda.png"
            alt="Tienda Gamma"
          />
        </div>
      </Section>

      {/* KITS (Gamma 5) */}
      <Section id="kits">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Chip>KITS SOLARES</Chip>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Kits Solares Completos
            </h2>
            <p className="mt-4 text-white/75 leading-7">
              Soluciones integrales según consumo y presupuesto. Incluimos
              instalación profesional y legalización.
            </p>

            <div className="mt-7 grid gap-4">
              <Card title="Kit Solar Básico">
                Ideal para consumo moderado (ejemplo): 6 placas + inversor híbrido
                + estructura + instalación.
              </Card>
              <Card title="Kit Solar Avanzado">
                Máximo ahorro energético (ejemplo): 10 placas + inversor superior
                + opción batería.
              </Card>
              <Card title="Kit Solar Premium">
                Autosuficiencia total (ejemplo): 16 placas + batería + gestión inteligente.
              </Card>
            </div>
          </div>

          <GammaPreview
            src="/solar/gamma/05-kits.png"
            alt="Kits Gamma"
          />
        </div>
      </Section>

      {/* PROCESO (Gamma 6) */}
      <Section id="proceso">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Chip>PROCESO</Chip>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Proceso de Instalación Simple y Rápido
            </h2>
            <p className="mt-4 text-white/75 leading-7">
              Nos encargamos de todo: estudio, trámites, instalación y puesta en marcha.
            </p>

            <ol className="mt-7 space-y-4">
              {[
                ["Solicita tu estudio", "Formulario rápido y asesoramiento inicial."],
                ["Presupuesto detallado", "Opciones adaptadas a tu consumo y objetivos."],
                ["Planificación", "Coordinación de fecha y permisos necesarios."],
                ["Instalación profesional", "Equipo certificado en 1–2 días."],
                ["Activación y ahorro", "Monitorización y soporte continuo."],
              ].map(([t, d], idx) => (
                <li
                  key={t}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-extrabold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold">{t}</div>
                      <div className="mt-1 text-sm text-white/70">{d}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-7">
              <PrimaryButton href="/solar/como-funciona">Ver cómo funciona</PrimaryButton>
            </div>
          </div>

          <GammaPreview
            src="/solar/gamma/06-proceso.png"
            alt="Proceso Gamma"
          />
        </div>
      </Section>

      {/* CASOS DE ÉXITO (Gamma 7) */}
      <Section id="casos">
        <Chip>RESULTADOS REALES</Chip>
        <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
          Casos de Éxito
        </h2>
        <p className="mt-4 max-w-3xl text-white/75 leading-7">
          Ejemplos visuales para transmitir confianza (y que el cliente “se vea” ahí).
          Estos casos pueden alimentarse más adelante desde base de datos si quieres.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card title="Familia Martínez — Madrid">
            “Bajamos la factura y ahora controlamos la producción desde la app.”
            <div className="mt-3 text-emerald-200 font-extrabold">Ahorro anual: 1.620€</div>
          </Card>
          <Card title="Chalet García — Valencia">
            “Con baterías somos casi autosuficientes.”
            <div className="mt-3 text-emerald-200 font-extrabold">Ahorro anual: 2.890€</div>
          </Card>
          <Card title="Vivienda López — Barcelona">
            “La monitorización en tiempo real es increíble.”
            <div className="mt-3 text-emerald-200 font-extrabold">Ahorro anual: 1.340€</div>
          </Card>
        </div>

        <div className="mt-8">
          <GammaPreview
            src="/solar/gamma/07-casos.png"
            alt="Casos Gamma"
          />
        </div>
      </Section>

      {/* FINANCIACIÓN (Gamma 8) */}
      <Section id="financiacion">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Chip>FINANCIACIÓN</Chip>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Financiación Flexible a tu Medida
            </h2>
            <p className="mt-4 text-white/75 leading-7">
              Opciones para empezar sin fricción: sin entrada, plazos flexibles y
              cuotas que se sostienen con el ahorro.
            </p>

            <div className="mt-7 grid gap-4">
              <Card title="Sin entrada">
                Empieza sin desembolso inicial.
              </Card>
              <Card title="Hasta 20 años">
                Plazos adaptados a tu economía familiar.
              </Card>
              <Card title="Cuota baja">
                Paga menos en cuota que lo que ahorras.
              </Card>
              <Card title="Aprobación rápida">
                Respuesta en 24h (según entidad).
              </Card>
            </div>

            <div className="mt-7 flex gap-3">
              <PrimaryButton href="/solar/estudio">Calcular mi ahorro</PrimaryButton>
              <GhostButton href="/solar/subvenciones">Ver subvenciones</GhostButton>
            </div>
          </div>

          <GammaPreview
            src="/solar/gamma/08-financiacion.png"
            alt="Financiación Gamma"
          />
        </div>
      </Section>

      {/* TECNOLOGÍA (Gamma 9) */}
      <Section id="tecnologia">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Chip>TECNOLOGÍA</Chip>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Monitorización Inteligente 24/7
            </h2>
            <p className="mt-4 text-white/75 leading-7">
              Controla tu instalación desde cualquier lugar. Informes claros,
              alertas y métricas para ver tu ahorro.
            </p>

            <ul className="mt-7 space-y-2 text-sm text-white/80">
              {[
                "Dashboard intuitivo y fácil de usar",
                "Histórico completo de producción",
                "Predicciones meteorológicas integradas",
                "Comparativas y análisis de consumo",
                "Soporte técnico integrado",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>

          <GammaPreview
            src="/solar/gamma/09-tecnologia.png"
            alt="Tecnología Gamma"
          />
        </div>
      </Section>

      {/* GARANTÍAS (Gamma 10) */}
      <Section id="garantias">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Chip>GARANTÍAS</Chip>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Garantías y Servicio Post-Venta
            </h2>
            <p className="mt-4 text-white/75 leading-7">
              Te acompañamos antes, durante y después. Mantenimiento, revisiones
              y soporte para que el sistema rinda siempre al máximo.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Card title="25 años">
                Garantía de producción en paneles (según fabricante).
              </Card>
              <Card title="15 años">
                Equipos e inversores (según modelo).
              </Card>
              <Card title="10 años">
                Mano de obra e instalación (según condiciones).
              </Card>
              <Card title="Clientes satisfechos">
                Servicio cercano y transparente.
              </Card>
            </div>
          </div>

          <GammaPreview
            src="/solar/gamma/10-garantias.png"
            alt="Garantías Gamma"
          />
        </div>
      </Section>

      {/* FAQ (Gamma 11) */}
      <Section id="faq">
        <Chip>PREGUNTAS FRECUENTES</Chip>
        <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
          Resolvemos tus Dudas
        </h2>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {[
            [
              "¿Cuánto puedo ahorrar realmente?",
              "El ahorro medio suele estar en el 60–70% (depende de consumo, potencia, orientación y hábitos).",
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
              "Mínimo: limpieza ocasional y revisiones preventivas. Te asesoramos según zona y tipo de instalación.",
            ],
            [
              "¿Puedo vender el excedente?",
              "Sí, en modalidad de compensación simplificada, el excedente puede descontarse en factura (según condiciones).",
            ],
          ].map(([q, a]) => (
            <div
              key={q}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="text-base font-extrabold">{q}</div>
              <div className="mt-2 text-sm leading-6 text-white/75">{a}</div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <PrimaryButton href="/solar/faq">Ver FAQ completa</PrimaryButton>
        </div>

        <div className="mt-10">
          <GammaPreview src="/solar/gamma/11-faq.png" alt="FAQ Gamma" />
        </div>
      </Section>

      {/* CTA FINAL (Gamma 12) */}
      <Section id="cta" className="pb-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Chip>EMPIEZA HOY</Chip>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Comienza tu Revolución Solar Hoy
            </h2>
            <p className="mt-4 text-white/75 leading-7">
              Solicita tu estudio y te damos un plan claro: ahorro estimado, diseño recomendado,
              financiación y pasos.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryButton href="/solar/estudio">Solicitar Estudio Gratis</PrimaryButton>
              <GhostButton href="/solar/tienda">Ver Productos</GhostButton>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/75">
              <div className="font-extrabold text-white">Atención al cliente</div>
              <div className="mt-1">Lunes a viernes de 9:00 a 20:00</div>
              <div className="mt-3">
                <span className="font-bold text-white">Email:</span>{" "}
                info@impulsoenergetico.es
              </div>
            </div>

            <div className="mt-6 text-xs text-white/50">
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
