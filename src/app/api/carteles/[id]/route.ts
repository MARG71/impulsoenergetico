export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { v2 as cloudinary } from "cloudinary";

function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function ensureCloudinary() {
  // ✅ Evita fallos en Vercel
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });
}

async function tryCloudinaryDelete(publicId: string, resourceType?: string | null) {
  try {
    ensureCloudinary();
    const rt = (resourceType || "raw") as any; // image | video | raw
    await cloudinary.uploader.destroy(publicId, { resource_type: rt });
  } catch (e) {
    console.warn("Cloudinary delete failed:", e);
  }
}

// ✅ PATCH (asociar archivo al historial) — forma más compatible con Next 15
export async function PATCH(req: NextRequest, context: any) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const params = context?.params ?? {};
  const id = safeNumber(params?.id);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => ({}));

  const archivoUrl = body?.archivoUrl ? String(body.archivoUrl) : null;
  if (!archivoUrl) return NextResponse.json({ error: "archivoUrl requerido" }, { status: 400 });

  const archivoPublicId = body?.archivoPublicId ? String(body.archivoPublicId) : null;
  const archivoResourceType = body?.archivoResourceType ? String(body.archivoResourceType) : null;
  const archivoMime = body?.archivoMime ? String(body.archivoMime) : null;

  const archivoBytes = Number.isFinite(Number(body?.archivoBytes)) ? Number(body.archivoBytes) : null;
  const archivoFormat = body?.archivoFormat ? String(body.archivoFormat) : null;

  const userId = (ctx as any).userId ? Number((ctx as any).userId) : null;

  const existing = await prisma.cartelGenerado.findUnique({
    where: { id },
    select: { id: true, creadoPorId: true, adminId: true },
  });

  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // seguridad: si no eres superadmin, solo el que lo creó
  if (!ctx.isSuperadmin) {
    if (!userId || existing.creadoPorId !== userId) {
      return NextResponse.json({ error: "No permitido" }, { status: 403 });
    }
    if ((ctx as any).adminId && existing.adminId && existing.adminId !== (ctx as any).adminId) {
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

// ✅ DELETE (borra historial y si hay archivo, borra Cloudinary)
export async function DELETE(req: NextRequest, context: any) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Solo ADMIN/SUPERADMIN
  const role = (ctx as any)?.role as string | undefined;
  if (!ctx.isSuperadmin && role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const params = context?.params ?? {};
  const id = safeNumber(params?.id);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const existing = await prisma.cartelGenerado.findUnique({
    where: { id },
    select: {
      id: true,
      adminId: true,
      archivoPublicId: true,
      archivoResourceType: true,
    },
  });

  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Tenant guard si aplica
  if (
    !ctx.isSuperadmin &&
    (ctx as any).adminId &&
    existing.adminId &&
    existing.adminId !== (ctx as any).adminId
  ) {
    return NextResponse.json({ error: "No permitido" }, { status: 403 });
  }

  // 1) borrar en Cloudinary si procede
  if (existing.archivoPublicId) {
    await tryCloudinaryDelete(existing.archivoPublicId, existing.archivoResourceType);
  }

  // 2) borrar en BD
  await prisma.cartelGenerado.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
