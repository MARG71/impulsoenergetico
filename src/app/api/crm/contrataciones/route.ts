// src/app/api/crm/contrataciones/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { EstadoContratacion, NivelComision } from "@prisma/client";

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function asEstado(v: any): EstadoContratacion | null {
  if (!v) return null;
  const s = String(v).toUpperCase();
  return (Object.values(EstadoContratacion) as string[]).includes(s)
    ? (s as EstadoContratacion)
    : null;
}

function asNivel(v: any): NivelComision | null {
  if (!v) return null;
  const s = String(v).toUpperCase();
  return (Object.values(NivelComision) as string[]).includes(s)
    ? (s as NivelComision)
    : null;
}

// Si getTenantContext te da rol, úsalo.
// Si no, esta función no rompe nada.
function canConfirm(tenant: any) {
  const role = String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
  return role === "SUPERADMIN" || role === "ADMIN";
}

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const estadoQ = asEstado(req.nextUrl.searchParams.get("estado"));
  const where: any = {};

  if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;
  if (estadoQ) where.estado = estadoQ;

  try {
    const items = await prisma.contratacion.findMany({
      where,
      orderBy: { id: "desc" },
      take: 200,
      include: {
        cliente: true,
        lead: true,
        seccion: true,
        subSeccion: true,
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
        documentos: { orderBy: { id: "desc" }, take: 20 },
      },
    });

    // IMPORTANTE: tu front debe leer json.items (no un array directo)
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("GET /api/crm/contrataciones error:", e);
    return jsonError(500, "Error cargando contrataciones");
  }
}

export async function POST(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const body = await req.json().catch(() => ({}));

  const seccionId = toId(body?.seccionId);
  if (!seccionId) return jsonError(400, "seccionId es obligatorio");

  const subSeccionId = toId(body?.subSeccionId);

  const data: any = {
    seccionId,
    subSeccionId: subSeccionId ?? null,
    notas: typeof body?.notas === "string" ? body.notas : null,
    agenteId: toId(body?.agenteId),
    lugarId: toId(body?.lugarId),
    leadId: toId(body?.leadId),
    baseImponible: body?.baseImponible ?? null,
    totalFactura: body?.totalFactura ?? null,
  };

  const est = asEstado(body?.estado);
  if (est) data.estado = est;

  const niv = asNivel(body?.nivel);
  if (niv) data.nivel = niv;

  if (tenant.tenantAdminId != null) data.adminId = tenant.tenantAdminId;

  try {
    const created = await prisma.contratacion.create({
      data,
      include: { seccion: true, subSeccion: true, cliente: true, lead: true },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    console.error("POST /api/crm/contrataciones error:", e);
    return jsonError(500, "Error creando contratación");
  }
}

export async function PATCH(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const adminId = tenant.tenantAdminId;
  if (!adminId) return jsonError(400, "tenantAdminId no disponible");

  const body = await req.json().catch(() => ({}));
  const id = toId(body?.id);
  if (!id) return jsonError(400, "id es obligatorio");

  // 🔒 scope tenant
  const whereTenant: any = { id, adminId };

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.contratacion.findFirst({
        where: whereTenant,
        select: {
          id: true,
          estado: true,
          leadId: true,
          clienteId: true,
        },
      });

      if (!current) throw new Error("Contratación no encontrada");

      const data: any = {};

      const est = asEstado(body?.estado);
      if (est) data.estado = est;

      const niv = asNivel(body?.nivel);
      if (niv) data.nivel = niv;

      if (typeof body?.notas === "string") data.notas = body.notas;

      if (body?.baseImponible !== undefined) data.baseImponible = body.baseImponible === null ? null : body.baseImponible;
      if (body?.totalFactura !== undefined) data.totalFactura = body.totalFactura === null ? null : body.totalFactura;

      // ✅ Si pasa a CONFIRMADA => crear/vincular cliente + confirmadaEn
      if (est === "CONFIRMADA") {
        if (!canConfirm(tenant)) {
          throw new Error("No autorizado para confirmar");
        }

        // idempotencia: si ya confirmada, no repite
        if (current.estado !== "CONFIRMADA") {
          let clienteId = current.clienteId ?? null;

          if (!clienteId && current.leadId) {
            const lead = await tx.lead.findFirst({
              where: { id: current.leadId, adminId },
              select: { nombre: true, email: true, telefono: true },
            });

            if (!lead?.nombre) throw new Error("El lead no tiene nombre");

            const email = lead.email?.trim().toLowerCase() || null;
            const telefono = lead.telefono?.trim() || null;

            const existing = await tx.cliente.findFirst({
              where: {
                adminId,
                OR: [
                  ...(email ? [{ email }] : []),
                  ...(telefono ? [{ telefono }] : []),
                ],
              },
              select: { id: true },
            });

            if (existing) {
              clienteId = existing.id;
              await tx.cliente.update({
                where: { id: existing.id },
                data: {
                  nombre: lead.nombre,
                  email: email ?? undefined,
                  telefono: telefono ?? undefined,
                },
              });
            } else {
              const createdCliente = await tx.cliente.create({
                data: { adminId, nombre: lead.nombre, email, telefono },
                select: { id: true },
              });
              clienteId = createdCliente.id;
            }
          }

          data.clienteId = clienteId ?? undefined;
          data.confirmadaEn = new Date();
        }
      }

      return await tx.contratacion.update({
        where: { id },
        data,
      });
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    console.error("PATCH /api/crm/contrataciones error:", e);
    return jsonError(500, e?.message || "Error actualizando contratación");
  }
}
