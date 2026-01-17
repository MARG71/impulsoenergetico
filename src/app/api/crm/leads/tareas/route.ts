// src/app/api/crm/leads/tareas/route.ts
// src/app/api/crm/leads/tareas/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionAdminId,
  sessionAgenteId,
  sessionRole,
} from "@/lib/auth-server";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function pickTenantWhere(session: any) {
  const role = sessionRole(session) as Role;
  const adminId = sessionAdminId(session);
  const agenteId = sessionAgenteId(session);
  const lugarId = Number((session.user as any)?.lugarId ?? null);

  if (role === "SUPERADMIN") return {};

  // ADMIN: solo su tenant (adminId)
  if (role === "ADMIN") return { adminId };

  // AGENTE: solo sus leads
  if (role === "AGENTE") return { adminId, agenteId };

  // LUGAR: solo sus leads
  if (role === "LUGAR") return { adminId, lugarId };

  // resto, nada
  return { id: -1 };
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const leadSelect = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
  estado: true,
  creadoEn: true,
  proximaAccion: true,
  proximaAccionEn: true,
  agente: { select: { id: true, nombre: true } },
  lugar: { select: { id: true, nombre: true } },
} as const;

export async function GET() {
  try {
    const session = await getSessionOrThrow();
    const tenantWhere = pickTenantWhere(session);

    const now = new Date();
    const hoyStart = startOfDay(now);
    const hoyEnd = endOfDay(now);

    /**
     * Definición PRO:
     * - vencidas: proximaAccionEn < NOW (no solo antes de hoy)
     * - hoy: proximaAccionEn entre hoyStart y hoyEnd
     * - pendientes:
     *    a) proximaAccionEn > hoyEnd (futuras)
     *    b) proximaAccionEn = null (sin siguiente acción -> prioridad real)
     */
    const [vencidas, hoy, pendientes] = await Promise.all([
      prisma.lead.findMany({
        where: {
          ...tenantWhere,
          proximaAccionEn: { not: null, lt: now },
        },
        orderBy: [{ proximaAccionEn: "asc" }, { creadoEn: "desc" }],
        select: leadSelect,
        take: 500,
      }),

      prisma.lead.findMany({
        where: {
          ...tenantWhere,
          proximaAccionEn: { gte: hoyStart, lte: hoyEnd },
        },
        orderBy: [{ proximaAccionEn: "asc" }, { creadoEn: "desc" }],
        select: leadSelect,
        take: 500,
      }),

      prisma.lead.findMany({
        where: {
          ...tenantWhere,
          OR: [
            { proximaAccionEn: { gt: hoyEnd } }, // futuras
            { proximaAccionEn: null }, // sin siguiente paso
          ],
        },
        orderBy: [
          { proximaAccionEn: "asc" }, // nulls first o last depende DB; ok igualmente
          { creadoEn: "desc" },
        ],
        select: leadSelect,
        take: 500,
      }),
    ]);

    // Para depurar rápido si quieres ver qué está entrando:
    // console.log({ vencidas: vencidas.length, hoy: hoy.length, pendientes: pendientes.length });

    return NextResponse.json({
      vencidas,
      hoy,
      pendientes,
      meta: {
        now: now.toISOString(),
        hoyStart: hoyStart.toISOString(),
        hoyEnd: hoyEnd.toISOString(),
      },
    });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    console.error("crm leads tareas error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
