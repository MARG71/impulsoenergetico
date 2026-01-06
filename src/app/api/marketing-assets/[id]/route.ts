import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Prisma } from "@prisma/client";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function getRole(session: Session | null): Rol | null {
  const role = (session?.user as { role?: Rol } | undefined)?.role;
  return role ?? null;
}

// ✅ Next 15: ctx.params puede venir como Promise en builds strict
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

    const where: Prisma.MarketingAssetWhereUniqueInput = { id: assetId };

    // Si quieres “tenant strict” en delete, hazlo con findFirst + delete
    // porque delete({ where }) solo acepta unique.
    // Así evitamos “líneas rojas” y controlamos tenant:
    if (role === "SUPERADMIN" && adminId && Number.isFinite(adminId)) {
      const existing = await prisma.marketingAsset.findFirst({
        where: { id: assetId, adminId },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
    }

    await prisma.marketingAsset.delete({ where });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
