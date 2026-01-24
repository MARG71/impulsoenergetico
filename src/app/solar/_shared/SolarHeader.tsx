// src/app/solar/_shared/SolarHeader.tsx
"use client";

import Link from "next/link";

const nav = [
  { href: "/solar#por-que", label: "Por qué" },
  { href: "/solar#beneficios", label: "Beneficios" },
  { href: "/solar#kits", label: "Kits" },
  { href: "/solar#proceso", label: "Proceso" },
  { href: "/solar/tienda", label: "Tienda" },
  { href: "/solar/faq", label: "FAQ" },
];

export default function SolarHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070A16]/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/solar" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-400" />
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight">
              IMPULSO ENERGÉTICO
            </div>
            <div className="text-xs text-white/60">Energía Solar</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/5 hover:text-white"
            >
              {i.label}
            </Link>
          ))}
          <Link
            href="/solar/estudio"
            className="ml-2 inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-extrabold text-slate-950 hover:bg-emerald-300"
          >
            Pedir estudio
          </Link>
        </nav>
      </div>
    </header>
  );
}
