// src/app/share/lugar/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import RedirectClient from "./redirect-client";

export const runtime = "nodejs";

// ✅ En tu proyecto: params y searchParams vienen como Promise (Next 15 types)
type NextSearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<NextSearchParams>;
};

function toSingle(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const lugarId = Number(id);

  const lugar = await prisma.lugar.findUnique({
    where: { id: lugarId },
    select: { id: true, nombre: true, especialMensaje: true },
  });

  const activo = await prisma.marketingAsset.findFirst({
    where: { lugarId, tipo: "IMAGE", activo: true },
    select: { url: true },
  });

  const title = lugar?.nombre
    ? `Impulso Energético · ${lugar.nombre}`
    : "Impulso Energético";

  const description =
    lugar?.especialMensaje ||
    "Regístrate en 1 minuto y te ayudamos a ahorrar en Luz, Gas, Telefonía y más.";

  const images = activo?.url ? [activo.url] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const lugarId = Number(id);

  // ✅ searchParams viene como Promise: lo resolvemos y garantizamos objeto
  const sp: NextSearchParams = (await searchParams) ?? {};
  const v = toSingle(sp.v);

  const lugar = await prisma.lugar.findUnique({
    where: { id: lugarId },
    select: { id: true, agenteId: true, qrCode: true, nombre: true },
  });

  const qs = new URLSearchParams();
  if (lugar?.agenteId) qs.set("agenteId", String(lugar.agenteId));
  if (lugar?.id) qs.set("lugarId", String(lugar.id));
  if (lugar?.qrCode) qs.set("qr", String(lugar.qrCode));
  if (v) qs.set("v", v); // bust cache (opcional)

  const target = `/registro?${qs.toString()}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
      <div className="max-w-xl w-full rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
        <h1 className="text-2xl font-extrabold">Impulso Energético</h1>
        <p className="mt-2 text-slate-300 font-bold">
          Abriendo registro… {lugar?.nombre ? `(${lugar.nombre})` : ""}
        </p>

        {/* ✅ Redirect en cliente (WhatsApp no lo ejecuta, pero ya leyó OG del HTML 200) */}
        <RedirectClient to={target} />

        <p className="mt-4 text-sm text-slate-400 font-bold">
          Si no te redirige automáticamente, pulsa aquí:
        </p>

        <a
          href={target}
          className="mt-2 inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-3 rounded-xl"
        >
          Ir al registro
        </a>
      </div>
    </main>
  );
}
