// src/app/share/lugar/[id]/page.tsx
// src/app/share/lugar/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import ShareLugarClient from "./ShareLugarClient";

export const runtime = "nodejs";

type NextSearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<NextSearchParams>;
};

function toSingle(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? String(v[0] ?? "") : String(v);
}

// ✅ AJUSTA si tu home pública es /home
const HOME_PUBLIC_PATH = "/";

async function getShareImageUrl(lugarId?: number) {
  // 1) Marketing activo (redes/whatsapp) por lugar si existe, si no global
  const byLugar =
    lugarId && Number.isFinite(lugarId)
      ? await prisma.marketingAsset.findFirst({
          where: { activo: true, tipo: "IMAGE", lugarId },
          orderBy: { creadaEn: "desc" },
          select: { url: true },
        })
      : null;

  if (byLugar?.url) return byLugar.url;

  const global = await prisma.marketingAsset.findFirst({
    where: { activo: true, tipo: "IMAGE" },
    orderBy: { creadaEn: "desc" },
    select: { url: true },
  });

  if (global?.url) return global.url;

  // 2) Fondo activo (fallback)
  const fondoActivo = await prisma.fondo.findFirst({
    where: { activo: true },
    orderBy: { creadoEn: "desc" },
    select: { url: true },
  });

  return fondoActivo?.url ?? null;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const lugarId = Number(id);

  const lugar = Number.isFinite(lugarId)
    ? await prisma.lugar.findUnique({
        where: { id: lugarId },
        select: { id: true, nombre: true, especialMensaje: true },
      })
    : null;

  const imageUrl = await getShareImageUrl(lugarId);

  const title = lugar?.nombre
    ? `Impulso Energético · ${lugar.nombre}`
    : "Impulso Energético";

  const description =
    lugar?.especialMensaje ||
    "Ahorra en Luz, Gas, Telefonía y Seguros. Registro en 1 minuto y atención personalizada.";

  const images = imageUrl ? [imageUrl] : [];

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

  const sp: NextSearchParams =
    (await searchParams?.catch(() => ({} as NextSearchParams))) ?? {};

  const v = toSingle(sp["v"]);

  if (!Number.isFinite(lugarId) || lugarId <= 0) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h1 className="text-2xl font-extrabold">Impulso Energético</h1>
          <p className="mt-2 text-slate-300 font-semibold">
            ID de lugar inválido.
          </p>
        </div>
      </main>
    );
  }

  const lugar = await prisma.lugar.findUnique({
    where: { id: lugarId },
    select: {
      id: true,
      agenteId: true,
      qrCode: true,
      nombre: true,
      especialMensaje: true,
      especial: true,
      especialLogoUrl: true,
    },
  });

  const imagenShare = await getShareImageUrl(lugarId);

  const qs = new URLSearchParams();
  if (lugar?.agenteId) qs.set("agenteId", String(lugar.agenteId));
  if (lugar?.id) qs.set("lugarId", String(lugar.id));
  if (lugar?.qrCode) qs.set("qr", String(lugar.qrCode));
  if (v) qs.set("v", v);

  const registroHref = `/registro?${qs.toString()}`;
  const ofertasHref = `${HOME_PUBLIC_PATH}?${qs.toString()}`; // ✅ Directo a pantallazo 5

  return (
    <ShareLugarClient
      lugarNombre={lugar?.nombre ?? "Lugar autorizado"}
      especialMensaje={
        lugar?.especialMensaje ??
        "Te ayudamos a elegir la mejor opción en Luz, Gas, Telefonía, Seguros e instalaciones de eficiencia energética."
      }
      imagenUrl={imagenShare}
      partnerLogoUrl={lugar?.especial ? lugar?.especialLogoUrl ?? null : null}
      registroHref={registroHref}
      ofertasHref={ofertasHref}
    />
  );
}
