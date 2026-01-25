// src/app/share/doc/[token]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinarySignedUrl } from "@/lib/cloudinary-signed";

type ResourceType = "raw" | "image" | "video";
type DeliveryType = "authenticated" | "private" | "upload";

function asResourceType(v: unknown): ResourceType {
  const s = String(v || "").toLowerCase();
  if (s === "image" || s === "video" || s === "raw") return s as ResourceType;
  return "raw";
}

function asDeliveryType(v: unknown): DeliveryType {
  const s = String(v || "").toLowerCase();
  if (s === "authenticated" || s === "private" || s === "upload") return s as DeliveryType;
  return "authenticated";
}

function htmlPage(title: string, message: string) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;background:#0b1220;color:#e5e7eb}
    .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{max-width:520px;width:100%;background:rgba(15,23,42,.85);border:1px solid rgba(148,163,184,.25);border-radius:22px;padding:22px;box-shadow:0 0 24px rgba(0,0,0,.35)}
    h1{margin:0 0 8px;font-size:20px}
    p{margin:0;color:#cbd5e1;line-height:1.4}
    .muted{margin-top:14px;font-size:13px;color:#94a3b8}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>${title}</h1>
      <p>${message}</p>
      <p class="muted">Impulso Energético</p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest, ctx: { params: { token?: string } }) {
  try {
    const token = String(ctx?.params?.token || "").trim();
    if (!token) {
      return new NextResponse(htmlPage("Enlace inválido", "El enlace no es válido o está incompleto."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

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

    if (!doc) {
      return new NextResponse(
        htmlPage("Documento no encontrado", "Este documento no existe o el enlace es incorrecto."),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    if (doc.shareExpiraEn && doc.shareExpiraEn.getTime() < Date.now()) {
      return new NextResponse(
        htmlPage("Enlace caducado", "Este enlace ha caducado. Solicita uno nuevo a tu asesor."),
        { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // tracking (no bloqueante)
    await prisma.leadDocumento.update({
      where: { id: doc.id },
      data: {
        accesos: { increment: 1 },
        ultimoAcceso: new Date(),
      },
    });

    // ✅ Normalizamos tipos
    const resourceType = asResourceType(doc.resourceType);
    const deliveryType = asDeliveryType(doc.deliveryType);

    // ✅ Generamos URL firmada corta (20 min)
    const { url } = cloudinarySignedUrl({
      publicId: doc.publicId,
      resourceType,
      deliveryType,
      expiresInSeconds: 60 * 20,
      attachment: false,
    });

    // Seguridad extra: si Cloudinary devolviera una URL rara
    if (!url || typeof url !== "string" || !url.startsWith("https://")) {
      return new NextResponse(
        htmlPage("Error abriendo documento", "No se pudo generar el acceso al documento. Inténtalo de nuevo en unos minutos."),
        { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // ✅ Redirigir
    return NextResponse.redirect(url, { status: 302 });
  } catch (e) {
    console.error("share/doc token error:", e);
    return new NextResponse(
      htmlPage("Error", "Ha ocurrido un error al abrir el documento. Inténtalo más tarde."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
