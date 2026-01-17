// src/app/api/crm/leads/tareas/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function tenantWhere(sessionUser: any) {
  const role = sessionUser?.role as Role | undefined;

  // SUPERADMIN ve todo
  if (role === "SUPERADMIN") return {};

  // ADMIN ve solo lo suyo: adminId = su propio id
  if (role === "ADMIN") return { adminId: Number(sessionUser.id) };

  // AGENTE ve lo suyo: adminId = su adminId y agenteId = el suyo
  if (role === "AGENTE")
    return {
      adminId: Number(sessionUser.adminId),
      agenteId: Number(sessionUser.agenteId),
    };

  // LUGAR ve lo suyo: adminId = su adminId y lugarId = el suyo
  if (role === "LUGAR")
    return {
      adminId: Number(sessionUser.adminId),
      lugarId: Number(sessionUser.lugarId),
    };

  // CLIENTE (si lo usas) -> por defecto nada
  return { id: -1 };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const baseWhere = tenantWhere(session.user);

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const include = {
      agente: { select: { id: true, nombre: true } },
      lugar: { select: { id: true, nombre: true } },
    } as const;

    const [vencidos, hoy, nuevos, todos] = await Promise.all([
      prisma.lead.findMany({
        where: {
          ...baseWhere,
          proximaAccionEn: { lt: inicioHoy },
        },
        orderBy: [{ proximaAccionEn: "asc" }, { creadoEn: "desc" }],
        include,
        take: 500,
      }),

      prisma.lead.findMany({
        where: {
          ...baseWhere,
          proximaAccionEn: { gte: inicioHoy, lte: finHoy },
        },
        orderBy: [{ proximaAccionEn: "asc" }, { creadoEn: "desc" }],
        include,
        take: 500,
      }),

      prisma.lead.findMany({
        where: {
          ...baseWhere,
          creadoEn: { gte: hace24h },
        },
        orderBy: { creadoEn: "desc" },
        include,
        take: 500,
      }),

      prisma.lead.findMany({
        where: { ...baseWhere },
        orderBy: { creadoEn: "desc" },
        include,
        take: 2000,
      }),
    ]);

    return NextResponse.json({ vencidos, hoy, nuevos, todos });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
