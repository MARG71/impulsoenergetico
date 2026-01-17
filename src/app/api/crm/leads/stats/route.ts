// src/app/api/crm/leads/stats/route.ts
// src/app/api/crm/leads/stats/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionAdminId,
  sessionRole,
} from "@/lib/auth-server";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function tenantWhere(sessionUser: any) {
  const role = sessionUser?.role as Role | undefined;

  if (role === "SUPERADMIN") return {};

  if (role === "ADMIN") return { adminId: Number(sessionUser.id) };

  if (role === "AGENTE") {
    return {
      adminId: Number(sessionUser.adminId),
      agenteId: Number(sessionUser.agenteId),
    };
  }

  if (role === "LUGAR") {
    return {
      adminId: Number(sessionUser.adminId),
      lugarId: Number(sessionUser.lugarId),
    };
  }

  return { id: -1 };
}

function rangoToDate(rango: string | null) {
  const now = new Date();
  if (rango === "hoy") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (rango === "30d") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  // default 7d
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

const ESTADOS = [
  "pendiente",
  "contactado",
  "comparativa",
  "contrato",
  "cerrado",
  "perdido",
] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const user: any = session.user;

    const baseWhere = tenantWhere(user);

    const url = new URL(req.url);
    const rango = url.searchParams.get("rango");
    const from = rangoToDate(rango);

    const whereRango = {
      ...baseWhere,
      creadoEn: { gte: from },
    };

    // total rango
    const total = await prisma.lead.count({ where: whereRango });

    // estados
    const groupEstados = await prisma.lead.groupBy({
      by: ["estado"],
      where: whereRango,
      _count: { _all: true },
    });

    const estados = ESTADOS.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {} as Record<(typeof ESTADOS)[number], number>);

    for (const row of groupEstados) {
      const key = String(row.estado || "pendiente").toLowerCase() as any;
      if (key in estados) estados[key] = row._count._all;
    }

    // top agentes
    const groupAgentes = await prisma.lead.groupBy({
      by: ["agenteId"],
      where: whereRango,
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 10,
    });

    const agenteIds = groupAgentes
      .map((g) => g.agenteId)
      .filter((x): x is number => typeof x === "number");

    const agentes = agenteIds.length
      ? await prisma.agente.findMany({
          where: { id: { in: agenteIds } },
          select: { id: true, nombre: true },
        })
      : [];

    const agenteName = new Map(agentes.map((a) => [a.id, a.nombre ?? `Agente ${a.id}`]));

    const topAgentes = groupAgentes.map((g) => ({
      agenteId: g.agenteId ?? null,
      nombre:
        g.agenteId == null ? "Sin agente" : (agenteName.get(g.agenteId) ?? `Agente ${g.agenteId}`),
      total: g._count._all,
    }));

    // top lugares
    const groupLugares = await prisma.lead.groupBy({
      by: ["lugarId"],
      where: whereRango,
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 10,
    });

    const lugarIds = groupLugares
      .map((g) => g.lugarId)
      .filter((x): x is number => typeof x === "number");

    const lugares = lugarIds.length
      ? await prisma.lugar.findMany({
          where: { id: { in: lugarIds } },
          select: { id: true, nombre: true },
        })
      : [];

    const lugarName = new Map(lugares.map((l) => [l.id, l.nombre ?? `Lugar ${l.id}`]));

    const topLugares = groupLugares.map((g) => ({
      lugarId: g.lugarId ?? null,
      nombre:
        g.lugarId == null ? "Sin lugar" : (lugarName.get(g.lugarId) ?? `Lugar ${g.lugarId}`),
      total: g._count._all,
    }));

    // ratios simples (si quieres)
    const ratios: Record<string, number> = {};
    if (total > 0) {
      ratios.contactado = Math.round((estados.contactado / total) * 100);
      ratios.comparativa = Math.round((estados.comparativa / total) * 100);
      ratios.contrato = Math.round((estados.contrato / total) * 100);
      ratios.cerrado = Math.round((estados.cerrado / total) * 100);
    }

    return NextResponse.json({
      total,
      estados,
      ratios,
      topAgentes,
      topLugares,
      meta: { rango: rango ?? "7d", desde: from.toISOString(), role },
    });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("stats leads error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
