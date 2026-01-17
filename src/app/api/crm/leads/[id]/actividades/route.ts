// src/app/api/crm/leads/[id]/actividades/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionAdminId,
  sessionAgenteId,
  sessionRole,
} from "@/lib/auth-server";

function parseId(id: unknown) {
  const n = Number(id);
  return !n || Number.isNaN(n) ? null : n;
}

export async function GET(_req: Request, ctx: any) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);
    const agenteId = sessionAgenteId(session);
    const lugarId = Number((session.user as any)?.lugarId ?? null);

    const leadId = parseId(ctx?.params?.id);
    if (!leadId) {
      return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, adminId: true, agenteId: true, lugarId: true },
    });

    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    if (role !== "SUPERADMIN") {
      if ((lead.adminId ?? null) !== tenantAdminId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (role === "LUGAR" && lugarId && lead.lugarId !== lugarId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    const items = await prisma.leadActividad.findMany({
      where: { leadId },
      orderBy: { creadoEn: "desc" },
      take: 200,
      include: {
        usuario: { select: { id: true, nombre: true, rol: true } },
      },
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    console.error("GET actividades lead error:", e);
    return NextResponse.json({ error: "Error obteniendo actividades" }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: any) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);
    const agenteId = sessionAgenteId(session);
    const lugarId = Number((session.user as any)?.lugarId ?? null);
    const usuarioId = Number((session.user as any).id);

    const leadId = parseId(ctx?.params?.id);
    if (!leadId) {
      return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, adminId: true, agenteId: true, lugarId: true },
    });

    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    if (role !== "SUPERADMIN") {
      if ((lead.adminId ?? null) !== tenantAdminId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (role === "LUGAR" && lugarId && lead.lugarId !== lugarId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const tipo = String(body?.tipo || "nota");
    const titulo = String(body?.titulo || "Actividad");
    const detalle = body?.detalle ? String(body.detalle) : null;

    const created = await prisma.leadActividad.create({
      data: {
        leadId,
        tipo,
        titulo,
        detalle,
        usuarioId,
        adminId: lead.adminId ?? tenantAdminId ?? null,
      },
      include: {
        usuario: { select: { id: true, nombre: true, rol: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    console.error("POST actividades lead error:", e);
    return NextResponse.json({ error: "Error creando actividad" }, { status: 500 });
  }
}
