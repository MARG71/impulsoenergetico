export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const filtro = req.nextUrl.searchParams.get("filtro") || "todos";

  const where: any = {};

  // 🔎 filtro últimos 7 días
  if (filtro === "ultimos7") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    where.creadoEn = { gte: d };
  }

  // ✅ Si tu modelo Fondo tiene adminId y quieres multi-tenant, descomenta:
  // if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;

  const fondos = await prisma.fondo.findMany({
    where,
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(fondos);
}

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!ctx.isAdmin && !ctx.isSuperadmin) {
    return NextResponse.json({ error: "Solo ADMIN o SUPERADMIN" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const nombre = String(body?.nombre ?? "").trim();
  const url = String(body?.url ?? "").trim();

  if (!nombre || !url) {
    return NextResponse.json({ error: "Faltan campos (nombre, url)" }, { status: 400 });
  }

  const created = await prisma.fondo.create({
    data: {
      nombre,
      url,
      // ✅ Si tu modelo Fondo tiene adminId:
      // adminId: ctx.tenantAdminId ?? null,
    },
  });

  return NextResponse.json({ ok: true, fondo: created }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
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

  // Si el fondo estaba activo, lo desactivamos antes de borrar
  await prisma.fondo.updateMany({ where: { id }, data: { activo: false } });

  await prisma.fondo.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
