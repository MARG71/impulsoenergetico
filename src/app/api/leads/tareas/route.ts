import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const rol = (session.user as any).rol ?? (session.user as any).role ?? null;
    const userId = (session.user as any).id ? Number((session.user as any).id) : null;
    const adminId = (session.user as any).adminId ? Number((session.user as any).adminId) : null;
    const agenteId = (session.user as any).agenteId ? Number((session.user as any).agenteId) : null;
    const lugarId = (session.user as any).lugarId ? Number((session.user as any).lugarId) : null;

    const tenantAdminId =
      rol === "SUPERADMIN" ? null : rol === "ADMIN" ? userId : adminId;

    const whereBase: any = {};

    // SUPERADMIN ve todo
    if (rol !== "SUPERADMIN") {
      if (!tenantAdminId) {
        return NextResponse.json({ error: "Tenant no resuelto" }, { status: 400 });
      }
      whereBase.adminId = tenantAdminId;
    }

    if (rol === "AGENTE") whereBase.agenteId = agenteId ?? -1;
    if (rol === "LUGAR") whereBase.lugarId = lugarId ?? -1;

    const now = new Date();

    // inicio/fin de hoy (en hora del server; suficiente para empezar)
    const inicioHoy = new Date(now);
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(now);
    finHoy.setHours(23, 59, 59, 999);

    const hace24h = new Date(now);
    hace24h.setHours(hace24h.getHours() - 24);

    const [vencidos, hoy, nuevos, todos] = await Promise.all([
      prisma.lead.findMany({
        where: {
          ...whereBase,
          proximaAccionEn: { lt: inicioHoy },
          estado: { notIn: ["cerrado", "perdido"] },
        },
        orderBy: [{ proximaAccionEn: "asc" }, { creadoEn: "desc" }],
        include: { agente: true, lugar: true },
        take: 200,
      }),

      prisma.lead.findMany({
        where: {
          ...whereBase,
          proximaAccionEn: { gte: inicioHoy, lte: finHoy },
          estado: { notIn: ["cerrado", "perdido"] },
        },
        orderBy: [{ proximaAccionEn: "asc" }, { creadoEn: "desc" }],
        include: { agente: true, lugar: true },
        take: 200,
      }),

      prisma.lead.findMany({
        where: {
          ...whereBase,
          creadoEn: { gte: hace24h },
          estado: { in: ["pendiente", "contactado"] },
        },
        orderBy: { creadoEn: "desc" },
        include: { agente: true, lugar: true },
        take: 200,
      }),

      prisma.lead.findMany({
        where: whereBase,
        orderBy: { creadoEn: "desc" },
        include: { agente: true, lugar: true },
        take: 500,
      }),
    ]);

    return NextResponse.json({ vencidos, hoy, nuevos, todos });
  } catch (error) {
    console.error("[LEADS][TAREAS] Error:", error);
    return NextResponse.json({ error: "Error cargando tareas de leads" }, { status: 500 });
  }
}
