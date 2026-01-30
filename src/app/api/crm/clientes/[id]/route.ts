// src/app/api/crm/clientes/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function toInt(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// 👇 Next.js 15: params ES PROMISE
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const t = await getTenantContext(req);
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

  // Permitimos ver cliente a: SUPERADMIN/ADMIN/AGENTE/LUGAR (tu menú ya lo muestra)
  if (!["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"].includes(t.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const clienteId = toInt(id);
  if (!clienteId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // Multi-tenant:
  // - SUPERADMIN puede ver global (tenantAdminId null) o tenant concreto (adminId)
  // - ADMIN/AGENTE/LUGAR: siempre filtramos por tenantAdminId
  const where: any = { id: clienteId };

  if (t.tenantAdminId) {
    where.adminId = t.tenantAdminId;
  }

  // Si el rol es LUGAR, opcionalmente podrías filtrar por su lugar (si quieres),
  // pero de momento lo dejamos por tenant para no romper nada.
  const cliente = await prisma.cliente.findFirst({
    where,
    include: {
      comparativas: {
        orderBy: { fecha: "desc" },
        take: 50,
        include: { agente: true, lugar: true },
      },
      contratos: {
        orderBy: { fechaAlta: "desc" },
        take: 50,
        include: { agente: true },
      },
    },
  });

  if (!cliente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, cliente });
}

// (Opcional) PATCH para editar campos básicos sin romper build
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const t = await getTenantContext(req);
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

  if (!["SUPERADMIN", "ADMIN"].includes(t.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const clienteId = toInt(id);
  if (!clienteId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (typeof body.nombre === "string") data.nombre = body.nombre.trim();
  if (typeof body.direccion === "string") data.direccion = body.direccion.trim();
  if (typeof body.email === "string") data.email = body.email.trim() || null;
  if (typeof body.telefono === "string") data.telefono = body.telefono.trim() || null;

  // ⚠️ ojo: en tu schema inicial Cliente.email es unique opcional, esto puede fallar si duplicas email
  const where: any = { id: clienteId };
  if (t.tenantAdminId) where.adminId = t.tenantAdminId;

  const updated = await prisma.cliente.updateMany({
    where,
    data,
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
