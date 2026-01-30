// src/app/api/crm/clientes/[id]/route.ts
// src/app/api/crm/clientes/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function toId(id: any) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ✅ Next 15: evita tipar el segundo arg fuerte para que no casque el build
export async function GET(req: Request, context: any) {
  try {
    const ctx = await getTenantContext(req as any);
    if (!ctx.ok) return NextResponse.json({ ok: false, error: ctx.error }, { status: ctx.status });

    const id = toId(context?.params?.id);
    if (!id) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

    const where: any = { id };
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;

    // ✅ seguridad por rol (misma lógica)
    if (ctx.isAgente && ctx.agenteId) {
      where.contrataciones = { some: { agenteId: ctx.agenteId } };
    }
    if (ctx.isLugar && ctx.lugarId) {
      where.contrataciones = { some: { lugarId: ctx.lugarId } };
    }

    const item = await (prisma as any).cliente.findFirst({
      where,
      include: {
        contrataciones: {
          orderBy: { id: "desc" },
          include: { seccion: true, subSeccion: true, lead: true },
        },
      },
    });

    if (!item) return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    console.error("CLIENTE_ID_GET_ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error interno cliente" },
      { status: 500 }
    );
  }
}
