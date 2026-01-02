// src/app/api/lugares/[id]/detalle/route.ts
// src/app/api/lugares/[id]/detalle/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function buildLugarWhereDetalle(ctx: any, idNum: number) {
  const where: any = { id: idNum };

  if (ctx.isSuperadmin) {
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;
    return where;
  }

  if (ctx.isAdmin) {
    if (!ctx.tenantAdminId) throw new Error("TENANT_INVALIDO");
    where.adminId = ctx.tenantAdminId;
    return where;
  }

  if (ctx.isAgente) {
    if (!ctx.agenteId) throw new Error("AGENTE_SIN_ID");
    where.agenteId = ctx.agenteId;
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;
    return where;
  }

  // ✅ LUGAR: solo su propio lugar
  if (ctx.isLugar) {
    if (!ctx.lugarId) throw new Error("LUGAR_SIN_ID");
    if (ctx.lugarId !== idNum) throw new Error("LUGAR_NO_COINCIDE");
    where.id = ctx.lugarId;
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;
    return where;
  }

  throw new Error("NO_PERMITIDO");
}

export async function GET(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };

  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let where: any;
  try {
    where = buildLugarWhereDetalle(ctx, idNum);
  } catch (e: any) {
    const code = e?.message;

    if (code === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN, ADMIN, AGENTE o LUGAR pueden ver el detalle" },
        { status: 403 }
      );
    }
    if (code === "LUGAR_NO_COINCIDE") {
      return NextResponse.json(
        { error: "No tienes permiso para ver este lugar" },
        { status: 403 }
      );
    }
    if (code === "TENANT_INVALIDO") {
      return NextResponse.json(
        { error: "Configuración de tenant inválida" },
        { status: 400 }
      );
    }
    if (code === "AGENTE_SIN_ID" || code === "LUGAR_SIN_ID") {
      return NextResponse.json(
        { error: "Usuario sin relación asignada (agenteId/lugarId)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "No permitido" }, { status: 403 });
  }

  const lugar = await prisma.lugar.findFirst({
    where,
    include: {
      admin: { select: { id: true, nombre: true, email: true } },
      agente: { select: { id: true, nombre: true, email: true, telefono: true } },

      // ✅ importantísimo: NO devolver password
      usuarios: {
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          adminId: true,
          agenteId: true,
          lugarId: true,
        },
        orderBy: { id: "asc" },
      },

      leads: {
        include: {
          agente: { select: { id: true, nombre: true } },
          lugar: { select: { id: true, nombre: true } },
        },
        orderBy: { creadoEn: "desc" },
      },

      comparativas: {
        include: {
          cliente: true,
          agente: true,
          lugar: { select: { id: true, nombre: true } },
        },
        orderBy: { fecha: "desc" }, // en tu schema existe ✅
      },

      _count: {
        select: { usuarios: true, leads: true, comparativas: true },
      },
    },
  });

  if (!lugar) {
    return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });
  }

  return NextResponse.json(lugar);
}
