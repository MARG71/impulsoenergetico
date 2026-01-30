// src/app/api/crm/clientes/route.ts
// src/app/api/crm/clientes/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function asInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    // ✅ auth/tenant
    const ctx = await getTenantContext(req as any);
    if (!ctx.ok) return NextResponse.json({ ok: false, error: ctx.error }, { status: ctx.status });

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const take = asInt(url.searchParams.get("take")) ?? 200;

    // ✅ where base (tenant)
    const where: any = {};
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;

    // ✅ filtro por rol (opcional pero recomendable)
    // - ADMIN/SUPERADMIN: ve todo de su tenant
    // - AGENTE: solo clientes con contrataciones del agente
    // - LUGAR: solo clientes con contrataciones del lugar
    if (ctx.isAgente && ctx.agenteId) {
      where.contrataciones = { some: { agenteId: ctx.agenteId } };
    }
    if (ctx.isLugar && ctx.lugarId) {
      where.contrataciones = { some: { lugarId: ctx.lugarId } };
    }

    // ✅ búsqueda simple (nombre/email/teléfono)
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q, mode: "insensitive" } },
      ];
    }

    // ✅ IMPORTANTE:
    // No uses creadoEn si tu modelo no lo tiene. Orden seguro: id desc.
    const items = await (prisma as any).cliente.findMany({
      where,
      orderBy: { id: "desc" },
      take,
      include: {
        // si existe en tu modelo nuevo
        contrataciones: {
          orderBy: { id: "desc" },
          take: 10,
          include: {
            seccion: true,
            subSeccion: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, items: items ?? [] });
  } catch (e: any) {
    console.error("CLIENTES_GET_ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error interno en clientes" },
      { status: 500 }
    );
  }
}
