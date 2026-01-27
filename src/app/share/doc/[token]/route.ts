// src/app/share/doc/[token]/route.ts
// src/app/share/doc/[token]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinarySignedUrl } from "@/lib/cloudinary-signed";

function normalizePublicId(input: string) {
  return String(input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\.[a-z0-9]+$/i, "");
}

function extractFromCloudinaryUrl(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);

    // /<cloud_name>/<resource_type>/<type>/...
    const resourceType = (parts[1] || "raw") as "raw" | "image" | "video";
    const deliveryType = (parts[2] || "upload") as "upload" | "authenticated" | "private";

    const vPart = parts.find((p) => /^v\d+$/.test(p));
    const version = vPart ? Number(vPart.slice(1)) : undefined;

    const vIdx = parts.findIndex((p) => /^v\d+$/.test(p));
    const afterV = vIdx >= 0 ? parts.slice(vIdx + 1) : [];

    const last = afterV[afterV.length - 1] || "";
    const mExt = last.match(/^(.*)\.([a-z0-9]+)$/i);
    const format = mExt ? mExt[2].toLowerCase() : undefined;

    const fileNoExt = mExt ? mExt[1] : last;
    const folder = afterV.slice(0, -1);
    const publicId = [...folder, fileNoExt].join("/");

    return { resourceType, deliveryType, publicId, format, version };
  } catch {
    return null;
  }
}

async function fetchCloudinaryWithFallback(opts: {
  publicId: string;
  resourceType: "raw" | "image" | "video";
  deliveryType: "upload" | "authenticated" | "private";
  format?: string;
  version?: number;
}) {
  const attempt = async (dt: "upload" | "authenticated" | "private") => {
    const { url } = cloudinarySignedUrl({
      publicId: opts.publicId,
      resourceType: opts.resourceType,
      deliveryType: dt,
      attachment: false,
      format: opts.format,
      version: opts.version,
    });

    const r = await fetch(url, { cache: "no-store" });
    return { r, url, dt };
  };

  type Delivery = "upload" | "authenticated" | "private";

  const tries: Delivery[] =
    opts.deliveryType === "upload"
      ? ["upload", "authenticated", "private"]
      : opts.deliveryType === "authenticated"
      ? ["authenticated", "upload", "private"]
      : ["private", "authenticated", "upload"];


  let last = await attempt(tries[0]);

  for (const dt of tries) {
    last = await attempt(dt);
    if (last.r.ok) return last;
    // si es 401, probamos siguiente
    if (![401, 404].includes(last.r.status)) break;
  }

  return last; // devuelve el último intento real
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> }
): Promise<Response> {
  const { token } = await ctx.params;
  const t = String(token || "").trim();
  if (!t) return NextResponse.json({ error: "Token no válido" }, { status: 400 });

  const doc = await prisma.leadDocumento.findUnique({
    where: { shareToken: t },
    select: {
      id: true,
      nombre: true,
      url: true,
      publicId: true,
      resourceType: true,
      deliveryType: true, // ✅ MUY IMPORTANTE
      mime: true,
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

  const fromUrl = doc.url ? extractFromCloudinaryUrl(doc.url) : null;

  const publicId = normalizePublicId(doc.publicId || fromUrl?.publicId || "");
  if (!publicId) return NextResponse.json({ error: "Documento sin publicId" }, { status: 500 });

  const rt = ((doc.resourceType as any) || fromUrl?.resourceType || "raw") as "raw" | "image" | "video";

  // ✅ aquí está la clave: si no hay deliveryType en BD, inferimos por URL,
  // y si no existe, asumimos authenticated (más seguro)
  const dt = ((doc.deliveryType as any) || fromUrl?.deliveryType || "authenticated") as
    | "upload"
    | "authenticated"
    | "private";

  const { r, dt: usedDt } = await fetchCloudinaryWithFallback({
    publicId,
    resourceType: rt,
    deliveryType: dt,
    format: fromUrl?.format,
    version: fromUrl?.version,
  });

  if (!r.ok) {
    return NextResponse.json(
      { error: "No se pudo descargar de Cloudinary", status: r.status, usedDeliveryType: usedDt },
      { status: 502 }
    );
  }


  const contentType = doc.mime || r.headers.get("content-type") || "application/octet-stream";

  return new Response(r.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // ✅ descarga siempre (evita el bug de Chrome con raw PDFs)
      "Content-Disposition": `attachment; filename="${doc.nombre || "documento"}"`,
      "Cache-Control": "no-store",
    },
  });
}
