// src/app/api/crm/contrataciones/route.ts
// src/app/api/crm/contrataciones/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { EstadoContratacion, NivelComision } from "@prisma/client";

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toDec(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function isEstado(v: any): v is EstadoContratacion {
  return Object.values(EstadoContratacion).includes(v);
}

function isNivel(v: any): v is NivelComision {
  return Object.values(NivelComision).includes(v);
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { isSuperadmin, tenantAdminId, isAdmin, isAgente, isLugar, agenteId, lugarId } = ctx;

    const url = new URL(req.url);
    const take = Math.min(Number(url.searchParams.get("take") ?? 200) || 200, 500);
    const estadoParam = url.searchParams.get("estado") ?? "";
    const estado = isEstado(estadoParam) ? estadoParam : null;

    const where: any = {};

    // ✅ MULTI-TENANT:
    // Como tu Contratacion puede no tener adminId directo (según cómo lo migraras),
    // filtramos por:
    // - cliente.adminId (si hay cliente)
    // - lead.adminId (si hay lead)
    //
    // SUPERADMIN:
    // - tenantAdminId => filtra
    // - sin tenantAdminId => global
    if (!isSuperadmin) {
      if (tenantAdminId) {
        where.OR = [
          { cliente: { adminId: tenantAdminId } },
          { lead: { adminId: tenantAdminId } },
        ];
      }
    } else {
      if (tenantAdminId) {
        where.OR = [
          { cliente: { adminId: tenantAdminId } },
          { lead: { adminId: tenantAdminId } },
        ];
      }
    }

    if (estado) where.estado = estado;

    // ✅ Restricción por rol
    if (isAgente) where.agenteId = agenteId ?? -1;
    if (isLugar) where.lugarId = lugarId ?? -1;

    const items = await prisma.contratacion.findMany({
      where,
      orderBy: { id: "desc" },
      take,
      include: {
        lead: { select: { id: true, nombre: true, email: true, telefono: true, adminId: true } },
        cliente: true,
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
        seccion: true,
        subSeccion: true,
        documentos: { orderBy: { id: "desc" } },
      },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("GET /api/crm/contrataciones error:", e);
    return NextResponse.json({ ok: false, error: "Error interno cargando contrataciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { isSuperadmin, isAdmin, isAgente, tenantAdminId, agenteId } = ctx;

    // ✅ quién puede crear
    if (!(isSuperadmin || isAdmin || isAgente)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();

    const seccionId = toId(body?.seccionId);
    if (!seccionId) return NextResponse.json({ error: "seccionId requerido" }, { status: 400 });

    const subSeccionId = toId(body?.subSeccionId);

    const data: any = {
      seccionId,
      subSeccionId: subSeccionId ?? null,

      estado: isEstado(body?.estado) ? body.estado : EstadoContratacion.BORRADOR,
      nivel: isNivel(body?.nivel) ? body.nivel : NivelComision.C1,

      leadId: toId(body?.leadId),
      clienteId: toId(body?.clienteId),

      // Si crea un AGENTE, forzamos agenteId al suyo.
      agenteId: isAgente ? (agenteId ?? null) : toId(body?.agenteId),
      lugarId: toId(body?.lugarId),

      baseImponible: body?.baseImponible !== undefined ? toDec(body.baseImponible) : null,
      totalFactura: body?.totalFactura !== undefined ? toDec(body.totalFactura) : null,

      notas: typeof body?.notas === "string" ? body.notas : null,
    };

    const item = await prisma.contratacion.create({
      data,
      include: {
        lead: { select: { id: true, nombre: true, email: true, telefono: true, adminId: true } },
        cliente: true,
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
        seccion: true,
        subSeccion: true,
        documentos: true,
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    console.error("POST /api/crm/contrataciones error:", e);
    return NextResponse.json({ ok: false, error: "Error interno creando contratación" }, { status: 500 });
  }
}
