import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.usuario.findMany({
      where: { rol: "ADMIN" },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        adminId: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ admins });
  } catch (e) {
    console.error("[API][admins] error:", e);
    return NextResponse.json({ error: "Error cargando admins" }, { status: 500 });
  }
}
