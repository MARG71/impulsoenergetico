export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionRole,
  sessionAdminId,
} from "@/lib/auth-server";

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

type Estado = "BORRADOR" | "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const adminId = sessionAdminId(session);

    const { id } = await ctx.params;
    const contratacionId = parseId(id);
    if (!contratacionId) return jsonError("ID inválido", 400);

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Body JSON inválido", 400);

    const estado = String(body.estado ?? "") as Estado;
    if (!["BORRADOR", "PENDIENTE", "CONFIRMADA", "CANCELADA"].includes(estado)) {
      return jsonError("Estado no válido", 400, { estado });
    }

    // Si confirmas, solo ADMIN/SUPERADMIN
    if (estado === "CONFIRMADA" && !["ADMIN", "SUPERADMIN"].includes(String(role))) {
      return jsonError("Solo ADMIN/SUPERADMIN puede confirmar", 403);
    }

    const contratacion = await prisma.contratacion.findUnique({
      where: { id: contratacionId },
      include: {
        lead: {
          include: {
            lugar: true as any,
            agente: true as any,
          },
        } as any,
        cliente: true as any,
      } as any,
    });

    if (!contratacion) return jsonError("Contratación no encontrada", 404);

    // Multi-tenant: si tu contratacion tiene adminId, valida
    if ((contratacion as any).adminId && (contratacion as any).adminId !== adminId) {
      return jsonError("No autorizado para esta contratación", 403);
    }

    // Si se confirma -> crear/vincular cliente
    let clienteId = (contratacion as any).clienteId ?? null;

    if (estado === "CONFIRMADA") {
      const lead = (contratacion as any).lead;
      if (!lead) return jsonError("La contratación no tiene lead vinculado", 400);

      const nombre = String(lead.nombre ?? "").trim();
      const email = String(lead.email ?? "").trim();
      const telefono = String(lead.telefono ?? "").trim();

      // Fallback de dirección si Cliente la requiere
      const direccionFallback =
        String((lead as any)?.direccion ?? "").trim() ||
        String((lead as any)?.lugar?.direccion ?? "").trim() ||
        "Sin dirección";

      // 1) Buscar cliente por email o teléfono (ajusta a tu lógica)
      let cliente = null as any;

      if (email) {
        cliente = await prisma.cliente.findFirst({
          where: {
            ...(adminId ? ({ adminId } as any) : {}),
            email,
          } as any,
        });
      }

      if (!cliente && telefono) {
        cliente = await prisma.cliente.findFirst({
          where: {
            ...(adminId ? ({ adminId } as any) : {}),
            telefono,
          } as any,
        });
      }

      // 2) Crear si no existe
      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            ...(adminId ? ({ adminId } as any) : {}),
            nombre: nombre || "Cliente",
            email: email || null,
            telefono: telefono || "",
            direccion: direccionFallback, // <- evita tu crash
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
