// src/app/api/crm/clientes/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function qLike(q: string) {
  return q.trim();
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { role, tenantAdminId, agenteId, lugarId, isSuperadmin, isAdmin, isAgente, isLugar } = ctx;

    const url = new URL(req.url);
    const q = qLike(url.searchParams.get("q") ?? "");
    const take = Math.min(Number(url.searchParams.get("take") ?? 200) || 200, 500);

    // ✅ Base where tenant
    const where: any = {};

    // SUPERADMIN:
    // - si está en modo tenant (?adminId=) => filtra por ese adminId
    // - si NO => ve todo (global)
    if (!isSuperadmin) {
      // ADMIN/AGENTE/LUGAR: siempre a su tenant
      where.adminId = tenantAdminId ?? undefined;
    } else {
      if (tenantAdminId) where.adminId = tenantAdminId;
    }

    // ✅ Búsqueda simple por nombre/email/teléfono
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q, mode: "insensitive" } },
      ];
    }

    // ✅ Restricción por rol (AGENTE/LUGAR)
    // Cliente no tiene agenteId/lugarId directo, así que filtramos por relaciones existentes:
    // - comparativas (tienen agenteId/lugarId)
    // - contratos (tienen agenteId)
    if (isAgente) {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            { comparativas: { some: { agenteId: agenteId ?? -1 } } },
            { contratos: { some: { agenteId: agenteId ?? -1 } } },
          ],
        },
      ];
    }

    if (isLugar) {
      where.AND = [
        ...(where.AND ?? []),
        { comparativas: { some: { lugarId: lugarId ?? -1 } } },
      ];
    }

    // ✅ Admin: ve todo su tenant
    // ✅ Superadmin: ve global o tenant
    // (no hacemos nada extra)

    const items = await prisma.cliente.findMany({
      where,
      orderBy: { id: "desc" },
      take,
      include: {
        // ⚠️ si en tu schema Cliente tiene estas relaciones (como en el que pegaste), esto es correcto:
        contratos: { orderBy: { fechaAlta: "desc" }, take: 20 },
        comparativas: { orderBy: { fecha: "desc" }, take: 20 },
      },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("GET /api/crm/clientes error:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno cargando clientes" },
      { status: 500 }
    );
  }
}
