import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function getRole(session: any): Rol | null {
  return ((session?.user as any)?.role ?? null) as Rol | null;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ error: "No auth" }, { status: 401 });

    const role = getRole(session);

    const { searchParams } = new URL(req.url);
    const lugarId = Number(searchParams.get("lugarId"));
    const adminIdParam = searchParams.get("adminId");
    const adminId = adminIdParam ? Number(adminIdParam) : null;

    if (!lugarId || Number.isNaN(lugarId)) {
      return NextResponse.json({ error: "lugarId requerido" }, { status: 400 });
    }

    const where: any = { lugarId };
    if (role === "SUPERADMIN" && adminId && Number.isFinite(adminId)) {
      where.adminId = adminId;
    }

    const assets = await prisma.marketingAsset.findMany({
      where,
      orderBy: { creadaEn: "desc" },
    });

    return NextResponse.json({ assets });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ error: "No auth" }, { status: 401 });

    const role = getRole(session);
    const canManage = role === "ADMIN" || role === "SUPERADMIN";
    if (!canManage) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const body = await req.json();
    const { lugarId, tipo, url, nombre, adminId } = body ?? {};

    if (!lugarId || !tipo || !url) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const urlStr = String(url);
    if (
      !urlStr.startsWith("http://") &&
      !urlStr.startsWith("https://") &&
      !urlStr.startsWith("/")
    ) {
      return NextResponse.json(
        { error: "URL inválida (http/https o /...)" },
        { status: 400 }
      );
    }

    const data: any = {
      lugarId: Number(lugarId),
      tipo, // "IMAGE" | "VIDEO"
      url: urlStr,
      nombre: nombre ? String(nombre) : null,
    };

    if (role === "SUPERADMIN" && adminId) {
      data.adminId = Number(adminId);
    }

    const created = await prisma.marketingAsset.create({ data });
    return NextResponse.json({ ok: true, created });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
