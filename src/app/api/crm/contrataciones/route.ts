// src/app/api/crm/contrataciones/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { EstadoContratacion, NivelComision } from "@prisma/client";

function jsonError(status: number, message: string, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
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

function getRole(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
}

function canConfirm(tenant: any) {
  const role = getRole(tenant);
  return role === "SUPERADMIN" || role === "ADMIN";
}

function safeTrimLower(v: any): string | null {
  return typeof v === "string" && v.trim() ? v.trim().toLowerCase() : null;
}

function safeTrim(v: any): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = getRole(tenant);

  const estadoQ = asEstado(req.nextUrl.searchParams.get("estado"));
  const where: any = {};

  // ✅ SUPERADMIN: ve todo
  // ✅ ADMIN: solo su adminId
  if (role !== "SUPERADMIN") {
    if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;
    else return jsonError(400, "tenantAdminId no disponible");
  }

  if (estadoQ) where.estado = estadoQ;

  try {
    const items = await prisma.contratacion.findMany({
        where,
        orderBy: { id: "desc" },
        take: 200,
        include: {
            // ✅ Nombres para mostrar “a quién pertenece”
            admin: { select: { id: true, nombre: true, email: true } },
            agente: { select: { id: true, nombre: true, email: true, telefono: true } },
            lugar: { select: { id: true, nombre: true, direccion: true } },

            // ✅ Cliente/Lead
            cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
            lead: { select: { id: true, nombre: true, email: true, telefono: true } },

            // ✅ Sección/Subsección (nombres)
            seccion: { select: { id: true, nombre: true, slug: true } },
            subSeccion: { select: { id: true, nombre: true, slug: true } },

            documentos: { orderBy: { id: "desc" }, take: 20 },
        },
    });


    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("GET /api/crm/contrataciones error:", e);
    return jsonError(500, "Error cargando contrataciones");
  }
}

export async function POST(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = getRole(tenant);
  const body = await req.json().catch(() => ({}));

  // ✅ leadId (por si viene desde botón del lead)
  const leadId = toId(body?.leadId);

  // ✅ seccionId: si no viene, intentamos default "luz"
  let seccionId = toId(body?.seccionId);

  // ✅ adminId resuelto
  let resolvedAdminId: number | null = null;

  // 1) SUPERADMIN: si viene adminId en body, ok; si no, intentar deducirlo del lead
  if (role === "SUPERADMIN") {
    resolvedAdminId = toId(body?.adminId) ?? null;

    if (!resolvedAdminId && leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { adminId: true },
      });
      resolvedAdminId = (lead?.adminId ?? null) as any;
    }

    if (!resolvedAdminId) {
      return jsonError(
        400,
        "Como SUPERADMIN, debes enviar adminId o un leadId con adminId para crear la contratación"
      );
    }
  } else {
    // 2) ADMIN/otros: adminId siempre desde tenant
    resolvedAdminId = tenant.tenantAdminId ?? null;
    if (!resolvedAdminId) return jsonError(400, "tenantAdminId no disponible");
  }

  // ✅ si aún no tenemos seccionId: intentamos buscar la sección 'luz' dentro del tenant
  if (!seccionId) {
    const luz = await prisma.seccion.findFirst({
      where: {
        slug: "luz",
        activa: true,
        ...(role === "SUPERADMIN" ? {} : { adminId: resolvedAdminId }),
      } as any,
      select: { id: true },
    });
    seccionId = luz?.id ?? null;
  }

  if (!seccionId) {
    return jsonError(400, "seccionId es obligatorio (no existe sección 'luz' por defecto)");
  }

  const subSeccionId = toId(body?.subSeccionId);

  const data: any = {
    adminId: resolvedAdminId,
    seccionId,
    subSeccionId: subSeccionId ?? null,
    notas: typeof body?.notas === "string" ? body.notas : null,
    agenteId: toId(body?.agenteId),
    lugarId: toId(body?.lugarId),
    leadId: leadId,
    baseImponible: body?.baseImponible ?? null,
    totalFactura: body?.totalFactura ?? null,
  };

  const est = asEstado(body?.estado);
  if (est) data.estado = est;

  const niv = asNivel(body?.nivel);
  if (niv) data.nivel = niv;

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

  const role = getRole(tenant);
  const adminId = tenant.tenantAdminId; // puede ser null en SUPERADMIN

  const body = await req.json().catch(() => ({}));
  const id = toId(body?.id);
  if (!id) return jsonError(400, "id es obligatorio");

  // ✅ Scope:
  // - ADMIN: { id, adminId }
  // - SUPERADMIN: { id }
  const whereTenant: any = role === "SUPERADMIN" ? { id } : { id, adminId };

  if (role !== "SUPERADMIN" && !adminId) {
    return jsonError(400, "tenantAdminId no disponible");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.contratacion.findFirst({
        where: whereTenant,
        select: { id: true, estado: true, leadId: true, clienteId: true, adminId: true },
      });

      if (!current) throw new Error("Contratación no encontrada");

      // Para SUPERADMIN, operamos con el adminId real del registro
      const effectiveAdminId = role === "SUPERADMIN" ? (current as any).adminId : adminId;

      const data: any = {};

      const est = asEstado(body?.estado);
      if (est) data.estado = est;

      const niv = asNivel(body?.nivel);
      if (niv) data.nivel = niv;

      if (typeof body?.notas === "string") data.notas = body.notas;

      if (body?.baseImponible !== undefined) {
        data.baseImponible = body.baseImponible === null ? null : body.baseImponible;
      }

      if (body?.totalFactura !== undefined) {
        data.totalFactura = body.totalFactura === null ? null : body.totalFactura;
      }

      // ✅ Si pasa a CONFIRMADA => crear/vincular cliente + confirmadaEn
      if (est === "CONFIRMADA") {
        if (!canConfirm(tenant)) throw new Error("No autorizado para confirmar");

        if (current.estado !== "CONFIRMADA") {
          let clienteId = current.clienteId ?? null;

          if (!clienteId && current.leadId) {
            const lead = await tx.lead.findFirst({
              where: {
                id: current.leadId,
                ...(effectiveAdminId ? ({ adminId: effectiveAdminId } as any) : {}),
              } as any,
              select: { nombre: true, email: true, telefono: true, direccion: true } as any,
            });

            const leadNombre = safeTrim((lead as any)?.nombre);
            if (!lead || !leadNombre) throw new Error("El lead no tiene nombre");

            const email = safeTrimLower((lead as any)?.email);
            const telefono = safeTrim((lead as any)?.telefono);
            const direccion = safeTrim((lead as any)?.direccion) || "PENDIENTE";

            const existing = await tx.cliente.findFirst({
              where: {
                ...(effectiveAdminId ? ({ adminId: effectiveAdminId } as any) : {}),
                OR: [
                  ...(email ? [{ email }] : []),
                  ...(telefono ? [{ telefono }] : []),
                ],
              } as any,
              select: { id: true },
            });

            if (existing) {
              clienteId = existing.id;
              await tx.cliente.update({
                where: { id: existing.id },
                data: {
                  nombre: leadNombre,
                  ...(email ? { email } : {}),
                  ...(telefono ? { telefono } : {}),
                } as any,
              });
            } else {
              const createdCliente = await tx.cliente.create({
                data: {
                  ...(effectiveAdminId ? ({ adminId: effectiveAdminId } as any) : {}),
                  nombre: leadNombre || "Cliente",
                  email,
                  telefono: telefono || "",
                  direccion,
                } as any,
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
