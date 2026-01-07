export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // ✅ En opción 1, cualquiera autenticado puede VER fondos (si quieres, lo limitamos)
  const filtro = req.nextUrl.searchParams.get("filtro") || "todos";

  const where: any = {};

  if (filtro === "ultimos7") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    where.creadoEn = { gte: d };
  }

  const fondos = await prisma.fondo.findMany({
    where,
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(fondos);
}

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // ✅ SOLO SUPERADMIN
  if (!ctx.isSuperadmin) {
    return NextResponse.json({ error: "Solo SUPERADMIN" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  const nombre = String(body?.nombre ?? "").trim();
  const url = String(body?.url ?? "").trim();

  if (!nombre || !url) {
    return NextResponse.json({ error: "Faltan campos (nombre, url)" }, { status: 400 });
  }

  const publicId = body?.publicId ? String(body.publicId) : null;
  const resourceType = body?.resourceType ? String(body.resourceType) : null;

  const bytes = Number.isFinite(Number(body?.bytes)) ? Number(body.bytes) : null;
  const width = Number.isFinite(Number(body?.width)) ? Number(body.width) : null;
  const height = Number.isFinite(Number(body?.height)) ? Number(body.height) : null;
  const format = body?.format ? String(body.format) : null;
  const mime = body?.mime ? String(body.mime) : null;

  try {
    const created = await prisma.fondo.create({
      data: {
        nombre,
        url,
        publicId,
        resourceType,
        bytes,
        width,
        height,
        format,
        mime,
      },
    });

    return NextResponse.json({ ok: true, fondo: created }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un fondo con esa URL (duplicado)." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error creando fondo" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // ✅ SOLO SUPERADMIN
  if (!ctx.isSuperadmin) {
    return NextResponse.json({ error: "Solo SUPERADMIN" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id = Number(body?.id);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const fondo = await prisma.fondo.findUnique({
    where: { id },
    select: { id: true, activo: true, publicId: true, resourceType: true },
  });

  if (!fondo) {
    return NextResponse.json({ error: "Fondo no encontrado" }, { status: 404 });
  }

  if (fondo.activo) {
    await prisma.fondo.update({ where: { id }, data: { activo: false } });
  }

  if (fondo.publicId) {
    try {
      await deleteFromCloudinary({
        publicId: fondo.publicId,
        resourceType: fondo.resourceType,
      });
    } catch (e) {
      console.error("Error borrando Cloudinary:", e);
    }
  }

  await prisma.fondo.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
