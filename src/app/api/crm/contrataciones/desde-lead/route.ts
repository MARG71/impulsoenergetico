// src/app/api/crm/contrataciones/desde-lead/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { EstadoContratacion, NivelComision } from "@prisma/client";

function jsonError(status: number, message: string, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getRole(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
}

export async function POST(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = getRole(tenant);
  const body = await req.json().catch(() => ({}));

  const leadId = toId(body?.leadId);
  const seccionId = toId(body?.seccionId);

  if (!leadId) return jsonError(400, "leadId es obligatorio");
  if (!seccionId) return jsonError(400, "seccionId es obligatorio");

  try {
    // 1) Leer lead + adminId (muy importante para SUPERADMIN)
    // ⚠️ OJO: en tu schema Lead NO tiene clienteId => lo quitamos.
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        adminId: true,
        agenteId: true,
        lugarId: true,
      },
    });

    if (!lead) return jsonError(404, "Lead no encontrado");

    // 2) Resolver adminId efectivo
    let resolvedAdminId: number | null = null;

    if (role === "SUPERADMIN") {
      resolvedAdminId = lead.adminId ?? null;
      if (!resolvedAdminId) {
        return jsonError(400, "El lead no tiene adminId (necesario para SUPERADMIN)");
      }
    } else {
      resolvedAdminId = tenant.tenantAdminId ?? null;
      if (!resolvedAdminId) return jsonError(400, "tenantAdminId no disponible");
    }

    // 3) Seguridad tenant: si no eres SUPERADMIN, el lead debe ser de tu adminId
    if (role !== "SUPERADMIN") {
      const leadAdminId = lead.adminId ?? null;
      if (leadAdminId && leadAdminId !== resolvedAdminId) {
        return jsonError(403, "No autorizado para usar este lead");
      }
    }

    // 4) Crear contratación en BORRADOR
    const created = await prisma.contratacion.create({
      data: {
        adminId: resolvedAdminId,
        estado: EstadoContratacion.BORRADOR,
        nivel: NivelComision.C1, // default
        seccionId,
        subSeccionId: null,
        leadId: lead.id,
        agenteId: lead.agenteId ?? null,
        lugarId: lead.lugarId ?? null,

        // clienteId se asigna al CONFIRMAR (tu lógica ya lo hace)
        clienteId: null,

        baseImponible: null,
        totalFactura: null,
        notas: null,
      },
      include: {
        seccion: true,
        subSeccion: true,
        lead: true,
        cliente: true,
      },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    console.error("POST /api/crm/contrataciones/desde-lead error:", e);
    // 🔎 útil para que la UI muestre el error real
    return jsonError(500, e?.message || "Error interno creando contratación");
  }
}
