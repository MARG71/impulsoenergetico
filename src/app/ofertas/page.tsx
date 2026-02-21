// src/app/ofertas/page.tsx
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import OfertasContenido from "./OfertasContenido";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NextSearchParams = Record<string, string | string[] | undefined>;

function toSingle(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: NextSearchParams;
}) {
  const sp = searchParams ?? {};
  const agenteId = toSingle(sp.agenteId);
  const lugarId = toSingle(sp.lugarId);
  const qr = toSingle(sp.qr);
  const v = toSingle(sp.v);

  // Construimos el QS para mantener trazabilidad
  const qs = new URLSearchParams();
  if (agenteId) qs.set("agenteId", agenteId);
  if (lugarId) qs.set("lugarId", lugarId);
  if (qr) qs.set("qr", qr);
  if (v) qs.set("v", v);

  // Datos del lugar (opcional)
  const lugarIdNum = Number(lugarId);
  const lugar =
    Number.isFinite(lugarIdNum) && lugarIdNum > 0
      ? await prisma.lugar.findUnique({
          where: { id: lugarIdNum },
          select: { nombre: true },
        })
      : null;

  // Fondo activo (para mostrar arriba)
  const fondoActivo = await prisma.fondo.findFirst({
    where: { activo: true },
    orderBy: { creadoEn: "desc" },
    select: { url: true },
  });

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
