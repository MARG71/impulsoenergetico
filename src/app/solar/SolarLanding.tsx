"use client";

import Image from "next/image";
import Link from "next/link";
import SolarFooter from "./_shared/SolarFooter";

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
    <section id={id} className={["w-full px-4 sm:px-6 lg:px-10 py-14 sm:py-16 lg:py-20", className].join(" ")}>
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur">
      <h3 className="text-xl md:text-2xl font-extrabold text-white">{title}</h3>
      <div className="mt-3 text-base md:text-lg leading-8 text-white/80">{children}</div>
    </div>
  );
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center rounded-full bg-[#FFC107] px-7 py-4 text-base md:text-lg font-extrabold text-black hover:opacity-95">
      {children}
    </Link>
  );
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-4 text-base md:text-lg font-extrabold text-white hover:bg-white/10">
      {children}
    </Link>
  );
}

function GammaPreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
      <Image src={src} alt={alt} width={2000} height={1125} className="h-auto w-full object-cover" />
    </div>
  );
}

export default function SolarLanding() {
  return (
    <>
      {/* 01 HERO */}
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

      {/* 02 POR QUÉ */}
      <Section id="por-que">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>POR QUÉ</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold">Por qué elegirnos</h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Diseño a medida, instalación certificada y acompañamiento total.
            </p>

            <div className="mt-9 grid gap-5 sm:grid-cols-3">
              <Card title="+3.300 clientes">Confianza y satisfacción acumulada.</Card>
              <Card title="Paneles Tier-1">Componentes premium y duraderos.</Card>
              <Card title="Diseño personalizado">Adaptado a tu consumo real.</Card>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/02-por-que.png" alt="Por qué Gamma" />
        </div>
      </Section>

      {/* 03 BENEFICIOS */}
      <Section id="beneficios">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>BENEFICIOS</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold">Beneficios reales</h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Ahorro, independencia y revalorización.
            </p>

            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              <Card title="Ahorro inmediato">Reduce tu factura desde el primer mes.</Card>
              <Card title="Energía limpia">Menos emisiones y más sostenibilidad.</Card>
              <Card title="Independencia">Menos impacto de subidas de luz.</Card>
              <Card title="Valor vivienda">Mejor eficiencia y atractivo.</Card>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/03-beneficios.png" alt="Beneficios Gamma" />
        </div>
      </Section>

      {/* 04 TIENDA */}
      <Section id="tienda">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>TIENDA</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold">Productos y kits</h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Paneles, inversores, baterías y kits listos para instalar.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <PrimaryButton href="/solar/tienda">Ver Tienda</PrimaryButton>
              <GhostButton href="/solar/estudio">Pedir Estudio</GhostButton>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/04-tienda.png" alt="Tienda Gamma" />
        </div>
      </Section>

      {/* 05 KITS */}
      <Section id="kits">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>KITS</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold">Kits completos</h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Soluciones integrales según consumo y presupuesto.
            </p>
          </div>

          <GammaPreview src="/solar/gamma/05-kits.png" alt="Kits Gamma" />
        </div>
      </Section>

      {/* 06 PROCESO */}
      <Section id="proceso">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Chip>PROCESO</Chip>
            <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold">Proceso sencillo</h2>
            <p className="mt-5 text-xl md:text-2xl text-white/75 leading-9">
              Estudio → Presupuesto → Instalación → Ahorro
            </p>

            <div className="mt-9">
              <PrimaryButton href="/solar/como-funciona">Ver cómo funciona</PrimaryButton>
            </div>
          </div>

          <GammaPreview src="/solar/gamma/06-proceso.png" alt="Proceso Gamma" />
        </div>
      </Section>

      {/* 07..12 */}
      <Section>
        <GammaPreview src="/solar/gamma/07-casos.png" alt="Casos Gamma" />
        <div className="mt-6" />
        <GammaPreview src="/solar/gamma/08-financiacion.png" alt="Financiación Gamma" />
        <div className="mt-6" />
        <GammaPreview src="/solar/gamma/09-tecnologia.png" alt="Tecnología Gamma" />
        <div className="mt-6" />
        <GammaPreview src="/solar/gamma/10-garantias.png" alt="Garantías Gamma" />
        <div className="mt-6" />
        <GammaPreview src="/solar/gamma/11-faq.png" alt="FAQ Gamma" />
        <div className="mt-6" />
        <GammaPreview src="/solar/gamma/12-cta.png" alt="CTA Gamma" />
      </Section>

      <SolarFooter />
    </>
  );
}
