"use client";

import Link from "next/link";

export default function SolarQuickActions({
  phone,
  estudioHref,
  guiaHref,
}: {
  phone: string;
  estudioHref: string;
  guiaHref: string;
}) {
  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-[60] hidden md:flex flex-col gap-3">
      <a
        href={`tel:${phone}`}
        className="group flex items-center gap-3 rounded-full border border-white/15 bg-black/45 backdrop-blur px-4 py-3 hover:bg-black/60 transition"
      >
        <span className="grid place-items-center h-11 w-11 rounded-full bg-[#FFC107] text-black font-black">
          ☎
        </span>
        <span className="text-lg font-extrabold">Te llamamos</span>
      </a>

      <Link
        href={estudioHref}
        className="group flex items-center gap-3 rounded-full border border-white/15 bg-black/45 backdrop-blur px-4 py-3 hover:bg-black/60 transition"
      >
        <span className="grid place-items-center h-11 w-11 rounded-full bg-[#FFC107] text-black font-black">
          ?
        </span>
        <span className="text-lg font-extrabold">Pide presupuesto</span>
      </Link>

      <Link
        href={guiaHref}
        className="group flex items-center gap-3 rounded-full border border-white/15 bg-black/45 backdrop-blur px-4 py-3 hover:bg-black/60 transition"
      >
        <span className="grid place-items-center h-11 w-11 rounded-full bg-[#FFC107] text-black font-black">
          📘
        </span>
        <span className="text-lg font-extrabold">Guía Solar</span>
      </Link>
    </div>
  );
}
