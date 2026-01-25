"use client";

import Link from "next/link";

type Props = {
  phone?: string;
  estudioHref: string;
  guiaHref: string;
};

function Action({
  icon,
  label,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  external?: boolean;
}) {
  const cls =
    "group w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 hover:bg-black/55 backdrop-blur px-4 py-3 transition shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

  const content = (
    <>
      <div className="h-11 w-11 rounded-2xl bg-[#FFC107] text-black flex items-center justify-center font-black">
        {icon}
      </div>
      <div className="text-lg font-extrabold">{label}</div>
    </>
  );

  if (external) {
    return (
      <a className={cls} href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className={cls} href={href}>
      {content}
    </Link>
  );
}

export default function SolarQuickActions({
  phone = "+34 600 000 000",
  estudioHref,
  guiaHref,
}: Props) {
  const telHref = `tel:${phone.replace(/\s/g, "")}`;
  const waHref = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hola, quiero un estudio solar."
  )}`;

  return (
    <>
      {/* Desktop: lateral fijo */}
      <div className="hidden md:block fixed right-6 top-1/2 -translate-y-1/2 z-40 w-[260px] space-y-3">
        <Action icon={<span>📞</span>} label="Te llamamos" href={telHref} external />
        <Action icon={<span>❓</span>} label="Pide presupuesto" href={estudioHref} />
        <Action icon={<span>📘</span>} label="Guía Solar" href={guiaHref} />

        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-sm font-semibold text-white/70 hover:text-white"
        >
          O escríbenos por WhatsApp
        </a>
      </div>

      {/* Mobile: barra inferior */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur">
        <div className="grid grid-cols-3 gap-2 p-3">
          <a
            href={telHref}
            className="rounded-2xl bg-[#FFC107] text-black font-extrabold py-3 text-center"
          >
            Llamar
          </a>
          <Link
            href={estudioHref}
            className="rounded-2xl bg-emerald-500 text-white font-extrabold py-3 text-center"
          >
            Estudio
          </Link>
          <Link
            href={guiaHref}
            className="rounded-2xl bg-white/10 text-white font-extrabold py-3 text-center"
          >
            Guía
          </Link>
        </div>
      </div>

      {/* separador para que en móvil no tape contenido */}
      <div className="md:hidden h-20" />
    </>
  );
}
