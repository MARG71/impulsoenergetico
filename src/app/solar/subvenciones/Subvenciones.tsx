"use client";

import Link from "next/link";
import SolarHeader from "../_shared/SolarHeader";
import SolarFooter from "../_shared/SolarFooter";

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
      <div className="text-2xl font-extrabold">{title}</div>
      <div className="mt-3 text-lg text-white/75 leading-8">{children}</div>
    </div>
  );
}

export default function Subvenciones() {
  return (
    <div className="min-h-screen bg-[#070A16] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_10%,rgba(59,130,246,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A16] via-[#070A16] to-[#050712]" />
      </div>

      <SolarHeader />

      <Section>
        <div className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-extrabold text-emerald-100">
          SUBVENCIONES
        </div>

        <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight">
          Ayudas y deducciones para tu instalación
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-white/75 leading-8">
          Esta sección está pensada para reforzar la decisión: “si además hay ayudas, mejor”.
          Aquí lo dejamos como presentación y luego lo afinamos por comunidad/provincia.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Card title="Deducciones fiscales">
            Posibles deducciones en IRPF/rehabilitación energética (según normativa y caso).
          </Card>
          <Card title="Bonificaciones IBI/ICIO">
            En algunos municipios hay reducciones. Te lo revisamos en el estudio.
          </Card>
          <Card title="Gestión completa">
            Te guiamos en documentación y trámites para maximizar ventajas.
          </Card>
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-8">
          <div className="text-2xl font-extrabold">¿Quieres saber qué aplica en tu zona?</div>
          <p className="mt-3 text-lg text-white/75 leading-8">
            Pídenos el estudio y revisamos tu caso con detalle.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/solar/estudio"
              className="rounded-full bg-emerald-400 px-7 py-4 text-base font-extrabold text-slate-950 hover:bg-emerald-300"
            >
              Solicitar Estudio Gratis
            </Link>
            <Link
              href="/solar"
              className="rounded-full border border-emerald-300/40 px-7 py-4 text-base font-extrabold text-emerald-100 hover:bg-emerald-300/10"
            >
              Volver a la landing
            </Link>
          </div>
        </div>
      </Section>

      <SolarFooter />
    </div>
  );
}
