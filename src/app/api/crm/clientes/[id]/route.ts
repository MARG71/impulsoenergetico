// src/app/api/crm/clientes/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest, ctx: any) {
  try {
    const id = toId(ctx?.params?.id);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const t = await getTenantContext(req);
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

    const { isSuperadmin, tenantAdminId, isAdmin, isAgente, isLugar, agenteId, lugarId } = t;

    // ✅ Seguridad: filtramos por tenant y por rol
    const where: any = { id };

    if (!isSuperadmin) {
      where.adminId = tenantAdminId ?? undefined;
    } else {
      if (tenantAdminId) where.adminId = tenantAdminId;
    }

    // ✅ Si es AGENTE/LUGAR, obligamos a que el cliente esté “relacionado” con su scope
    if (isAgente) {
      where.OR = [
        { comparativas: { some: { agenteId: agenteId ?? -1 } } },
        { contratos: { some: { agenteId: agenteId ?? -1 } } },
      ];
    }

    if (isLugar) {
      where.comparativas = { some: { lugarId: lugarId ?? -1 } };
    }

    const item = await prisma.cliente.findFirst({
      where,
      include: {
        contratos: { orderBy: { fechaAlta: "desc" } },
        comparativas: { orderBy: { fecha: "desc" } },
      },
    });

    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    console.error("GET /api/crm/clientes/[id] error:", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
