import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionAdminId,
  sessionAgenteId,
  sessionRole,
} from "@/lib/auth-server";

function leadIdFromPath(req: NextRequest) {
  // /api/crm/leads/[id]/actividades  => el [id] está en el penúltimo segmento
  const idStr = req.nextUrl.pathname.split("/").slice(-2)[0];
  const leadId = Number(idStr);
  return leadId;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);
    const agenteId = sessionAgenteId(session);

    const leadId = leadIdFromPath(req);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    }

    // 1) Cargar lead con control de acceso
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, adminId: true, agenteId: true },
    });

    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    // Permisos
    if (role !== "SUPERADMIN") {
      // Debe pertenecer al tenant
      if ((lead.adminId ?? null) !== tenantAdminId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      // Si es AGENTE, debe ser su lead
      if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) {
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

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);
    const agenteId = sessionAgenteId(session);
    const usuarioId = Number((session.user as any).id);

    const leadId = leadIdFromPath(req);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, adminId: true, agenteId: true },
    });

    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    // Permisos
    if (role !== "SUPERADMIN") {
      if ((lead.adminId ?? null) !== tenantAdminId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) {
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
