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
  const cleaned = v.replace(/^([a-z0-9_-]+)\/(raw|image|video)\//i, "");

  // publicId NO debe incluir upload/authenticated/private ni v123 ni extensión
  return cleaned
    .replace(/^(upload|authenticated|private)\//i, "")
    .replace(/^v\d+\//i, "")
    .replace(/\.[a-z0-9]+$/i, "");
}

function extFromName(name: string) {
  const m = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : null;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> } // ✅ Next 15: params Promise
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
      nombre: true,
      mime: true,
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

  // ✅ Robustez: si publicId está mal, derivarlo de url
  const publicId = normalizePublicId(doc.publicId) || normalizePublicId(doc.url || "");
  if (!publicId) return NextResponse.json({ error: "Documento sin publicId válido" }, { status: 500 });

  const resourceType = ((doc.resourceType as any) || "raw") as "raw" | "image" | "video";
  const deliveryType = ((doc.deliveryType as any) || "authenticated") as "authenticated" | "private" | "upload";

  // ✅ CLAVE: si es PDF, forzar format="pdf" para evitar 404 (URL sin .pdf)
  const ext = extFromName(doc.nombre || "");
  const isPdf = doc.mime === "application/pdf" || ext === "pdf";
  const format = isPdf ? "pdf" : ext || undefined;

  const { url } = cloudinarySignedUrl({
    publicId,
    resourceType,
    deliveryType,
    expiresInSeconds: 60 * 20, // 20 min
    attachment: false,
    format, // ✅
  });

  return NextResponse.redirect(url, { status: 302 });
}
