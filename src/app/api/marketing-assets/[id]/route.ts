import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { deleteFromCloudinary, UploadResourceType } from "@/lib/cloudinary";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function getRole(session: Session | null): Rol | null {
  return ((session?.user as any)?.role ?? null) as Rol | null;
}

function toResourceType(v?: string | null): UploadResourceType | null {
  if (!v) return null;
  if (v === "image" || v === "video" || v === "raw") return v;
  return null;
}

// ✅ Next 15: params puede venir como Promise
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No auth" }, { status: 401 });

    const role = getRole(session);
    const canManage = role === "ADMIN" || role === "SUPERADMIN";
    if (!canManage) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const assetId = Number(id);
    if (!Number.isFinite(assetId) || assetId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // tenant opcional
    const { searchParams } = new URL(req.url);
    const adminIdParam = searchParams.get("adminId");
    const adminId = adminIdParam ? Number(adminIdParam) : null;

    // 1) Buscar asset
    const asset = await prisma.marketingAsset.findFirst({
      where:
        role === "SUPERADMIN" && adminId && Number.isFinite(adminId)
          ? { id: assetId, adminId }
          : { id: assetId },
      select: { id: true, publicId: true, resourceType: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    // 2) Borrar en Cloudinary si aplica
    if (asset.publicId) {
      const rt = toResourceType(asset.resourceType) ?? "image";
      const res = await deleteFromCloudinary({
        publicId: asset.publicId,
        resourceType: rt,
      });

      // Cloudinary suele devolver "ok" o "not found"
      if (res.result !== "ok" && res.result !== "not found") {
        return NextResponse.json(
          { error: `Cloudinary delete falló: ${res.result}` },
          { status: 500 }
        );
      }
    }

    // 3) Borrar en BD
    await prisma.marketingAsset.delete({ where: { id: assetId } });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
