export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!ctx.isAdmin && !ctx.isSuperadmin) {
    return NextResponse.json({ error: "Solo ADMIN o SUPERADMIN" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id = Number(body?.id);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const exists = await prisma.fondo.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: "Fondo no encontrado" }, { status: 404 });
  }

  await prisma.fondo.updateMany({ data: { activo: false } });
  const updated = await prisma.fondo.update({ where: { id }, data: { activo: true } });

  return NextResponse.json({ ok: true, fondo: updated });
}
