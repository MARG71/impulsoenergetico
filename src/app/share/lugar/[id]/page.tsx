// src/app/share/lugar/[id]/page.tsx
import { prisma } from "@/lib/prisma";

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
    select: { nombre: true, especialMensaje: true },
  });

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
    select: {
      id: true,
      agenteId: true,
      qrCode: true,
      nombre: true,
      especialMensaje: true,
    },
  });

  const fondoActivo = await prisma.fondo.findFirst({
    where: { activo: true },
    orderBy: { creadoEn: "desc" },
    select: { url: true, nombre: true },
  });

  // query de trazabilidad
  const qs = new URLSearchParams();
  if (lugar?.agenteId) qs.set("agenteId", String(lugar.agenteId));
  if (lugar?.id) qs.set("lugarId", String(lugar.id));
  if (lugar?.qrCode) qs.set("qr", String(lugar.qrCode));
  if (v) qs.set("v", v);

  // destinos
  const targetRegistro = `/registro?${qs.toString()}`;
  const targetBienvenida = `/ofertas?${qs.toString()}`;

  const nombreLugar = lugar?.nombre ? String(lugar.nombre) : "este lugar";
  const gancho =
    (lugar?.especialMensaje && String(lugar.especialMensaje).trim()) ||
    "Ahorra en tu factura y consigue ventajas por contratar con nosotros";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO con imagen grande */}
      <section className="relative">
        {fondoActivo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fondoActivo.url}
            alt={fondoActivo.nombre || "Imagen activa"}
            className="w-full h-[62vh] md:h-[72vh] object-cover"
          />
        ) : (
          <div className="w-full h-[62vh] md:h-[72vh] bg-slate-900 flex items-center justify-center">
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 font-extrabold">
              ⚠️ No hay imagen activa. Activa una en “Fondos carteles”.
            </div>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-slate-950" />

        {/* Contenido encima */}
        <div className="absolute inset-0">
          <div className="mx-auto max-w-5xl px-5 md:px-10 h-full flex items-end pb-8 md:pb-12">
            <div className="w-full">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs md:text-sm font-extrabold text-slate-100">
                ⚡ Impulso Energético · Acceso rápido
              </div>

              <h1 className="mt-4 text-3xl md:text-5xl font-extrabold leading-tight text-white">
                {gancho}
              </h1>

              <p className="mt-3 text-base md:text-lg text-slate-200 font-bold max-w-3xl">
                📍 {nombreLugar} · Regístrate y en{" "}
                <span className="text-white font-extrabold">1 minuto</span> te
                contactamos para encontrar la mejor opción (Luz, Gas, Telefonía,
                Seguros y eficiencia energética).
              </p>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 font-bold text-slate-200">
                  ✅ Estudio gratuito y sin compromiso
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 font-bold text-slate-200">
                  ✅ Optimizamos tus contratos (ahorro real)
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 font-bold text-slate-200">
                  ✅ Ventajas y recompensas por contratar
                </div>
              </div>

              {/* Botones */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={targetRegistro}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-4 text-lg shadow-[0_0_30px_rgba(16,185,129,0.25)]"
                >
                  ✅ Ir al registro (1 minuto)
                </a>

                <a
                  href={targetBienvenida}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900/70 hover:bg-slate-900 text-white font-extrabold px-6 py-4 text-lg border border-white/10"
                >
                  Ver ofertas primero
                </a>
              </div>

              <p className="mt-3 text-xs md:text-sm text-slate-300 font-bold">
                Tu acceso queda asociado al lugar y al agente para mantener
                trazabilidad y atención prioritaria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Zona inferior con acciones */}
      <section className="mx-auto max-w-5xl px-5 md:px-10 py-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-lg md:text-xl font-extrabold text-white">
                ¿Listo para empezar?
              </div>
              <div className="mt-1 text-slate-300 font-bold">
                Elige ver ofertas o registrarte directamente.
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <a
                href={targetBienvenida}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold px-6 h-12"
              >
                Ver ofertas
              </a>

              <a
                href={targetRegistro}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 h-12"
              >
                Ir al registro
              </a>
            </div>
          </div>

          <p className="mt-4 text-xs md:text-sm text-slate-400 font-bold">
            Este enlace sirve para WhatsApp/Redes. La imagen se ve grande y el
            cliente decide cuándo registrarse.
          </p>
        </div>
      </section>
    </main>
  );
}
