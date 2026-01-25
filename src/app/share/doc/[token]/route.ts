export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinarySignedUrl } from "@/lib/cloudinary-signed";

export async function GET(_req: Request, ctx: any) {
  const token = String(ctx?.params?.token || "").trim();
  if (!token) return NextResponse.json({ error: "Token no válido" }, { status: 400 });

  const doc = await prisma.leadDocumento.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      publicId: true,
      resourceType: true,
      deliveryType: true,
      shareExpiraEn: true,
    },
  });

  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  if (doc.shareExpiraEn && doc.shareExpiraEn.getTime() < Date.now()) {
    return NextResponse.json({ error: "Link caducado" }, { status: 410 });
  }

  await prisma.leadDocumento.update({
    where: { id: doc.id },
    data: {
      accesos: { increment: 1 },
      ultimoAcceso: new Date(),
    },
  });

  const { url } = cloudinarySignedUrl({
    publicId: doc.publicId,
    resourceType: (doc.resourceType as any) || "raw",
    deliveryType: (doc.deliveryType as any) || "authenticated",
    expiresInSeconds: 60 * 20,
    attachment: false,
  });

  return NextResponse.redirect(url);
}
