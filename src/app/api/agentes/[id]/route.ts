// src/app/api/agentes/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

type Nivel = "C1" | "C2" | "C3" | "ESPECIAL";

function normalizeNivel(v: any): Nivel | null {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).toUpperCase();
  if (s === "C1" || s === "C2" || s === "C3" || s === "ESPECIAL") return s;
  return null;
}

function buildAgenteWhere(ctx: any, idNum: number) {
  const where: any = { id: idNum };

  if (ctx.isSuperadmin) {
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;
  } else if (ctx.isAdmin) {
    if (!ctx.tenantAdminId) {
      throw new Error("Config de tenant inválida para ADMIN (sin tenantAdminId)");
    }
    where.adminId = ctx.tenantAdminId;
  } else {
    throw new Error("NO_PERMITIDO");
  }

  return where;
}

// ─────────────────────────────────────
// GET /api/agentes/[id]
// ─────────────────────────────────────
export async function GET(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };

  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let where: any;
  try {
    where = buildAgenteWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN o ADMIN pueden ver agentes" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Config de tenant inválida" }, { status: 400 });
  }

  const agente = await prisma.agente.findFirst({
    where,
    include: {
      _count: { select: { lugares: true, leads: true, comparativas: true } },
      admin: { select: { id: true, nombre: true, email: true } },
    },
  });

  if (!agente) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  return NextResponse.json(agente);
}

// ─────────────────────────────────────
// PUT /api/agentes/[id]
// ─────────────────────────────────────
export async function PUT(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };

  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!ctx.isSuperadmin && !ctx.isAdmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN o ADMIN pueden editar agentes" },
      { status: 403 }
    );
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    nombre,
    email,
    telefono,
    pctAgente,
    ocultoParaAdmin,
    nivelComisionDefault,
  } = body || {};

  if (!nombre || !email) {
    return NextResponse.json(
      { error: "Nombre y email son obligatorios" },
      { status: 400 }
    );
  }

  let where: any;
  try {
    where = buildAgenteWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN o ADMIN pueden editar agentes" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Config de tenant inválida" }, { status: 400 });
  }

  const agenteExistente = await prisma.agente.findFirst({
    where,
    include: { usuarios: true },
  });

  if (!agenteExistente) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  const nivel = normalizeNivel(nivelComisionDefault);

  try {
    // 1) Actualizar agente (incluye el nivel EN AGENTE)
    const agenteActualizado = await prisma.agente.update({
      where: { id: agenteExistente.id },
      data: {
        nombre,
        email,
        telefono: telefono ?? null,
        pctAgente: pctAgente ?? null,
        ocultoParaAdmin:
          typeof ocultoParaAdmin === "boolean"
            ? ocultoParaAdmin
            : agenteExistente.ocultoParaAdmin,
        ...(nivel ? { nivelComisionDefault: nivel } : {}),
      },
      include: {
        _count: { select: { lugares: true, leads: true, comparativas: true } },
        admin: { select: { id: true, nombre: true, email: true } },
      },
    });

    // 2) Sincronizar usuarios vinculados (nombre/email y nivel si viene)
    if (agenteExistente.usuarios.length > 0) {
      await prisma.usuario.updateMany({
        where: { agenteId: agenteExistente.id },
        data: {
          nombre,
          email,
          ...(nivel ? { nivelComisionDefault: nivel } : {}),
        },
      });
    }

    return NextResponse.json(agenteActualizado);
  } catch (e: any) {
    console.error("Error actualizando agente:", e);
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "El email ya está en uso por otro usuario." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error actualizando agente" }, { status: 500 });
  }
}

// ─────────────────────────────────────
// DELETE /api/agentes/[id]
// ─────────────────────────────────────
export async function DELETE(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };

  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!ctx.isSuperadmin && !ctx.isAdmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN o ADMIN pueden eliminar agentes" },
      { status: 403 }
    );
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let where: any;
  try {
    where = buildAgenteWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN o ADMIN pueden eliminar agentes" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Config de tenant inválida" }, { status: 400 });
  }

  const agenteExistente = await prisma.agente.findFirst({ where });
  if (!agenteExistente) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  try {
    await prisma.agente.update({
      where: { id: agenteExistente.id },
      data: { ocultoParaAdmin: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error eliminando agente:", e);
    return NextResponse.json(
      { error: "Error al eliminar (ocultar) el agente" },
      { status: 500 }
    );
  }
}
