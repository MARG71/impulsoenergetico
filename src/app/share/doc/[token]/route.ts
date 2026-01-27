// src/app/share/doc/[token]/route.ts
export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> } // ✅ Next 15
) {
  const { token } = await ctx.params;
  const t = String(token || "").trim();

  if (!t) return NextResponse.json({ error: "Token no válido" }, { status: 400 });

  const doc = await prisma.leadDocumento.findUnique({
    where: { shareToken: t },
    select: {
      id: true,
      url: true,
      shareExpiraEn: true,
    },
  });

  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

  if (doc.shareExpiraEn && doc.shareExpiraEn.getTime() < Date.now()) {
    return NextResponse.json({ error: "Link caducado" }, { status: 410 });
  }

  if (!doc.url) {
    return NextResponse.json({ error: "Documento sin URL" }, { status: 500 });
  }

  // tracking
  await prisma.leadDocumento.update({
    where: { id: doc.id },
    data: {
      accesos: { increment: 1 },
      ultimoAcceso: new Date(),
    },
  });

  return NextResponse.redirect(doc.url, { status: 302 });
}
