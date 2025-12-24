// src/app/(crm)/api/lugares/[id]/comision/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const normPct01 = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  if (Number.isNaN(n)) return undefined;
  const p = n > 1 ? n / 100 : n;
  return Math.max(0, Math.min(1, p));
};

export async function PUT(req: NextRequest, ctx: any) {
  const id = Number(ctx.params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const t = await getTenantContext(req);
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

  const { isSuperadmin, isAdmin, tenantAdminId } = t;
  if (!(isSuperadmin || isAdmin)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (isSuperadmin && !tenantAdminId) {
    return NextResponse.json(
      { error: "SUPERADMIN debe indicar ?adminId=... para operar en un tenant" },
      { status: 400 }
    );
  }

  const body = await req.json();

  const pctLugar = body?.pctLugar !== undefined ? normPct01(body.pctLugar) : undefined;
  const pctCliente = body?.pctCliente !== undefined ? normPct01(body.pctCliente) : undefined;

  if (body?.pctLugar !== undefined && pctLugar === undefined) {
    return NextResponse.json({ error: "pctLugar inválido" }, { status: 400 });
  }
  if (body?.pctCliente !== undefined && pctCliente === undefined) {
    return NextResponse.json({ error: "pctCliente inválido" }, { status: 400 });
  }

  const where: any = { id };
  if (tenantAdminId) where.adminId = tenantAdminId;

  const data: any = {};
  if (pctLugar !== undefined) data.pctLugar = pctLugar;
  if (pctCliente !== undefined) data.pctCliente = pctCliente;

  const res = await prisma.lugar.updateMany({ where, data });

  if (res.count === 0) {
    return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });
  }

  const updated = await prisma.lugar.findFirst({
    where,
    select: { id: true, nombre: true, pctLugar: true, pctCliente: true, adminId: true },
  });

  return NextResponse.json(updated);
}
