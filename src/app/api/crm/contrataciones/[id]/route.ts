// src/app/api/crm/contrataciones/[id]/route.ts
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

function asEstado(v: any): EstadoContratacion | null {
  if (!v) return null;
  const s = String(v).toUpperCase();
  return (Object.values(EstadoContratacion) as string[]).includes(s)
    ? (s as EstadoContratacion)
    : null;
}

function asNivel(v: any): NivelComision | null {
  if (!v) return null;
  const s = String(v).toUpperCase();
  return (Object.values(NivelComision) as string[]).includes(s)
    ? (s as NivelComision)
    : null;
}

export async function GET(req: NextRequest, ctx: any) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const id = toId(ctx?.params?.id);
  if (!id) return jsonError(400, "ID inválido");

  const where: any = { id };
  if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;

  const item = await prisma.contratacion.findFirst({
    where,
    include: {
      cliente: true,
      lead: true,
      seccion: true,
      subSeccion: true,
      agente: { select: { id: true, nombre: true } },
      lugar: { select: { id: true, nombre: true } },
      documentos: { orderBy: { id: "desc" }, take: 50 },
    },
  });

  if (!item) return jsonError(404, "Contratación no encontrada");
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(req: NextRequest, ctx: any) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const id = toId(ctx?.params?.id);
  if (!id) return jsonError(400, "ID inválido");

  const body = await req.json().catch(() => ({}));

  const where: any = { id };
  if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;

  const exists = await prisma.contratacion.findFirst({ where, select: { id: true } });
  if (!exists) return jsonError(404, "Contratación no encontrada");

  const data: any = {};
  const est = asEstado(body?.estado);
  if (est) data.estado = est;

  const niv = asNivel(body?.nivel);
  if (niv) data.nivel = niv;

  if (typeof body?.notas === "string") data.notas = body.notas;

  try {
    const updated = await prisma.contratacion.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    console.error("PATCH /api/crm/contrataciones/[id] error:", e);
    return jsonError(500, "Error actualizando contratación");
  }
}
