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

/**
 * IMPORTANTÍSIMO:
 * - Si eres ADMIN -> tenant.tenantAdminId debe venir siempre.
 * - Si eres SUPERADMIN en modo tenant -> idealmente getTenantContext debe meter tenantAdminId
 *   leyendo ?adminId=XX (o tu mecanismo). Si no lo hace, te lo ajusto luego.
 */

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = getRole(tenant);
  const estadoQ = asEstado(req.nextUrl.searchParams.get("estado"));

  const where: any = {};

  // ✅ ADMIN/otros: scope por adminId
  // ✅ SUPERADMIN: ve todo (o si getTenantContext “fuerza” tenantAdminId, puedes filtrar)
  if (role !== "SUPERADMIN") {
    if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;
    else return jsonError(400, "tenantAdminId no disponible");
  } else {
    // opcional: si estás usando “modo tenant” y getTenantContext rellena tenantAdminId,
    // aquí puedes filtrar para ver solo ese admin en la lista:
    // if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;
  }

  if (estadoQ) where.estado = estadoQ;

  try {
    const items = await prisma.contratacion.findMany({
      where,
      orderBy: { id: "desc" },
      take: 200,
      include: {
        admin: { select: { id: true, nombre: true, email: true } },
        agente: { select: { id: true, nombre: true, email: true, telefono: true } },
        lugar: { select: { id: true, nombre: true, direccion: true } },

        cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
        lead: { select: { id: true, nombre: true, email: true, telefono: true } },

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

  const leadId = toId(body?.leadId);
  let seccionId = toId(body?.seccionId);

  // ✅ adminId resuelto
  let resolvedAdminId: number | null = null;

  if (role === "SUPERADMIN") {
    // SUPERADMIN: puede venir adminId explícito, o deducido del lead
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
    // ADMIN/otros: adminId siempre desde tenant
    resolvedAdminId = tenant.tenantAdminId ?? null;
    if (!resolvedAdminId) return jsonError(400, "tenantAdminId no disponible");
  }

  // ✅ si aún no tenemos seccionId: intentamos 'luz'
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

  // ✅ AUTOFILL agente/lugar desde lead si vienen vacíos
  let resolvedAgenteId: number | null = toId(body?.agenteId);
  let resolvedLugarId: number | null = toId(body?.lugarId);

  if (leadId && (!resolvedAgenteId || !resolvedLugarId)) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { agenteId: true, lugarId: true, adminId: true },
    });

    // seguridad tenant
    if (role !== "SUPERADMIN" && lead?.adminId && lead.adminId !== resolvedAdminId) {
      return jsonError(403, "Lead fuera de tu tenant");
    }

    if (!resolvedAgenteId) resolvedAgenteId = (lead?.agenteId ?? null) as any;
    if (!resolvedLugarId) resolvedLugarId = (lead?.lugarId ?? null) as any;
  }

  const data: any = {
    adminId: resolvedAdminId,
    seccionId,
    subSeccionId: subSeccionId ?? null,

    notas: typeof body?.notas === "string" ? body.notas : null,

    agenteId: resolvedAgenteId,
    lugarId: resolvedLugarId,
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
      include: {
        admin: { select: { id: true, nombre: true, email: true } },
        agente: { select: { id: true, nombre: true, email: true, telefono: true } },
        lugar: { select: { id: true, nombre: true, direccion: true } },

        cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
        lead: { select: { id: true, nombre: true, email: true, telefono: true } },

        seccion: { select: { id: true, nombre: true, slug: true } },
        subSeccion: { select: { id: true, nombre: true, slug: true } },

        documentos: { orderBy: { id: "desc" }, take: 20 },
      },
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

  const whereTenant: any = role === "SUPERADMIN" ? { id } : { id, adminId };

  if (role !== "SUPERADMIN" && !adminId) {
    return jsonError(400, "tenantAdminId no disponible");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.contratacion.findFirst({
        where: whereTenant,
        select: {
          id: true,
          estado: true,
          leadId: true,
          clienteId: true,
          adminId: true,
          agenteId: true,
          lugarId: true,
        },
      });

      if (!current) throw new Error("Contratación no encontrada");

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

      // ✅ Si pasa a CONFIRMADA => crear/vincular cliente + confirmadaEn + (autofill agente/lugar)
      if (est === "CONFIRMADA") {
        if (!canConfirm(tenant)) throw new Error("No autorizado para confirmar");

        if (current.estado !== "CONFIRMADA") {
          let clienteId = current.clienteId ?? null;

          let leadData: any = null;

          if (current.leadId) {
            leadData = await tx.lead.findFirst({
              where: {
                id: current.leadId,
                ...(effectiveAdminId ? ({ adminId: effectiveAdminId } as any) : {}),
              } as any,
              select: {
                nombre: true,
                email: true,
                telefono: true,
                direccion: true,
                agenteId: true,
                lugarId: true,
              } as any,
            });
          }

          // ✅ autofill agente/lugar desde lead si están vacíos
          if (!current.agenteId && (leadData as any)?.agenteId) {
            data.agenteId = (leadData as any).agenteId;
          }
          if (!current.lugarId && (leadData as any)?.lugarId) {
            data.lugarId = (leadData as any).lugarId;
          }

          // ✅ crear/vincular cliente desde lead si no existe
          if (!clienteId && current.leadId) {
            const leadNombre = safeTrim((leadData as any)?.nombre);
            if (!leadData || !leadNombre) throw new Error("El lead no tiene nombre");

            const email = safeTrimLower((leadData as any)?.email);
            const telefono = safeTrim((leadData as any)?.telefono);
            const direccion = safeTrim((leadData as any)?.direccion) || "PENDIENTE";

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
