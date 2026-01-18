export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionAdminId, sessionAgenteId, sessionRole } from "@/lib/auth-server";

function parseId(id: unknown) {
  const n = Number(id);
  return !n || Number.isNaN(n) ? null : n;
}

async function assertLeadAccess(leadId: number) {
  const session = await getSessionOrThrow();
  const role = sessionRole(session);
  const tenantAdminId = sessionAdminId(session);
  const agenteId = sessionAgenteId(session);
  const lugarId = Number((session.user as any)?.lugarId ?? null);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, adminId: true, agenteId: true, lugarId: true },
  });

  if (!lead) return { session, lead: null as any, role, tenantAdminId };

  if (role !== "SUPERADMIN") {
    if ((lead.adminId ?? null) !== tenantAdminId) throw new Error("FORBIDDEN");
    if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) throw new Error("FORBIDDEN");
    if (role === "LUGAR" && lugarId && lead.lugarId !== lugarId) throw new Error("FORBIDDEN");
  }

  return { session, lead, role, tenantAdminId };
}

export async function GET(_req: Request, ctx: any) {
  try {
    const leadId = parseId(ctx?.params?.id);
    if (!leadId) return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });

    const { lead } = await assertLeadAccess(leadId);
    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    const items = await prisma.leadDocumento.findMany({
      where: { leadId },
      orderBy: { creadoEn: "desc" },
      take: 200,
      include: { creadoPor: { select: { id: true, nombre: true, rol: true } } },
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    console.error("GET documentos lead error:", e);
    return NextResponse.json({ error: "Error obteniendo documentos" }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: any) {
  try {
    const leadId = parseId(ctx?.params?.id);
    if (!leadId) return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });

    const { session, lead, tenantAdminId } = await assertLeadAccess(leadId);
    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    const usuarioId = Number((session.user as any)?.id);

    const body = await req.json().catch(() => ({}));
    const nombre = String(body?.nombre || "").trim();
    const url = String(body?.url || "").trim();

    if (!nombre || !url) {
      return NextResponse.json({ error: "nombre y url son requeridos" }, { status: 400 });
    }

    const created = await prisma.leadDocumento.create({
      data: {
        leadId,
        nombre,
        url,
        publicId: body?.publicId ? String(body.publicId) : null,
        resourceType: body?.resourceType ? String(body.resourceType) : null,
        mime: body?.mime ? String(body.mime) : null,
        size: body?.size ? Number(body.size) : null,
        creadoPorId: usuarioId || null,
        adminId: lead.adminId ?? tenantAdminId ?? null,
      },
      include: { creadoPor: { select: { id: true, nombre: true, rol: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    console.error("POST documentos lead error:", e);
    return NextResponse.json({ error: "Error creando documento" }, { status: 500 });
  }
}
