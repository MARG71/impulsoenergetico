// src/app/share/doc/[token]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinarySignedUrl } from "@/lib/cloudinary-signed";

export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const t = String(token || "").trim();

  if (!t) return NextResponse.json({ error: "Token no válido" }, { status: 400 });

  const doc = await prisma.leadDocumento.findUnique({
    where: { shareToken: t },
    select: {
      id: true,
      publicId: true,
      resourceType: true,
      deliveryType: true,
      shareExpiraEn: true,
      mime: true,
      nombre: true,
    },
  });

  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

  if (doc.shareExpiraEn && doc.shareExpiraEn.getTime() < Date.now()) {
    return NextResponse.json({ error: "Link caducado" }, { status: 410 });
  }

  // tracking
  await prisma.leadDocumento.update({
    where: { id: doc.id },
    data: { accesos: { increment: 1 }, ultimoAcceso: new Date() },
  });

  // ✅ Para WhatsApp / cliente: fuerza descarga si es PDF (evita el visor fallando)
  const isPdf = (doc.mime || "").toLowerCase().includes("pdf");

  const { url } = cloudinarySignedUrl({
    publicId: doc.publicId,
    resourceType: (doc.resourceType as any) || "raw",
    deliveryType: (doc.deliveryType as any) || "authenticated",
    expiresInSeconds: 60 * 20,
    attachment: isPdf, // ✅ descarga para PDFs
  });

  return NextResponse.redirect(url, 302);
}
