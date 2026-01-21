// src/app/solar/_shared/SolarHeroImage.tsx
import Image from "next/image";
import React from "react";

export default function SolarHeroImage({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-emerald-500/30 bg-slate-950 shadow-[0_0_35px_rgba(8,47,35,0.9)]">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-400/10 pointer-events-none" />
      <Image
        src={src}
        alt={alt}
        width={1400}
        height={900}
        priority={priority}
        className="h-56 sm:h-72 lg:h-80 w-full object-cover opacity-90"
      />
    </div>
  );
}
