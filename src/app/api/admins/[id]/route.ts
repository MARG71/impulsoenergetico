// src/app/api/admins/[id]/route.ts
// src/app/api/admins/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function parseId(param: string): number | null {
  const n = Number(param);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * OBTENER UN ADMIN (solo SUPERADMIN)
 */
export async function GET(req: NextRequest, context: any) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!ctx.isSuperadmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN puede ver administradores" },
      { status: 403 }
    );
  }

  const { id: idParam } = (context?.params || {}) as { id?: string };
  const id = idParam ? parseId(idParam) : null;

  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const admin = await prisma.usuario.findFirst({
    where: {
      id,
      rol: "ADMIN",
      adminId: null,
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      _count: {
        select: {
          agentesGestionados: true,
          lugaresGestionados: true,
          leadsGestionados: true,
          comparativasGestionadas: true,
        },
      },
    },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 });
  }

  return NextResponse.json(admin);
}

/**
 * EDITAR ADMIN (solo SUPERADMIN)
 */
export async function PUT(req: NextRequest, context: any) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!ctx.isSuperadmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN puede editar administradores" },
      { status: 403 }
    );
  }

  const { id: idParam } = (context?.params || {}) as { id?: string };
  const id = idParam ? parseId(idParam) : null;

  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { nombre, email } = body || {};

  if (!nombre || !email) {
    return NextResponse.json(
      { error: "Nombre y email son obligatorios" },
      { status: 400 }
    );
  }

  try {
    const admin = await prisma.usuario.update({
      where: { id },
      data: {
        nombre,
        email,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });

    return NextResponse.json(admin);
  } catch (e: any) {
    console.error(e);
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe otro usuario con ese email." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error actualizando admin." },
      { status: 500 }
    );
  }
}

/**
 * BORRAR ADMIN (solo SUPERADMIN)
 */
export async function DELETE(req: NextRequest, context: any) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!ctx.isSuperadmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN puede eliminar administradores" },
      { status: 403 }
    );
  }

  const { id: idParam } = (context?.params || {}) as { id?: string };
  const id = idParam ? parseId(idParam) : null;

  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await prisma.usuario.delete({
      where: { id },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      {
        error:
          "No se puede eliminar este admin porque tiene datos asociados (agentes, lugares, leads, etc.).",
      },
      { status: 400 }
    );
  }
}
