export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ✅ GET /api/crm/clientes/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // ✅ Si quieres restringir por tenant adminId, aquí lo hacemos:
  // - SUPERADMIN: puede ver cualquiera (o filtrar por ctx.tenantAdminId si estás en tenant mode)
  // - ADMIN/AGENTE/LUGAR: solo su tenant
  const tenantAdminId =
    ctx.isSuperadmin ? ctx.tenantAdminId : ctx.tenantAdminId; // (para claridad)

  const cliente = await prisma.cliente.findFirst({
    where: {
      id,
      ...(tenantAdminId ? { adminId: tenantAdminId } : {}), // si tenantAdminId es null => global
    },
    include: {
      comparativas: true,
      contratos: true,
    },
  });

  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, cliente });
}

// ✅ PATCH /api/crm/clientes/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => ({}));

  const tenantAdminId = ctx.isSuperadmin ? ctx.tenantAdminId : ctx.tenantAdminId;

  // ✅ Comprobamos que exista en el tenant antes de actualizar
  const exists = await prisma.cliente.findFirst({
    where: { id, ...(tenantAdminId ? { adminId: tenantAdminId } : {}) },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  const data: any = {};
  if (body.nombre !== undefined) data.nombre = String(body.nombre).trim();
  if (body.email !== undefined) data.email = body.email ? String(body.email).trim() : null;
  if (body.telefono !== undefined) data.telefono = body.telefono ? String(body.telefono).trim() : null;
  if (body.direccion !== undefined) data.direccion = body.direccion ? String(body.direccion).trim() : "";
  if (body.ocultoParaAdmin !== undefined) data.ocultoParaAdmin = Boolean(body.ocultoParaAdmin);

  const updated = await prisma.cliente.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, cliente: updated });
}

// ✅ DELETE /api/crm/clientes/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  // si quieres que solo SUPERADMIN/ADMIN borren, deja esto:
  if (!(ctx.isSuperadmin || ctx.isAdmin)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const tenantAdminId = ctx.isSuperadmin ? ctx.tenantAdminId : ctx.tenantAdminId;

  const exists = await prisma.cliente.findFirst({
    where: { id, ...(tenantAdminId ? { adminId: tenantAdminId } : {}) },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  await prisma.cliente.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
