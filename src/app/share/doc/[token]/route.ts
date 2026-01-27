// src/app/share/doc/[token]/route.ts
export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinarySignedUrl } from "@/lib/cloudinary-signed";

function inferFormatFromMimeOrName(mime?: string | null, name?: string | null) {
  const m = (mime || "").toLowerCase();
  if (m.includes("pdf")) return "pdf";
  if (m.startsWith("image/")) return m.split("/")[1] || undefined;

  const n = (name || "").toLowerCase();
  const mExt = n.match(/\.([a-z0-9]+)$/i);
  return mExt ? mExt[1] : undefined;
}

function normalizePublicId(input: string) {
  return String(input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\.[a-z0-9]+$/i, "");
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const t = String(token || "").trim();
  if (!t) return NextResponse.json({ error: "Token no válido" }, { status: 400 });

  const doc = await prisma.leadDocumento.findUnique({
    where: { shareToken: t },
    select: {
      id: true,
      nombre: true,
      mime: true,
      url: true,
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
    data: { accesos: { increment: 1 }, ultimoAcceso: new Date() },
  });

  // ✅ CAMBIO CLAVE: si es público, no firmamos nada
  if (doc.deliveryType === "upload") {
    if (!doc.url) return NextResponse.json({ error: "Documento sin url" }, { status: 500 });
    return NextResponse.redirect(doc.url, { status: 302 });
  }

  // (legacy) si algún día vuelves a authenticated:
  const publicId = normalizePublicId(doc.publicId || "");
  if (!publicId) return NextResponse.json({ error: "Documento sin publicId válido" }, { status: 500 });

  const resourceType = ((doc.resourceType as any) || "raw") as "raw" | "image" | "video";
  const deliveryType = ((doc.deliveryType as any) || "authenticated") as "authenticated" | "private" | "upload";
  const format = inferFormatFromMimeOrName(doc.mime, doc.nombre);

  const { url } = cloudinarySignedUrl({
    publicId,
    resourceType,
    deliveryType: deliveryType === "upload" ? "authenticated" : deliveryType,
    format,
    expiresInSeconds: 60 * 20,
    attachment: false,
  });

  return NextResponse.redirect(url, { status: 302 });
}
