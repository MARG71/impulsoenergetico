import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(req: Request, context: any) {
  const { params } = context;
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { isSuperadmin, tenantAdminId } = ctx;
  const agenteId = Number(params.id);
  if (!agenteId || Number.isNaN(agenteId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const where: any = { id: agenteId };
  if (!isSuperadmin || tenantAdminId) {
    where.adminId = tenantAdminId;
  }

  const agente = await prisma.agente.findFirst({ where });

  if (!agente) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  return NextResponse.json(agente);
}

export async function PUT(req: Request, context: any) {
  const { params } = context;
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!ctx.isSuperadmin && !ctx.isAdmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN o ADMIN pueden editar agentes" },
      { status: 403 }
    );
  }

  const agenteId = Number(params.id);
  if (!agenteId || Number.isNaN(agenteId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { nombre, email, telefono, pctAgente } = body || {};
  const { isSuperadmin, tenantAdminId } = ctx;

  const whereCheck: any = { id: agenteId };
  if (!isSuperadmin || tenantAdminId) {
    whereCheck.adminId = tenantAdminId;
  }

  const existente = await prisma.agente.findFirst({ where: whereCheck });
  if (!existente) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  try {
    const agente = await prisma.agente.update({
      where: { id: agenteId },
      data: {
        nombre,
        email,
        telefono: telefono || null,
        pctAgente: pctAgente ?? null,
      },
    });

    return NextResponse.json(agente);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Error al actualizar agente" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: any) {
  const { params } = context;
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!ctx.isSuperadmin && !ctx.isAdmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN o ADMIN pueden eliminar agentes" },
      { status: 403 }
    );
  }

  const agenteId = Number(params.id);
  if (!agenteId || Number.isNaN(agenteId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { isSuperadmin, tenantAdminId } = ctx;

  const whereCheck: any = { id: agenteId };
  if (!isSuperadmin || tenantAdminId) {
    whereCheck.adminId = tenantAdminId;
  }

  const existente = await prisma.agente.findFirst({ where: whereCheck });
  if (!existente) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  try {
    const agente = await prisma.agente.update({
      where: { id: agenteId },
      data: { ocultoParaAdmin: true },
    });

    return NextResponse.json({ ok: true, agente });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Error al eliminar agente" },
      { status: 500 }
    );
  }
}
