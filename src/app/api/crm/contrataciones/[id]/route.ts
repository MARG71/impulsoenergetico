// src/app/api/crm/contrataciones/[id]/route.ts
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

export async function PATCH(req: NextRequest, ctx: any) {
  try {
    const id = toId(ctx?.params?.id);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const t = await getTenantContext(req);
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

    const { isSuperadmin, isAdmin, isAgente, isLugar, tenantAdminId, agenteId, lugarId } = t;

    // Solo ADMIN/SUPERADMIN/AGENTE pueden editar (LUGAR no)
    if (!(isSuperadmin || isAdmin || isAgente)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();

    // ✅ Seguridad: primero comprobamos que existe y está en tu scope tenant/rol
    const whereCheck: any = { id };

    if (!isSuperadmin) {
      if (tenantAdminId) {
        whereCheck.OR = [
          { cliente: { adminId: tenantAdminId } },
          { lead: { adminId: tenantAdminId } },
        ];
      }
    } else {
      if (tenantAdminId) {
        whereCheck.OR = [
          { cliente: { adminId: tenantAdminId } },
          { lead: { adminId: tenantAdminId } },
        ];
      }
    }

    if (isAgente) whereCheck.agenteId = agenteId ?? -1;
    if (isLugar) whereCheck.lugarId = lugarId ?? -1;

    const found = await prisma.contratacion.findFirst({ where: whereCheck, select: { id: true } });
    if (!found) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const data: any = {};

    if (body?.estado !== undefined) {
      if (!isEstado(body.estado)) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
      data.estado = body.estado;
      if (body.estado === EstadoContratacion.CONFIRMADA) {
        data.confirmadaEn = new Date();
      }
    }

    if (body?.nivel !== undefined) {
      if (!isNivel(body.nivel)) return NextResponse.json({ error: "Nivel inválido" }, { status: 400 });
      data.nivel = body.nivel;
    }

    if (body?.notas !== undefined) data.notas = typeof body.notas === "string" ? body.notas : null;
    if (body?.baseImponible !== undefined) data.baseImponible = toDec(body.baseImponible);
    if (body?.totalFactura !== undefined) data.totalFactura = toDec(body.totalFactura);

    const item = await prisma.contratacion.update({
      where: { id },
      data,
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

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    console.error("PATCH /api/crm/contrataciones/[id] error:", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
