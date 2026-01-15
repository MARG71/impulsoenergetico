import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function resolveUser(session: any) {
  const rol = (session?.user as any)?.rol ?? (session?.user as any)?.role ?? null;
  const userId = (session?.user as any)?.id ? Number((session.user as any).id) : null;
  const adminId = (session?.user as any)?.adminId ? Number((session.user as any).adminId) : null;
  const agenteId = (session?.user as any)?.agenteId ? Number((session.user as any).agenteId) : null;
  const lugarId = (session?.user as any)?.lugarId ? Number((session.user as any).lugarId) : null;

  const tenantAdminId =
    rol === "SUPERADMIN" ? null : rol === "ADMIN" ? userId : adminId;

  return { rol, userId, adminId, agenteId, lugarId, tenantAdminId };
}

function rangoToDays(rango?: string | null) {
  const r = (rango || "").toLowerCase();
  if (r === "hoy") return 1;
  if (r === "7d" || r === "7dias" || r === "7") return 7;
  if (r === "30d" || r === "30dias" || r === "30") return 30;
  return 30; // default
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { rol, tenantAdminId, agenteId, lugarId } = resolveUser(session);

    // Permitir ver stats a SUPERADMIN, ADMIN, AGENTE (y si quieres, LUGAR)
    if (!["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"].includes(String(rol))) {
      return NextResponse.json({ error: "No permitido" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rango = searchParams.get("rango"); // hoy | 7d | 30d
    const days = rangoToDays(rango);

    const desde = new Date();
    desde.setDate(desde.getDate() - (days === 1 ? 0 : days));
    if (days === 1) {
      // hoy
      desde.setHours(0, 0, 0, 0);
    }

    const whereBase: any = {
      creadoEn: { gte: desde },
    };

    // ✅ Multi-tenant
    if (rol !== "SUPERADMIN") {
      if (!tenantAdminId) {
        return NextResponse.json({ error: "Tenant no resuelto" }, { status: 400 });
      }
      whereBase.adminId = tenantAdminId;
    }

    // ✅ Restricciones por rol
    if (rol === "AGENTE") whereBase.agenteId = agenteId ?? -1;
    if (rol === "LUGAR") whereBase.lugarId = lugarId ?? -1;

    // Totales por estado
    const [total, pendiente, contactado, comparativa, contrato, cerrado, perdido] =
      await Promise.all([
        prisma.lead.count({ where: whereBase }),
        prisma.lead.count({ where: { ...whereBase, estado: "pendiente" } }),
        prisma.lead.count({ where: { ...whereBase, estado: "contactado" } }),
        prisma.lead.count({ where: { ...whereBase, estado: "comparativa" } }),
        prisma.lead.count({ where: { ...whereBase, estado: "contrato" } }),
        prisma.lead.count({ where: { ...whereBase, estado: "cerrado" } }),
        prisma.lead.count({ where: { ...whereBase, estado: "perdido" } }),
      ]);

    // Top Agentes
    const topAgentesRaw = await prisma.lead.groupBy({
      by: ["agenteId"],
      where: whereBase,
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 5,
    });

    const agentesIds = topAgentesRaw
      .map((x) => x.agenteId)
      .filter((x): x is number => typeof x === "number");

    const agentes = agentesIds.length
      ? await prisma.agente.findMany({
          where: { id: { in: agentesIds } },
          select: { id: true, nombre: true },
        })
      : [];

    const topAgentes = topAgentesRaw.map((x) => ({
      agenteId: x.agenteId,
      nombre: agentes.find((a) => a.id === x.agenteId)?.nombre || "Sin agente",
      total: x._count._all,
    }));

    // Top Lugares
    const topLugaresRaw = await prisma.lead.groupBy({
      by: ["lugarId"],
      where: whereBase,
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 5,
    });

    const lugaresIds = topLugaresRaw
      .map((x) => x.lugarId)
      .filter((x): x is number => typeof x === "number");

    const lugares = lugaresIds.length
      ? await prisma.lugar.findMany({
          where: { id: { in: lugaresIds } },
          select: { id: true, nombre: true },
        })
      : [];

    const topLugares = topLugaresRaw.map((x) => ({
      lugarId: x.lugarId,
      nombre: lugares.find((l) => l.id === x.lugarId)?.nombre || "Sin lugar",
      total: x._count._all,
    }));

    // Embudo (ratios)
    const ratio = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return NextResponse.json({
      rango: rango || (days === 1 ? "hoy" : `${days}d`),
      desde: desde.toISOString(),
      total,
      estados: {
        pendiente,
        contactado,
        comparativa,
        contrato,
        cerrado,
        perdido,
      },
      ratios: {
        pendiente: ratio(pendiente),
        contactado: ratio(contactado),
        comparativa: ratio(comparativa),
        contrato: ratio(contrato),
        cerrado: ratio(cerrado),
        perdido: ratio(perdido),
      },
      topAgentes,
      topLugares,
    });
  } catch (error) {
    console.error("[LEADS][STATS] Error:", error);
    return NextResponse.json({ error: "Error cargando estadísticas" }, { status: 500 });
  }
}
