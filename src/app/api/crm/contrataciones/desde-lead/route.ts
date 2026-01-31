export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

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

  const adminId = tenant.tenantAdminId;
  if (!adminId) return jsonError(400, "tenantAdminId no disponible");

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, adminId },
      select: { id: true, agenteId: true, lugarId: true },
    });

    if (!lead) return jsonError(404, "Lead no encontrado");

    const created = await prisma.contratacion.create({
      data: {
        adminId,
        leadId: lead.id,
        agenteId: lead.agenteId ?? null,
        lugarId: lead.lugarId ?? null,
        estado: "BORRADOR",
        nivel: "C1",
        // seccionId se pondrá desde Contrataciones (o puedes setear default si quieres)
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, contratacionId: created.id });
  } catch (e: any) {
    console.error("POST /api/crm/contrataciones/desde-lead error:", e);
    return jsonError(500, "Error creando contratación desde lead");
  }
}
