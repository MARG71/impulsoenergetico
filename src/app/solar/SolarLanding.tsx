"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

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
      <Image src={src} alt={alt} width={2000} height={1125} className="h-auto w-full object-cover" />
    </div>
  );
}

export default function SolarLanding() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <>
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

      {/* ... aquí dejas el resto de secciones tal cual las tienes ... */}

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
                <span className="font-extrabold text-white">Email:</span> info@impulsoenergetico.es
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
    </>
  );
}
