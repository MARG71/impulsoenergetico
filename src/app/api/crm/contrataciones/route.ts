// src/app/api/crm/contrataciones/route.ts
// src/app/api/crm/contrataciones/route.ts
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

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const estadoQ = asEstado(req.nextUrl.searchParams.get("estado"));
  const where: any = {};
  if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;
  if (estadoQ) where.estado = estadoQ;

  try {
    const items = await prisma.contratacion.findMany({
      where,
      orderBy: { id: "desc" },
      take: 200,
      include: {
        cliente: true,
        lead: true,
        seccion: true,
        subSeccion: true,
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
        documentos: { orderBy: { id: "desc" }, take: 20 },
      },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("GET /api/crm/contrataciones error:", e);
    return jsonError(500, "Error cargando contrataciones");
  }
}

export async function POST(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const body = await req.json().catch(() => ({}));

  const seccionId = toId(body?.seccionId);
  if (!seccionId) return jsonError(400, "seccionId es obligatorio");

  const subSeccionId = toId(body?.subSeccionId);

  const data: any = {
    seccionId,
    subSeccionId: subSeccionId ?? null,
    notas: typeof body?.notas === "string" ? body.notas : null,
    agenteId: toId(body?.agenteId),
    lugarId: toId(body?.lugarId),
    leadId: toId(body?.leadId),
  };

  const est = asEstado(body?.estado);
  if (est) data.estado = est;

  const niv = asNivel(body?.nivel);
  if (niv) data.nivel = niv;

  if (tenant.tenantAdminId != null) data.adminId = tenant.tenantAdminId;

  try {
    const created = await prisma.contratacion.create({
      data,
      include: { seccion: true, subSeccion: true, cliente: true, lead: true },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    console.error("POST /api/crm/contrataciones error:", e);
    return jsonError(500, "Error creando contratación");
  }
}

export async function PATCH(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const body = await req.json().catch(() => ({}));
  const id = toId(body?.id);
  if (!id) return jsonError(400, "id es obligatorio");

  // 🔒 scope tenant
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

  if (body?.baseImponible !== undefined) data.baseImponible = body.baseImponible === null ? null : body.baseImponible;
  if (body?.totalFactura !== undefined) data.totalFactura = body.totalFactura === null ? null : body.totalFactura;

  try {
    const updated = await prisma.contratacion.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    console.error("PATCH /api/crm/contrataciones error:", e);
    return jsonError(500, "Error actualizando contratación");
  }
}
