//src/app/api/agentes/[id]/detalle/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(req: NextRequest, context: any) {
  // sacamos params a mano y lo tipamos dentro, NO en la firma
  const { params } = context as { params: { id: string } };

  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Gestión: SOLO SUPERADMIN / ADMIN
  if (!ctx.isSuperadmin && !ctx.isAdmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN o ADMIN pueden ver detalle de agente" },
      { status: 403 }
    );
  }

  const agenteId = Number(params.id);
  if (!agenteId || Number.isNaN(agenteId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { isSuperadmin, tenantAdminId } = ctx;
  const where: any = { id: agenteId };
  if (!isSuperadmin || tenantAdminId) {
    // ADMIN o SUPERADMIN en modo tenant
    where.adminId = tenantAdminId;
  }

  const agente = await prisma.agente.findFirst({
    where,
    include: {
      usuarios: true,
      lugares: true,
      comparativas: {
        include: {
          cliente: true,
          lugar: true,
        },
        orderBy: { fecha: "desc" },
      },
      leads: {
        include: { lugar: true },
        orderBy: { creadoEn: "desc" },
      },
    },
  });

  if (!agente) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  return NextResponse.json(agente);
}
