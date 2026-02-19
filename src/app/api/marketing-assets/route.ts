//src/app/api/marketing-assets/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { MarketingTipo, Prisma } from "@prisma/client";

function isValidUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function normalizeTipo(v: any): MarketingTipo | null {
  const s = String(v ?? "").toUpperCase();
  if (s === "IMAGE") return MarketingTipo.IMAGE;
  if (s === "VIDEO") return MarketingTipo.VIDEO;
  if (s === "PDF") return MarketingTipo.PDF;
  return null;
}

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lugarId = Number(searchParams.get("lugarId"));
  if (!Number.isFinite(lugarId) || lugarId <= 0) {
    return NextResponse.json({ error: "lugarId requerido" }, { status: 400 });
  }

  // SUPERADMIN modo tenant opcional
  const adminIdParam = searchParams.get("adminId");
  const adminId = adminIdParam ? Number(adminIdParam) : null;

  // Resolver el adminId efectivo
  const effectiveAdminId =
    ctx.isSuperadmin && adminId && Number.isFinite(adminId) && adminId > 0
      ? adminId
      : ctx.tenantAdminId ?? null;

  // 1) Validar que el lugar pertenece al tenant (si aplica)
  const lugar = await prisma.lugar.findFirst({
    where: effectiveAdminId ? { id: lugarId, adminId: effectiveAdminId } : { id: lugarId },
    select: { id: true, adminId: true, agenteId: true },
  });

  if (!lugar) {
    return NextResponse.json({ error: "Lugar no encontrado o sin permisos" }, { status: 404 });
  }

  const where: Prisma.MarketingAssetWhereInput = {
    lugarId,
  };

  // Si estamos en tenant, filtramos
  if (effectiveAdminId) where.adminId = effectiveAdminId;

  const assets = await prisma.marketingAsset.findMany({
    where,
    orderBy: { creadaEn: "desc" },
    select: {
      id: true,
      tipo: true,
      url: true,
      nombre: true,
      publicId: true,
      resourceType: true,
      mime: true,
      size: true,
      creadaEn: true,
      lugarId: true,
      adminId: true,
      agenteId: true,
      activo: true,
    },
  });


  return NextResponse.json({ assets });
}

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!ctx.isAdmin && !ctx.isSuperadmin) {
    return NextResponse.json({ error: "Solo ADMIN o SUPERADMIN" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as any;

  const lugarId = Number(body?.lugarId);
  const url = String(body?.url ?? "").trim();
  const tipo = normalizeTipo(body?.tipo);

  if (!Number.isFinite(lugarId) || lugarId <= 0 || !url || !tipo) {
    return NextResponse.json(
      { error: "Faltan campos (lugarId, tipo, url)" },
      { status: 400 }
    );
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: "URL inválida (debe ser http/https)" }, { status: 400 });
  }

  // SUPERADMIN modo tenant opcional
  const adminIdFromBody = body?.adminId != null ? Number(body.adminId) : null;
  const effectiveAdminId =
    ctx.isSuperadmin && adminIdFromBody && Number.isFinite(adminIdFromBody) && adminIdFromBody > 0
      ? adminIdFromBody
      : ctx.tenantAdminId ?? null;

  // 1) Validar lugar pertenece al tenant
  const lugar = await prisma.lugar.findFirst({
    where: effectiveAdminId ? { id: lugarId, adminId: effectiveAdminId } : { id: lugarId },
    select: { id: true, adminId: true, agenteId: true },
  });

  if (!lugar) {
    return NextResponse.json({ error: "Lugar no encontrado o sin permisos" }, { status: 404 });
  }

  const data: Prisma.MarketingAssetUncheckedCreateInput = {
    lugarId,
    tipo,
    url,
    nombre: body?.nombre ? String(body.nombre) : null,

    publicId: body?.publicId ? String(body.publicId) : null,
    resourceType: body?.resourceType ? String(body.resourceType) : null,
    mime: body?.mime ? String(body.mime) : null,
    size: Number.isFinite(Number(body?.size)) ? Number(body.size) : null,

    adminId: effectiveAdminId,
    agenteId: lugar.agenteId ?? null, // ✅ trazabilidad automática por lugar
  };

  const created = await prisma.marketingAsset.create({ data });
  return NextResponse.json({ ok: true, created }, { status: 201 });
}
