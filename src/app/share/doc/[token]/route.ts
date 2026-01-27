// src/app/share/doc/[token]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import https from "https";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;

  const doc = await prisma.leadDocumento.findUnique({
    where: { shareToken: token },
    select: {
      nombre: true,
      publicId: true,
      resourceType: true,
      shareExpiraEn: true,
    },
  });

  if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (doc.shareExpiraEn && doc.shareExpiraEn < new Date()) {
    return NextResponse.json({ error: "Link caducado" }, { status: 410 });
  }

  // 🔐 URL privada firmada SERVER-SIDE
  const signedUrl = cloudinary.url(doc.publicId, {
    resource_type: doc.resourceType as any,
    secure: true,
    sign_url: true,
  });

  // ⬇️ Descargamos desde Cloudinary y lo reenviamos
  return new Promise((resolve) => {
    https.get(signedUrl, (cloudRes) => {
      const headers = new Headers();
      headers.set("Content-Type", "application/pdf");
      headers.set(
        "Content-Disposition",
        `inline; filename="${doc.nombre}"`
      );

      resolve(
        new Response(cloudRes as any, {
          status: 200,
          headers,
        })
      );
    });
  });
}
