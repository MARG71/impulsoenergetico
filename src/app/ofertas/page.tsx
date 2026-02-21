// src/app/ofertas/page.tsx
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import OfertasContenido from "./OfertasContenido";

export const runtime = "nodejs";

type NextSearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<NextSearchParams>;
};

function toSingle(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({ searchParams }: PageProps) {
  const sp: NextSearchParams = (await searchParams?.catch(() => ({}))) ?? {};

  const agenteId = toSingle(sp.agenteId);
  const lugarIdStr = toSingle(sp.lugarId);
  const qr = toSingle(sp.qr);

  const lugarId = Number(lugarIdStr);
  const lugar =
    Number.isFinite(lugarId) && lugarId > 0
      ? await prisma.lugar.findUnique({
          where: { id: lugarId },
          select: { id: true, nombre: true },
        })
      : null;

  const fondoActivo = await prisma.fondo.findFirst({
    where: { activo: true },
    orderBy: { creadoEn: "desc" },
    select: { url: true },
  });

  const qs = new URLSearchParams();
  if (agenteId) qs.set("agenteId", agenteId);
  if (lugar?.id) qs.set("lugarId", String(lugar.id));
  if (qr) qs.set("qr", qr);

  return (
    <Suspense fallback={null}>
      <OfertasContenido
        qs={qs.toString()}
        lugarNombre={lugar?.nombre ?? null}
        fondoUrl={fondoActivo?.url ?? null}
      />
    </Suspense>
  );
}
