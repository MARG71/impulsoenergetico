// src/app/api/crm/contrataciones/route.ts
// src/app/api/crm/contrataciones/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { EstadoContratacion, NivelComision } from "@prisma/client";

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function toDec(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null; // Prisma Decimal acepta number
}

function parseEstado(v: any): EstadoContratacion | undefined {
  if (!v) return undefined;
  const s = String(v).toUpperCase().trim();
  const allowed = Object.values(EstadoContratacion) as string[];
  return (allowed.includes(s) ? (s as EstadoContratacion) : undefined);
}

function parseNivel(v: any): NivelComision | undefined {
  if (!v) return undefined;
  const s = String(v).toUpperCase().trim();
  const allowed = Object.values(NivelComision) as string[];
  return (allowed.includes(s) ? (s as NivelComision) : undefined);
}

export async function GET(req: Request) {
  try {
    const ctx = await getTenantContext(req as any);
    if (!ctx.ok) return NextResponse.json({ ok: false, error: ctx.error }, { status: ctx.status });

    const url = new URL(req.url);
    const estado = parseEstado(url.searchParams.get("estado"));
    const take = Number(url.searchParams.get("take") ?? 200);

    const where: any = {};
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;
    if (estado) where.estado = estado;

    // ✅ filtros por rol
    if (ctx.isAgente && ctx.agenteId) where.agenteId = ctx.agenteId;
    if (ctx.isLugar && ctx.lugarId) where.lugarId = ctx.lugarId;

    const items = await (prisma as any).contratacion.findMany({
      where,
      orderBy: { id: "desc" },
      take: Number.isFinite(take) ? take : 200,
      include: {
        seccion: true,
        subSeccion: true,
        lead: true,
        cliente: true,
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json({ ok: true, items: items ?? [] });
  } catch (e: any) {
    console.error("CONTRATACIONES_GET_ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error interno en contrataciones" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getTenantContext(req as any);
    if (!ctx.ok) return NextResponse.json({ ok: false, error: ctx.error }, { status: ctx.status });

    const body = await req.json();

    const data: any = {
      estado: parseEstado(body?.estado) ?? EstadoContratacion.BORRADOR,
      nivel: parseNivel(body?.nivel) ?? NivelComision.C1,

      seccionId: Number(body?.seccionId),
      subSeccionId: body?.subSeccionId ? Number(body?.subSeccionId) : null,

      leadId: body?.leadId ? Number(body.leadId) : null,
      clienteId: body?.clienteId ? Number(body.clienteId) : null,

      agenteId: body?.agenteId ? Number(body.agenteId) : ctx.agenteId ?? null,
      lugarId: body?.lugarId ? Number(body.lugarId) : ctx.lugarId ?? null,

      baseImponible: toDec(body?.baseImponible),
      totalFactura: toDec(body?.totalFactura),
      notas: body?.notas ?? null,

      adminId: ctx.tenantAdminId ?? null,
    };

    if (!data.seccionId || Number.isNaN(data.seccionId)) {
      return NextResponse.json({ ok: false, error: "seccionId requerido" }, { status: 400 });
    }

    const item = await (prisma as any).contratacion.create({
      data,
      include: { seccion: true, subSeccion: true, lead: true, cliente: true },
    });

    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (e: any) {
    console.error("CONTRATACIONES_POST_ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error creando contratación" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getTenantContext(req as any);
    if (!ctx.ok) return NextResponse.json({ ok: false, error: ctx.error }, { status: ctx.status });

    const body = await req.json();
    const id = toId(body?.id);
    if (!id) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

    const nextEstado = parseEstado(body?.estado);
    const nextNivel = parseNivel(body?.nivel);

    const where: any = { id };
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;

    // ✅ filtros por rol: agente/lugar solo pueden tocar lo suyo
    if (ctx.isAgente && ctx.agenteId) where.agenteId = ctx.agenteId;
    if (ctx.isLugar && ctx.lugarId) where.lugarId = ctx.lugarId;

    const item = await (prisma as any).contratacion.update({
      where,
      data: {
        estado: nextEstado ?? undefined,
        nivel: nextNivel ?? undefined,
        notas: body?.notas ?? undefined,
        baseImponible: body?.baseImponible !== undefined ? toDec(body.baseImponible) : undefined,
        totalFactura: body?.totalFactura !== undefined ? toDec(body.totalFactura) : undefined,
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    console.error("CONTRATACIONES_PATCH_ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error actualizando contratación" },
      { status: 500 }
    );
  }
}
