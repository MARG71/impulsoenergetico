// src/app/api/crm/contrataciones/[id]/estado/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

function parseId(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getRole(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
}

type Estado = "BORRADOR" | "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

export async function PATCH(req: NextRequest, ctx: any) {
  try {
    const tenant = await getTenantContext(req);
    if (!tenant.ok) return jsonError(tenant.error, tenant.status);

    const role = getRole(tenant);
    const tenantAdminId = tenant.tenantAdminId ?? null;

    const contratacionId = parseId(ctx?.params?.id);
    if (!contratacionId) return jsonError("ID inválido", 400);

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Body JSON inválido", 400);

    const estado = String(body.estado ?? "") as Estado;
    if (!["BORRADOR", "PENDIENTE", "CONFIRMADA", "CANCELADA"].includes(estado)) {
      return jsonError("Estado no válido", 400, { estado });
    }

    if (estado === "CONFIRMADA" && !["ADMIN", "SUPERADMIN"].includes(role)) {
      return jsonError("Solo ADMIN/SUPERADMIN puede confirmar", 403);
    }

    const contratacion = await prisma.contratacion.findUnique({
      where: { id: contratacionId },
      include: {
        lead: { include: { lugar: true as any, agente: true as any } } as any,
        cliente: true as any,
      } as any,
    });

    if (!contratacion) return jsonError("Contratación no encontrada", 404);

    // ✅ Scope
    if (role !== "SUPERADMIN") {
      if (!tenantAdminId) return jsonError("tenantAdminId no disponible", 400);
      if ((contratacion as any).adminId !== tenantAdminId) {
        return jsonError("No autorizado para esta contratación", 403);
      }
    }

    const effectiveAdminId =
      (contratacion as any).adminId ?? (role === "SUPERADMIN" ? null : tenantAdminId);

    let clienteId = (contratacion as any).clienteId ?? null;

    if (estado === "CONFIRMADA") {
      const lead = (contratacion as any).lead;
      if (!lead) return jsonError("La contratación no tiene lead vinculado", 400);

      const nombre = String(lead.nombre ?? "").trim();
      const email = String(lead.email ?? "").trim().toLowerCase();
      const telefono = String(lead.telefono ?? "").trim();

      const direccionFallback =
        String((lead as any)?.direccion ?? "").trim() ||
        String((lead as any)?.lugar?.direccion ?? "").trim() ||
        "PENDIENTE";

      let cliente: any = null;

      if (email) {
        cliente = await prisma.cliente.findFirst({
          where: {
            ...(effectiveAdminId ? ({ adminId: effectiveAdminId } as any) : {}),
            email,
          } as any,
        });
      }

      if (!cliente && telefono) {
        cliente = await prisma.cliente.findFirst({
          where: {
            ...(effectiveAdminId ? ({ adminId: effectiveAdminId } as any) : {}),
            telefono,
          } as any,
        });
      }

      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            ...(effectiveAdminId ? ({ adminId: effectiveAdminId } as any) : {}),
            nombre: nombre || "Cliente",
            email: email || null,
            telefono: telefono || "",
            direccion: direccionFallback,
          } as any,
        });
      }

      clienteId = cliente.id;
    }

    const updated = await prisma.contratacion.update({
      where: { id: contratacionId },
      data: {
        estado: estado as any,
        ...(estado === "CONFIRMADA"
          ? {
              confirmadaEn: new Date(),
              ...(clienteId ? ({ clienteId } as any) : {}),
            }
          : {}),
      } as any,
    });

    return NextResponse.json({ ok: true, contratacion: updated });
  } catch (e: any) {
    return jsonError("Error interno cambiando estado", 500, {
      message: String(e?.message ?? e),
    });
  }
}
