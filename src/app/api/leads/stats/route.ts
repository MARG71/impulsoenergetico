import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function resolveUser(session: any) {
  const rol = (session?.user as any)?.rol ?? (session?.user as any)?.role ?? null;

  const userIdRaw = (session?.user as any)?.id;
  const adminIdRaw = (session?.user as any)?.adminId;
  const agenteIdRaw = (session?.user as any)?.agenteId;
  const lugarIdRaw = (session?.user as any)?.lugarId;

  const userId = userIdRaw != null ? Number(userIdRaw) : null;
  const adminId = adminIdRaw != null ? Number(adminIdRaw) : null;
  const agenteId = agenteIdRaw != null ? Number(agenteIdRaw) : null;
  const lugarId = lugarIdRaw != null ? Number(lugarIdRaw) : null;

  const tenantAdminId =
    rol === "SUPERADMIN" ? null : rol === "ADMIN" ? userId : adminId;

  return { rol, userId, adminId, agenteId, lugarId, tenantAdminId };
}

function rangoToDays(rango?: string | null) {
  const r = (rango || "").toLowerCase();
  if (r === "hoy") return 1;
  if (r === "7d" || r === "7dias" || r === "7") return 7;
  if (r === "30d" || r === "30dias" || r === "30") return 30;
  return 30;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { rol, tenantAdminId, agenteId, lugarId } = resolveUser(session);

    if (!["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"].includes(String(rol))) {
      return NextResponse.json({ error: "No permitido" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rango = searchParams.get("rango"); // hoy | 7d | 30d
    const days = rangoToDays(rango);

    const desde = new Date();
    if (days === 1) {
      desde.setHours(0, 0, 0, 0);
    } else {
      desde.setDate(desde.getDate() - days);
    }

    const whereBase: any = {
      creadoEn: { gte: desde },
    };

    // ✅ Multi-tenant (SUPERADMIN ve todo)
    if (rol !== "SUPERADMIN") {
      if (!tenantAdminId) {
        return NextResponse.json({ error: "Tenant no resuelto" }, { status: 400 });
      }
      whereBase.adminId = tenantAdminId;
    }

    // ✅ Restricción por rol
    if (rol === "AGENTE") whereBase.agenteId = agenteId ?? -1;
    if (rol === "LUGAR") whereBase.lugarId = lugarId ?? -1;

    // Totales por estado
    const [
      total,
      pendiente,
      contactado,
      comparativa,
      contrato,
      cerrado,
      perdido,
    ] = await Promise.all([
      prisma.lead.count({ where: whereBase }),
      prisma.lead.count({ where: { ...whereBase, estado: "pendiente" } }),
      prisma.lead.count({ where: { ...whereBase, estado: "contactado" } }),
      prisma.lead.count({ where: { ...whereBase, estado: "comparativa" } }),
      prisma.lead.count({ where: { ...whereBase, estado: "contrato" } }),
      prisma.lead.count({ where: { ...whereBase, estado: "cerrado" } }),
      prisma.lead.count({ where: { ...whereBase, estado: "perdido" } }),
    ]);

    // Helper ratio
    const ratio = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    // ✅ TOP AGENTES (Prisma v6 compatible)
    const topAgentesRaw = await prisma.lead.groupBy({
      by: ["agenteId"],
      where: whereBase,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
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
      agenteId: x.agenteId ?? null,
      nombre: agentes.find((a) => a.id === x.agenteId)?.nombre || "Sin agente",
      total: x._count.id,
    }));

    // ✅ TOP LUGARES (Prisma v6 compatible)
    const topLugaresRaw = await prisma.lead.groupBy({
      by: ["lugarId"],
      where: whereBase,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
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
      lugarId: x.lugarId ?? null,
      nombre: lugares.find((l) => l.id === x.lugarId)?.nombre || "Sin lugar",
      total: x._count.id,
    }));

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
    return NextResponse.json(
      { error: "Error cargando estadísticas" },
      { status: 500 }
    );
  }
}
