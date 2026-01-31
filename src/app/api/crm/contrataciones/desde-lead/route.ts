// src/app/api/crm/contrataciones/desde-lead/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

function parseId(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getRole(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
}

async function resolveSeccionIdFallback(): Promise<number | null> {
  const byName = await prisma.seccion.findFirst({
    where: { nombre: { in: ["Luz", "luz", "Energía", "energia"] } as any },
    select: { id: true },
  });
  if (byName?.id) return byName.id;

  const first = await prisma.seccion.findFirst({
    select: { id: true },
    orderBy: { id: "asc" },
  });
  return first?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const tenant = await getTenantContext(req as any);
    if (!tenant.ok) return jsonError(tenant.error, tenant.status);

    const role = getRole(tenant);

    if (!["ADMIN", "SUPERADMIN"].includes(role)) {
      return jsonError("No autorizado", 403);
    }

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Body JSON inválido", 400);

    const leadId = parseId(body.leadId);
    if (!leadId) return jsonError("leadId requerido", 400);

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, agenteId: true, lugarId: true, seccionId: true, adminId: true } as any,
    });

    if (!lead) return jsonError("Lead no encontrado", 404);

    // 1) Resolver seccionId
    let seccionId = parseId((lead as any).seccionId);
    if (!seccionId) seccionId = await resolveSeccionIdFallback();
    if (!seccionId) return jsonError("No hay secciones en BD (crea al menos 1)", 400);

    // 2) Resolver adminId correcto (multi-tenant)
    // - ADMIN: usar tenantAdminId
    // - SUPERADMIN: usar lead.adminId (debe existir)
    let resolvedAdminId: number | null = null;

    if (role === "SUPERADMIN") {
      resolvedAdminId = Number((lead as any)?.adminId ?? null) || null;
      if (!resolvedAdminId) {
        return jsonError("Este lead no tiene adminId. Asígnalo al crear el lead para poder generar contrataciones.", 400);
      }
    } else {
      resolvedAdminId = tenant.tenantAdminId ?? null;
      if (!resolvedAdminId) return jsonError("tenantAdminId no disponible", 400);
    }

    const contratacion = await prisma.contratacion.create({
      data: {
        adminId: resolvedAdminId,
        leadId: lead.id,
        seccionId,
        estado: "BORRADOR" as any,
        ...(lead.agenteId ? ({ agenteId: lead.agenteId } as any) : {}),
        ...(lead.lugarId ? ({ lugarId: lead.lugarId } as any) : {}),
        nivel: "C1" as any,
      } as any,
    });

    return NextResponse.json({ ok: true, contratacion }, { status: 201 });
  } catch (e: any) {
    return jsonError("Error interno creando contratación", 500, {
      message: String(e?.message ?? e),
    });
  }
}
