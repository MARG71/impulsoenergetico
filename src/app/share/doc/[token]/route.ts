// src/app/share/doc/[token]/route.ts
export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinarySignedUrl } from "@/lib/cloudinary-signed";

/**
 * Normaliza publicId por si en BD quedó mal guardado (legacy).
 * - Si viene una URL completa, extrae el publicId real
 * - Si viene con prefijos raros, intenta limpiarlo
 */
function normalizePublicId(input: string) {
  const v = String(input || "").trim();
  if (!v) return "";

  // Si alguien guardó la URL entera por error:
  if (v.startsWith("http://") || v.startsWith("https://")) {
    try {
      const u = new URL(v);
      const parts = u.pathname.split("/").filter(Boolean);

      // Ej típicos:
      // /raw/authenticated/v123/impulso/leads/25/file.pdf
      // /image/upload/v123/folder/file.jpg
      const vIdx = parts.findIndex((p) => /^v\d+$/.test(p));
      const afterV = vIdx >= 0 ? parts.slice(vIdx + 1) : parts.slice(3);

      const last = afterV[afterV.length - 1] || "";
      const mExt = last.match(/^(.*)\.([a-z0-9]+)$/i);
      const fileNoExt = mExt ? mExt[1] : last;

      const folder = afterV.slice(0, -1);
      return [...folder, fileNoExt].join("/");
    } catch {
      return "";
    }
  }

  // Si por error se guardó con cloudname dentro (raro, pero lo hemos visto)
  // ej: "dtyiwnllo/raw/authenticated/v1/impulso/leads/25/file"
  // lo limpiamos:
  const cleaned = v.replace(/^([a-z0-9_-]+)\/(raw|image|video)\//i, "");
  // si aún trae "authenticated/v123/..." lo dejamos, porque publicId NO debe tener eso
  // solo debe ser "impulso/leads/25/file"
  return cleaned
    .replace(/^(upload|authenticated|private)\//i, "")
    .replace(/^v\d+\//i, "")
    .replace(/\.[a-z0-9]+$/i, "");
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> } // ✅ Next 15: params como Promise
) {
  const { token } = await ctx.params;
  const t = String(token || "").trim();

  if (!t) return NextResponse.json({ error: "Token no válido" }, { status: 400 });

  const doc = await prisma.leadDocumento.findUnique({
    where: { shareToken: t },
    select: {
      id: true,
      publicId: true,
      url: true,
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

  // ✅ Robustez: si publicId está mal, intentar derivarlo de url
  const publicId = normalizePublicId(doc.publicId) || normalizePublicId(doc.url || "");
  if (!publicId) return NextResponse.json({ error: "Documento sin publicId válido" }, { status: 500 });

  const resourceType = ((doc.resourceType as any) || "raw") as "raw" | "image" | "video";
  const deliveryType = ((doc.deliveryType as any) || "authenticated") as "authenticated" | "private" | "upload";

  const { url } = cloudinarySignedUrl({
    publicId,
    resourceType,
    deliveryType,
    expiresInSeconds: 60 * 20, // 20 min
    attachment: false,
  });

  // Redirección 302 al URL firmado de Cloudinary
  return NextResponse.redirect(url, { status: 302 });
}
