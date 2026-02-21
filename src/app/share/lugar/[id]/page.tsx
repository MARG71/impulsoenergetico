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
  return Array.isArray(v) ? v[0] : v;
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

  const fondoActivo = await prisma.fondo.findFirst({
    where: { activo: true },
    orderBy: { creadoEn: "desc" },
    select: { url: true },
  });

  const title = lugar?.nombre
    ? `Impulso Energético · ${lugar.nombre}`
    : "Impulso Energético";

  const description =
    lugar?.especialMensaje ||
    "Ahorra en Luz, Gas y Telefonía. Registro en 1 minuto y atención personalizada.";

  const images = fondoActivo?.url ? [fondoActivo.url] : [];

  return {
    title,
    description,
    openGraph: { title, description, images, type: "website" },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const lugarId = Number(id);

  const sp: NextSearchParams =
    (await searchParams?.catch(() => ({} as NextSearchParams))) ?? {};

  const v = toSingle((sp as NextSearchParams)["v"]);

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
      especialLogoUrl: true,
    },
  });

  const fondoActivo = await prisma.fondo.findFirst({
    where: { activo: true },
    orderBy: { creadoEn: "desc" },
    select: { url: true, nombre: true },
  });

  const qs = new URLSearchParams();
  if (lugar?.agenteId) qs.set("agenteId", String(lugar.agenteId));
  if (lugar?.id) qs.set("lugarId", String(lugar.id));
  if (lugar?.qrCode) qs.set("qr", String(lugar.qrCode));
  if (v) qs.set("v", v);

  // ✅ Para que en /registro se vea el nombre (sin enseñar IDs)
  if (lugar?.nombre) qs.set("lugarNombre", lugar.nombre);

  const registroHref = `/registro?${qs.toString()}`;
  // ✅ si quieres que “ver ofertas” vaya directo a Home pública, lo dejamos para más tarde.
  const ofertasHref = `/?${qs.toString()}`;

  return (
    <ShareLugarClient
      lugarNombre={lugar?.nombre ?? "Lugar autorizado"}
      especialMensaje={
        lugar?.especialMensaje ??
        "Te ayudamos a elegir la mejor opción en Luz, Gas, Telefonía y Seguros. Atención rápida y sin compromiso."
      }
      fondoUrl={fondoActivo?.url ?? null}
      fondoNombre={fondoActivo?.nombre ?? null}
      registroHref={registroHref}
      ofertasHref={ofertasHref}
      partnerLogoUrl={lugar?.especialLogoUrl ?? null}
    />
  );
}
