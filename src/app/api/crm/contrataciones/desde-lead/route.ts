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
  const seccionId = toId(body?.seccionId);
  const subSeccionId = toId(body?.subSeccionId);

  if (!leadId) return jsonError(400, "leadId es obligatorio");
  if (!seccionId) return jsonError(400, "seccionId es obligatorio");

  try {
    // 1) Cargar lead (scoped por adminId)
    const whereLead: any = { id: leadId };
    if (tenant.tenantAdminId != null) whereLead.adminId = tenant.tenantAdminId;

    const lead = await prisma.lead.findFirst({
      where: whereLead,
      select: { id: true, agenteId: true, lugarId: true, adminId: true, nombre: true },
    });

    if (!lead) return jsonError(404, "Lead no encontrado");

    // 2) Validar que la seccion existe y está activa (opcional pero recomendable)
    const sec = await prisma.seccion.findFirst({
      where: { id: seccionId, activa: true },
      select: { id: true },
    });
    if (!sec) return jsonError(400, "Sección inválida o inactiva");

    // 3) Si mandan subSeccionId, validar que pertenece a la seccion y está activa
    if (subSeccionId) {
      const sub = await prisma.subSeccion.findFirst({
        where: { id: subSeccionId, seccionId, activa: true },
        select: { id: true },
      });
      if (!sub) return jsonError(400, "Subsección inválida, inactiva o no pertenece a la sección");
    }

    // 4) Crear contratación BORRADOR
    const created = await prisma.contratacion.create({
      data: {
        adminId: tenant.tenantAdminId ?? null,
        leadId: lead.id,
        agenteId: lead.agenteId ?? null,
        lugarId: lead.lugarId ?? null,
        seccionId,
        subSeccionId: subSeccionId ?? null,
        estado: EstadoContratacion.BORRADOR,
        nivel: NivelComision.C1, // puedes permitir que venga del body si quieres
      },
      include: {
        seccion: true,
        subSeccion: true,
        lead: true,
      },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    console.error("POST /api/crm/contrataciones/desde-lead error:", e);
    return jsonError(500, "Error creando contratación desde lead");
  }
}
