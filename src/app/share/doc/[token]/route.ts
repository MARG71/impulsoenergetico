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
  return mExt ? mExt[1].toLowerCase() : undefined;
}

function normalizePublicId(input: string) {
  return String(input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\.[a-z0-9]+$/i, ""); // quita .pdf, .png...
}

function extractFromCloudinaryUrl(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);

    // /<cloud>/<rt>/<type>/.../v123/<publicId>.<ext>
    const resourceType = (parts[1] || "raw") as "raw" | "image" | "video";
    const deliveryType = (parts[2] || "upload") as "upload" | "authenticated" | "private";

    const vIdx = parts.findIndex((p) => /^v\d+$/.test(p));
    const afterV = vIdx >= 0 ? parts.slice(vIdx + 1) : [];

    const last = afterV[afterV.length - 1] || "";
    const mExt = last.match(/^(.*)\.([a-z0-9]+)$/i);
    const format = mExt ? mExt[2].toLowerCase() : undefined;

    const fileNoExt = mExt ? mExt[1] : last;
    const folder = afterV.slice(0, -1);
    const publicId = [...folder, fileNoExt].join("/");

    return { resourceType, deliveryType, publicId, format };
  } catch {
    return null;
  }
}

function pickHeadersForProxy(res: Response) {
  const h = new Headers();

  // Headers importantes para PDF + Range
  const keep = [
    "content-type",
    "content-length",
    "accept-ranges",
    "content-range",
    "etag",
    "last-modified",
    "cache-control",
  ];

  for (const k of keep) {
    const v = res.headers.get(k);
    if (v) h.set(k, v);
  }

  // Evita cache raro
  h.set("Cache-Control", "no-store");

  return h;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
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

  // Derivamos datos si vienen “raros”
  const fromUrl = doc.url ? extractFromCloudinaryUrl(doc.url) : null;

  const publicId = normalizePublicId(doc.publicId || fromUrl?.publicId || "");
  if (!publicId) return NextResponse.json({ error: "Documento sin publicId" }, { status: 500 });

  const resourceType = ((doc.resourceType as any) || fromUrl?.resourceType || "raw") as "raw" | "image" | "video";
  const deliveryType = ((doc.deliveryType as any) || fromUrl?.deliveryType || "authenticated") as
    | "authenticated"
    | "private"
    | "upload";

  const format = inferFormatFromMimeOrName(doc.mime, doc.nombre) || fromUrl?.format;

  // 1) Generamos URL firmada (aunque luego hagamos proxy)
  const signed = cloudinarySignedUrl({
    publicId,
    resourceType,
    deliveryType, // si tu asset está protegido, aquí es donde tiene que estar correcto
    format,
    expiresInSeconds: 60 * 20,
    attachment: false,
  });

  // 2) Proxy con soporte Range (imprescindible)
  const range = req.headers.get("range") || undefined;

  const upstream = await fetch(signed.url, {
    headers: range ? { range } : undefined,
    // next: { revalidate: 0 } // opcional
  });

  if (!upstream.ok && upstream.status !== 206) {
    // Devuelve info útil
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: "Cloudinary upstream error", status: upstream.status, body: text.slice(0, 500) },
      { status: 502 }
    );
  }

  const headers = pickHeadersForProxy(upstream);

  // Forzamos content-type si falta
  if (!headers.get("content-type")) {
    headers.set("content-type", doc.mime || "application/octet-stream");
  }

  // Inline para visor PDF
  const safeName = (doc.nombre || "documento").replace(/"/g, "");
  headers.set("Content-Disposition", `inline; filename="${safeName}"`);

  return new Response(upstream.body, {
    status: upstream.status, // 200 o 206
    headers,
  });
}
