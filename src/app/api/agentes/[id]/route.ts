// src/app/api/agentes/[id]/route.ts
// src/app/api/agentes/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function buildAgenteWhere(ctx: any, idNum: number) {
  const where: any = { id: idNum };

  if (ctx.isSuperadmin) {
    // SUPERADMIN:
    // - Si viene en modo tenant, filtra por ese adminId
    // - Si no, puede ver/editar cualquier agente
    if (ctx.tenantAdminId) {
      where.adminId = ctx.tenantAdminId;
    }
  } else if (ctx.isAdmin) {
    // ADMIN: solo sus agentes (su tenantAdminId)
    if (!ctx.tenantAdminId) {
      throw new Error("Config de tenant inválida para ADMIN (sin tenantAdminId)");
    }
    where.adminId = ctx.tenantAdminId;
  } else {
    // Otros roles no deberían llegar aquí
    throw new Error("NO_PERMITIDO");
  }

  return where;
}

// ─────────────────────────────────────
// GET /api/agentes/[id]
// ─────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let where;
  try {
    where = buildAgenteWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN o ADMIN pueden ver agentes" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Config de tenant inválida" },
      { status: 400 }
    );
  }

  const agente = await prisma.agente.findFirst({
    where,
    include: {
      _count: {
        select: {
          lugares: true,
          leads: true,
          comparativas: true,
        },
      },
      admin: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
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
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo SUPERADMIN o ADMIN
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
  }: {
    nombre?: string;
    email?: string;
    telefono?: string | null;
    pctAgente?: number | null;
    ocultoParaAdmin?: boolean;
  } = body || {};

  if (!nombre || !email) {
    return NextResponse.json(
      { error: "Nombre y email son obligatorios" },
      { status: 400 }
    );
  }

  let where;
  try {
    where = buildAgenteWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN o ADMIN pueden editar agentes" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Config de tenant inválida" },
      { status: 400 }
    );
  }

  const agenteExistente = await prisma.agente.findFirst({
    where,
    include: {
      usuarios: true,
      admin: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
    },
  });

  if (!agenteExistente) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  try {
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
      },
      include: {
        _count: {
          select: {
            lugares: true,
            leads: true,
            comparativas: true,
          },
        },
        admin: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    // Sincronizar datos básicos en los usuarios vinculados al agente
    if (agenteExistente.usuarios.length > 0) {
      await prisma.usuario.updateMany({
        where: {
          agenteId: agenteExistente.id,
        },
        data: {
          nombre,
          email,
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
    return NextResponse.json(
      { error: "Error actualizando agente" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────
// DELETE /api/agentes/[id]
// ─────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo SUPERADMIN o ADMIN
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

  let where;
  try {
    where = buildAgenteWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN o ADMIN pueden eliminar agentes" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Config de tenant inválida" },
      { status: 400 }
    );
  }

  const agenteExistente = await prisma.agente.findFirst({ where });
  if (!agenteExistente) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  try {
    // Soft delete: lo marcamos oculto para que no aparezca en listados normales
    await prisma.agente.update({
      where: { id: agenteExistente.id },
      data: {
        ocultoParaAdmin: true,
      },
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
