export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return jsonError("No autorizado", 401);

  if (!ctx.isAdmin && !ctx.isSuperadmin) {
    return jsonError("Solo ADMIN o SUPERADMIN", 403);
  }

  const body = await req.json().catch(() => ({} as any));
  const assetId = Number(body?.id);
  if (!Number.isFinite(assetId) || assetId <= 0) return jsonError("id inválido");

  // SUPERADMIN modo tenant opcional: adminId puede venir en body o query
  const adminIdFromBody = body?.adminId != null ? Number(body.adminId) : null;
  const adminIdFromQuery = req.nextUrl.searchParams.get("adminId");
  const adminIdQuery = adminIdFromQuery ? Number(adminIdFromQuery) : null;

  const effectiveAdminId =
    ctx.isSuperadmin &&
    ((adminIdFromBody && Number.isFinite(adminIdFromBody) && adminIdFromBody > 0 && adminIdFromBody) ||
      (adminIdQuery && Number.isFinite(adminIdQuery) && adminIdQuery > 0 && adminIdQuery) ||
      null)
      ? (adminIdFromBody && Number.isFinite(adminIdFromBody) && adminIdFromBody > 0
          ? adminIdFromBody
          : adminIdQuery)
      : ctx.tenantAdminId ?? null;

  // 1) localizar asset (filtrando tenant si aplica)
  const asset = await prisma.marketingAsset.findFirst({
    where: effectiveAdminId ? { id: assetId, adminId: effectiveAdminId } : { id: assetId },
    select: { id: true, lugarId: true, tipo: true, adminId: true },
  });

  if (!asset) return jsonError("Asset no encontrado o sin permisos", 404);

  // Solo activamos imágenes (para preview)
  if (asset.tipo !== "IMAGE") return jsonError("Solo se puede activar tipo IMAGE");

  // 2) Dejar todas las IMAGES de ese lugar como inactivas y activar la elegida
  await prisma.$transaction([
    prisma.marketingAsset.updateMany({
      where: {
        lugarId: asset.lugarId,
        tipo: "IMAGE",
        ...(effectiveAdminId ? { adminId: effectiveAdminId } : {}),
      },
      data: { activo: false },
    }),
    prisma.marketingAsset.update({
      where: { id: asset.id },
      data: { activo: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
