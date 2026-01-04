import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function getRole(session: any): Rol | null {
  return ((session?.user as any)?.role ?? null) as Rol | null;
}

export async function DELETE(
  req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ error: "No auth" }, { status: 401 });

    const role = getRole(session);
    const canManage = role === "ADMIN" || role === "SUPERADMIN";
    if (!canManage) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const assetId = Number(ctx.params.id);
    if (!assetId || Number.isNaN(assetId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const adminIdParam = searchParams.get("adminId");
    const adminId = adminIdParam ? Number(adminIdParam) : null;

    const where: any = { id: assetId };
    if (role === "SUPERADMIN" && adminId && Number.isFinite(adminId)) {
      where.adminId = adminId;
    }

    await prisma.marketingAsset.delete({ where });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
