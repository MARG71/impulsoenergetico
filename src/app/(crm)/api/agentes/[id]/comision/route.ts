// src/app/(crm)/api/agentes/[id]/comision/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const normPct01 = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  if (Number.isNaN(n)) return undefined;
  const p = n > 1 ? n / 100 : n; // 15 -> 0.15
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

  // SUPERADMIN global: obligamos a especificar tenant si quieres modificar
  if (isSuperadmin && !tenantAdminId) {
    return NextResponse.json(
      { error: "SUPERADMIN debe indicar ?adminId=... para operar en un tenant" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const pctAgente = normPct01(body?.pctAgente);
  if (pctAgente === undefined) {
    return NextResponse.json({ error: "pctAgente inválido" }, { status: 400 });
  }

  // 🔒 Update seguro por tenant
  const where: any = { id };
  if (tenantAdminId) where.adminId = tenantAdminId;

  const res = await prisma.agente.updateMany({
    where,
    data: { pctAgente },
  });

  if (res.count === 0) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  const updated = await prisma.agente.findFirst({
    where,
    select: { id: true, nombre: true, pctAgente: true, adminId: true },
  });

  return NextResponse.json(updated);
}
