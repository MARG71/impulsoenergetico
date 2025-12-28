// src/app/api/lugares/[id]/detalle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function buildLugarWhereDetalle(ctx: any, idNum: number) {
  const where: any = { id: idNum };

  if (ctx.isSuperadmin) {
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;
  } else if (ctx.isAdmin) {
    if (!ctx.tenantAdminId) throw new Error("TENANT_INVALIDO");
    where.adminId = ctx.tenantAdminId;
  } else if (ctx.isAgente) {
    if (!ctx.agenteId) throw new Error("AGENTE_SIN_ID");
    where.agenteId = ctx.agenteId;
  } else {
    throw new Error("NO_PERMITIDO");
  }

  return where;
}

export async function GET(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };

  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let where: any;
  try {
    where = buildLugarWhereDetalle(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN, ADMIN o AGENTE pueden ver detalle de lugar" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Configuración de tenant inválida" },
      { status: 400 }
    );
  }

  const lugar = await prisma.lugar.findFirst({
    where,
    include: {
      agente: {
        select: { id: true, nombre: true, email: true },
      },
      usuarios: true,
      leads: {
        include: {
          agente: {
            select: { id: true, nombre: true },
          },
        },
        orderBy: { creadoEn: "desc" },
      },
      comparativas: {
        include: {
          cliente: true,
          agente: true,
        },
        orderBy: { fecha: "desc" },
      },
    },
  });

  if (!lugar) {
    return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });
  }

  return NextResponse.json(lugar);
}
