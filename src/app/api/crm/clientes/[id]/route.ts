// src/app/api/crm/clientes/[id]/route.ts
// src/app/api/crm/clientes/[id]/route.ts
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

async function assertAccess(req: NextRequest, clienteId: number) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return tenant;

  const where: any = { id: clienteId };
  if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;

  const exists = await prisma.cliente.findFirst({
    where,
    select: { id: true },
  });

  if (!exists) {
    return { ok: false as const, status: 404, error: "Cliente no encontrado" };
  }

  return tenant;
}

export async function GET(req: NextRequest, ctx: any) {
  const id = toId(ctx?.params?.id);
  if (!id) return jsonError(400, "ID inválido");

  const tenant = await assertAccess(req, id);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const where: any = { id };
  if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;

  const item = await prisma.cliente.findFirst({
    where,
    include: {
      contrataciones: { orderBy: { id: "desc" }, take: 50 },
    },
  });

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(req: NextRequest, ctx: any) {
  const id = toId(ctx?.params?.id);
  if (!id) return jsonError(400, "ID inválido");

  const tenant = await assertAccess(req, id);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (typeof body?.nombre === "string") data.nombre = body.nombre.trim();
  if (typeof body?.email === "string") data.email = body.email.trim() || null;
  if (typeof body?.telefono === "string") data.telefono = body.telefono.trim() || null;

  const updated = await prisma.cliente.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req: NextRequest, ctx: any) {
  const id = toId(ctx?.params?.id);
  if (!id) return jsonError(400, "ID inválido");

  const tenant = await assertAccess(req, id);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  await prisma.cliente.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
