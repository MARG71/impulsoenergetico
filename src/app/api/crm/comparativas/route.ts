// src/app/api/crm/comparativas/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function tenantWhere(sessionUser: any) {
  const role = sessionUser?.role as Role | undefined;

  if (role === "SUPERADMIN") return {};

  if (role === "ADMIN") return { adminId: Number(sessionUser.id) };

  if (role === "AGENTE")
    return {
      adminId: Number(sessionUser.adminId),
      agenteId: Number(sessionUser.agenteId),
    };

  if (role === "LUGAR")
    return {
      adminId: Number(sessionUser.adminId),
      lugarId: Number(sessionUser.lugarId),
    };

  return { id: -1 };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const where = tenantWhere(session.user);

    const comparativas = await prisma.comparativa.findMany({
      where,
      orderBy: { id: "desc" },
      include: {
        cliente: true,
        agente: true,
        lugar: true,
        datosFactura: true,
        resultados: true,
      },
      take: 500,
    });

    return NextResponse.json(comparativas);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
