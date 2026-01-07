export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { deleteFromCloudinary, UploadResourceType } from "@/lib/cloudinary";

function toResourceType(v?: string | null): UploadResourceType {
  if (v === "image" || v === "video" || v === "raw") return v;
  return "image";
}

export async function DELETE(req: NextRequest, ctx2: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!ctx.isAdmin && !ctx.isSuperadmin) {
    return NextResponse.json({ error: "Solo ADMIN o SUPERADMIN" }, { status: 403 });
  }

  const { id } = await ctx2.params;
  const assetId = Number(id);
  if (!Number.isFinite(assetId) || assetId <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  // SUPERADMIN modo tenant opcional (?adminId=...)
  const adminIdParam = req.nextUrl.searchParams.get("adminId");
  const adminId = adminIdParam ? Number(adminIdParam) : null;

  const effectiveAdminId =
    ctx.isSuperadmin && adminId && Number.isFinite(adminId) && adminId > 0
      ? adminId
      : ctx.tenantAdminId ?? null;

  // 1) Buscar asset con filtro tenant si aplica
  const asset = await prisma.marketingAsset.findFirst({
    where: effectiveAdminId ? { id: assetId, adminId: effectiveAdminId } : { id: assetId },
    select: { id: true, publicId: true, resourceType: true },
  });

  if (!asset) {
    return NextResponse.json({ error: "No encontrado o sin permisos" }, { status: 404 });
  }

  // 2) Borrar en Cloudinary si hay publicId
  if (asset.publicId) {
    try {
      const rt = toResourceType(asset.resourceType);
      const res = await deleteFromCloudinary({ publicId: asset.publicId, resourceType: rt });
      // aceptamos ok o not found
      if (res?.result !== "ok" && res?.result !== "not found") {
        return NextResponse.json(
          { error: `Cloudinary delete falló: ${String(res?.result ?? "unknown")}` },
          { status: 500 }
        );
      }
    } catch (e) {
      console.error("Cloudinary delete error:", e);
      // si falla cloudinary, no bloqueamos borrado BD (como fondos)
    }
  }

  // 3) Borrar en BD
  await prisma.marketingAsset.delete({ where: { id: assetId } });

  return NextResponse.json({ ok: true });
}
