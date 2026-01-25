// src/app/solar/_shared/SolarHeader.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type NavLink = { label: string; href: string };
type Props = {
  logoSrc: string;
  links: NavLink[];
  cta: { label: string; href: string };
};

export default function SolarHeader({ logoSrc, links, cta }: Props) {
  const [open, setOpen] = useState(false);

  const pill =
    "px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 transition text-base lg:text-lg font-extrabold";

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#071B16]/85 backdrop-blur border-b border-white/10">
        <div className="mx-auto w-full max-w-[1600px] px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <Link href="/solar" className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-2xl overflow-hidden bg-black/20 border border-white/10">
              <Image src={logoSrc} alt="Impulso Energético" fill className="object-contain p-1" />
            </div>
            <div className="leading-tight">
              <div className="text-lg md:text-xl font-extrabold">IMPULSO ENERGÉTICO</div>
              <div className="text-sm md:text-base text-white/70 font-semibold">
                Energía Solar
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={pill}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={cta.href}
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#18A676] hover:opacity-95 transition px-5 py-3 text-lg font-extrabold"
            >
              {cta.label}
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 font-extrabold"
              aria-label="Abrir menú"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden border-t border-white/10">
            <div className="mx-auto w-full max-w-[1600px] px-4 md:px-8 py-4 grid gap-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-lg font-extrabold"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href={cta.href}
                onClick={() => setOpen(false)}
                className="mt-2 px-4 py-4 rounded-2xl bg-[#18A676] text-white text-lg font-extrabold text-center"
              >
                {cta.label}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
