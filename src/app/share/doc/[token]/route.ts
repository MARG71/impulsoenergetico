// src/app/share/doc/[token]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";

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
      publicId: true,
      resourceType: true,
      mime: true,
      shareExpiraEn: true,
    },
  });

  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

  if (doc.shareExpiraEn && doc.shareExpiraEn.getTime() < Date.now()) {
    return NextResponse.json({ error: "Link caducado" }, { status: 410 });
  }

  // logging de accesos
  await prisma.leadDocumento.update({
    where: { id: doc.id },
    data: { accesos: { increment: 1 }, ultimoAcceso: new Date() },
  });

  if (!doc.publicId) {
    return NextResponse.json({ error: "Documento sin publicId" }, { status: 500 });
  }

  // ✅ Generamos URL firmada SERVER-SIDE
  const signedUrl = cloudinary.url(doc.publicId, {
    resource_type: (doc.resourceType as any) || "raw",
    secure: true,
    sign_url: true,
  });

  // ✅ Bajamos el archivo en el servidor
  const r = await fetch(signedUrl, { cache: "no-store" });

  if (!r.ok) {
    return NextResponse.json(
      { error: "No se pudo descargar de Cloudinary", status: r.status },
      { status: 502 }
    );
  }

  // ✅ Devolvemos el stream al navegador
  const contentType =
    doc.mime || r.headers.get("content-type") || "application/pdf";

  return new Response(r.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // inline = abre en navegador; attachment = fuerza descarga
      "Content-Disposition": `inline; filename="${doc.nombre || "documento.pdf"}"`,
      "Cache-Control": "no-store",
    },
  });
}
