export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { EstadoContratacion, NivelComision } from "@prisma/client";

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const body = await req.json().catch(() => ({}));
  const leadId = toId(body?.leadId);
  if (!leadId) return jsonError(400, "leadId es obligatorio");

  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        ...(tenant.tenantAdminId != null ? { adminId: tenant.tenantAdminId } : {}),
      },
      select: {
        id: true,
        nombre: true,
        agenteId: true,
        lugarId: true,
        adminId: true,
      },
    });

    if (!lead) return jsonError(404, "Lead no encontrado");

    // ✅ Sección por defecto: LUZ (slug "luz") o la primera activa
    const seccion = await prisma.seccion.findFirst({
      where: { activa: true, slug: "luz" },
      select: { id: true },
    });

    const fallback = seccion
      ? seccion.id
      : (await prisma.seccion.findFirst({ where: { activa: true }, select: { id: true } }))?.id;

    if (!fallback) return jsonError(400, "No hay secciones activas. Crea Secciones primero.");

    const created = await prisma.contratacion.create({
      data: {
        adminId: tenant.tenantAdminId ?? null,
        leadId: lead.id,
        agenteId: lead.agenteId ?? null,
        lugarId: lead.lugarId ?? null,
        seccionId: fallback, // ✅ obligatorio
        subSeccionId: null,
        estado: EstadoContratacion.BORRADOR,
        nivel: NivelComision.C1,
      },
      include: { seccion: true, subSeccion: true, lead: true },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    console.error("POST /api/crm/contrataciones/desde-lead error:", e);
    return jsonError(500, "Error creando contratación desde lead");
  }
}
