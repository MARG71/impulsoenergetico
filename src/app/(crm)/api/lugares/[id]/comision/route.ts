// src/app/(crm)/api/lugares/[id]/comision/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function PUT(req: NextRequest, ctx: any) {
  const id = Number(ctx.params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const t = await getTenantContext(req);
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

  const { isSuperadmin, isAdmin, tenantAdminId } = t;
  if (!(isSuperadmin || isAdmin)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existe = await prisma.lugar.findFirst({
    where: tenantAdminId ? { id, adminId: tenantAdminId } : { id },
    select: { id: true },
  });
  if (!existe) return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (body.pctLugar !== undefined) data.pctLugar = body.pctLugar; // 0..1
  if (body.pctCliente !== undefined) data.pctCliente = body.pctCliente; // 0..1

  const updated = await prisma.lugar.update({
    where: { id },
    data,
    select: { id: true, nombre: true, pctLugar: true, pctCliente: true, adminId: true },
  });

  return NextResponse.json(updated);
}
