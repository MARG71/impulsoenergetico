// src/app/share/lugar/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import RedirectClient from "./redirect-client";

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

  const lugar = await prisma.lugar.findUnique({
    where: { id: lugarId },
    select: { id: true, nombre: true, especialMensaje: true },
  });

  // ✅ Imagen para compartir = Fondo global activo
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
    "Regístrate en 1 minuto y te ayudamos a ahorrar en Luz, Gas, Telefonía y más.";

  const images = fondoActivo?.url ? [fondoActivo.url] : [];

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

  const sp: NextSearchParams = (await searchParams) ?? {};
  const v = toSingle(sp.v);

  const lugar = await prisma.lugar.findUnique({
    where: { id: lugarId },
    select: { id: true, agenteId: true, qrCode: true, nombre: true },
  });

  // ✅ Fondo activo para mostrar en pantalla (preview)
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

  const target = `/registro?${qs.toString()}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
        <h1 className="text-2xl font-extrabold">Impulso Energético</h1>
        <p className="mt-2 text-slate-300 font-bold">
          Abriendo registro… {lugar?.nombre ? `(${lugar.nombre})` : ""}
        </p>

        {/* ✅ PREVIEW de la imagen activa (para que “se vea”) */}
        {fondoActivo?.url ? (
          <div className="mt-4 rounded-2xl border border-slate-800 overflow-hidden bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fondoActivo.url}
              alt={fondoActivo.nombre || "Imagen activa"}
              className="w-full h-[260px] object-cover"
            />
            <div className="px-4 py-3 text-xs text-slate-300 font-extrabold">
              Imagen activa: {fondoActivo.nombre || "—"}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 font-extrabold">
            ⚠️ No hay Fondo activo (Fondo.activo = true). Activa uno en “Fondos carteles”.
          </div>
        )}

        {/* ✅ Redirect con debug (lo tienes ya OK) */}
        <RedirectClient to={target} delayMs={2500} debug />

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
