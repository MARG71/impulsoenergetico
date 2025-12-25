// src/app/api/admins/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo SUPERADMIN puede ver el listado de admins
  if (!ctx.isSuperadmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN puede listar administradores" },
      { status: 403 }
    );
  }

  const admins = await prisma.usuario.findMany({
    where: { rol: "ADMIN" },
    select: {
      id: true,
      nombre: true,
      email: true,
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(admins);
}
