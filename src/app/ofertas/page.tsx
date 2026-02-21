// src/app/ofertas/page.tsx
import { prisma } from "@/lib/prisma";
import OfertasContenido from "./OfertasContenido";

type SP = Record<string, string | string[] | undefined>;

function pickFirst(v: string | string[] | undefined) {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ? String(v[0]) : null) : String(v);
}

function toQs(sp: SP) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp ?? {})) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const vv of v) params.append(k, String(vv));
    } else {
      params.set(k, String(v));
    }
  }
  return params.toString();
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SP>;
}) {
  const sp = (await searchParams) ?? {};
  const qs = toQs(sp);

  // IDs si vienen
  const lugarIdRaw = pickFirst(sp.lugarId);
  const lugarId = lugarIdRaw ? Number(lugarIdRaw) : NaN;
  const lugarOk = Number.isFinite(lugarId) && lugarId > 0;

  // Partner logo opcional por query (si lo pasas por enlace)
  const partnerLogoFromQS = pickFirst(sp.partnerLogoUrl);

  // ✅ HOME pública real (cámbialo a "/home" si tu home pública vive ahí)
  const homePath = "/";

  // 1) Lugar (nombre + especial + logos/cartel especial)
  const lugar = lugarOk
    ? await prisma.lugar.findUnique({
        where: { id: lugarId },
        select: {
          nombre: true,
          especial: true,
          especialLogoUrl: true,
          especialCartelUrl: true,
        },
      })
    : null;

  const lugarNombre = lugar?.nombre ?? null;

  // 2) Fondo global: intentamos en este orden:
  //    A) ConfiguracionGlobal (id=1)
  //    B) FondoCartel.activo = true (último)
  //    C) Fondo.activo = true (último)
  let fondoGlobalUrl: string | null = null;

  const cfg = await prisma.configuracionGlobal.findUnique({
    where: { id: 1 },
    select: { fondoCartelUrl: true },
  });

  if (cfg?.fondoCartelUrl) {
    fondoGlobalUrl = cfg.fondoCartelUrl;
  } else {
    const fondoCartel = await prisma.fondoCartel.findFirst({
      where: { activo: true },
      orderBy: { creadoEn: "desc" },
      select: { url: true },
    });

    if (fondoCartel?.url) {
      fondoGlobalUrl = fondoCartel.url;
    } else {
      const fondo = await prisma.fondo.findFirst({
        where: { activo: true },
        orderBy: { creadoEn: "desc" },
        select: { url: true },
      });

      fondoGlobalUrl = fondo?.url ?? null;
    }
  }

  // 3) Fondo final:
  //    Si el lugar es especial y tiene especialCartelUrl -> preferimos ese
  const fondoUrl =
    lugar?.especial && lugar?.especialCartelUrl
      ? lugar.especialCartelUrl
      : fondoGlobalUrl;

  // 4) Partner logo final:
  //    QS gana; si no, usamos especialLogoUrl del lugar (si es especial)
  const partnerLogoUrl =
    partnerLogoFromQS ?? (lugar?.especial ? lugar?.especialLogoUrl ?? null : null);

  return (
    <OfertasContenido
      qs={qs}
      lugarNombre={lugarNombre}
      fondoUrl={fondoUrl}
      partnerLogoUrl={partnerLogoUrl}
      homePath={homePath}
    />
  );
}
