export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = safeNumber(params.id);
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  const archivoUrl = body?.archivoUrl ? String(body.archivoUrl) : null;
  const archivoPublicId = body?.archivoPublicId ? String(body.archivoPublicId) : null;
  const archivoResourceType = body?.archivoResourceType
    ? String(body.archivoResourceType)
    : null;
  const archivoMime = body?.archivoMime ? String(body.archivoMime) : null;

  const archivoBytes = Number.isFinite(Number(body?.archivoBytes))
    ? Number(body.archivoBytes)
    : null;

  const archivoFormat = body?.archivoFormat ? String(body.archivoFormat) : null;

  if (!archivoUrl) {
    return NextResponse.json(
      { error: "archivoUrl requerido" },
      { status: 400 }
    );
  }

  const userId = (ctx as any).userId
    ? Number((ctx as any).userId)
    : null;

  const existing = await prisma.cartelGenerado.findUnique({
    where: { id },
    select: { id: true, creadoPorId: true, adminId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // 🔐 Seguridad
  if (!ctx.isSuperadmin) {
    if (!userId || existing.creadoPorId !== userId) {
      return NextResponse.json({ error: "No permitido" }, { status: 403 });
    }

    if (
      (ctx as any).adminId &&
      existing.adminId &&
      existing.adminId !== (ctx as any).adminId
    ) {
      return NextResponse.json({ error: "No permitido" }, { status: 403 });
    }
  }

  const updated = await prisma.cartelGenerado.update({
    where: { id },
    data: {
      archivoUrl,
      archivoPublicId,
      archivoResourceType,
      archivoMime,
      archivoBytes,
      archivoFormat,
    },
  });

  return NextResponse.json({ ok: true, cartel: updated });
}
