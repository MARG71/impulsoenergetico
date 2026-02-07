// src/app/api/crm/contrataciones/[id]/route.ts
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

function getRole(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
}

export async function GET(req: NextRequest, ctx: any) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = getRole(tenant);

  const id = toId(ctx?.params?.id);
  if (!id) return jsonError(400, "ID inválido");

  const where: any = { id };

  // ✅ ADMIN: scope por adminId
  // ✅ SUPERADMIN: sin filtro (o si tenantAdminId existe por modo tenant, puedes filtrar)
  if (role !== "SUPERADMIN") {
    if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;
    else return jsonError(400, "tenantAdminId no disponible");
  } else {
    // opcional:
    // if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;
  }

  const item = await prisma.contratacion.findFirst({
    where,
    include: {
      admin: { select: { id: true, nombre: true, email: true } },
      agente: { select: { id: true, nombre: true, email: true, telefono: true } },
      lugar: { select: { id: true, nombre: true, direccion: true } },

      cliente: { select: { id: true, nombre: true, email: true, telefono: true, direccion: true } },
      lead: { select: { id: true, nombre: true, email: true, telefono: true } },

      seccion: { select: { id: true, nombre: true, slug: true } },
      subSeccion: { select: { id: true, nombre: true, slug: true } },

      documentos: { orderBy: { id: "desc" }, take: 50 },
    },
  });

  if (!item) return jsonError(404, "Contratación no encontrada");
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(req: NextRequest, ctx: any) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = getRole(tenant);

  const id = toId(ctx?.params?.id);
  if (!id) return jsonError(400, "ID inválido");

  const body = await req.json().catch(() => ({}));

  const where: any = { id };

  if (role !== "SUPERADMIN") {
    if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;
    else return jsonError(400, "tenantAdminId no disponible");
  }

  const exists = await prisma.contratacion.findFirst({ where, select: { id: true } });
  if (!exists) return jsonError(404, "Contratación no encontrada");

  const data: any = {};
  // Este PATCH lo estás usando poco (porque el cambio de estado lo haces en /estado).
  // Lo dejamos para notas/nivel etc si lo usas:
  if (typeof body?.notas === "string") data.notas = body.notas;

  try {
    const updated = await prisma.contratacion.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    console.error("PATCH /api/crm/contrataciones/[id] error:", e);
    return jsonError(500, "Error actualizando contratación");
  }
}
