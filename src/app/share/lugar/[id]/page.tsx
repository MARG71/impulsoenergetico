// src/app/share/lugar/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

// ✅ Next 15: params viene como Promise en tu proyecto
type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const lugarId = Number(id);

  const lugar = await prisma.lugar.findUnique({
    where: { id: lugarId },
    select: {
      id: true,
      nombre: true,
      especialMensaje: true,
    },
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

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const lugarId = Number(id);

  const lugar = await prisma.lugar.findUnique({
    where: { id: lugarId },
    select: { id: true, agenteId: true, qrCode: true },
  });

  const qs = new URLSearchParams();
  if (lugar?.agenteId) qs.set("agenteId", String(lugar.agenteId));
  if (lugar?.id) qs.set("lugarId", String(lugar.id));
  if (lugar?.qrCode) qs.set("qr", String(lugar.qrCode));

  redirect(`/registro?${qs.toString()}`);
}
