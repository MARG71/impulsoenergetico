// src/app/api/crm/leads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionAdminId,
  sessionAgenteId,
  sessionRole,
} from "@/lib/auth-server";

function leadIdFromPath(req: NextRequest) {
  const idStr = req.nextUrl.pathname.split("/").pop();
  const leadId = Number(idStr);
  return leadId;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);
    const agenteId = sessionAgenteId(session);

    const leadId = leadIdFromPath(req);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json({ error: "ID no válido" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
      },
    });

    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    if (role !== "SUPERADMIN") {
      if ((lead.adminId ?? null) !== tenantAdminId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    return NextResponse.json(lead);
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("GET lead crm error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);
    const agenteId = sessionAgenteId(session);
    const usuarioId = Number((session.user as any).id);

    const leadId = leadIdFromPath(req);
    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json({ error: "ID no válido" }, { status: 400 });
    }

    const existente = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        adminId: true,
        agenteId: true,
        estado: true,
        notas: true,
        proximaAccion: true,
        proximaAccionEn: true,
      },
    });

    if (!existente) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    if (role !== "SUPERADMIN") {
      if ((existente.adminId ?? null) !== tenantAdminId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (role === "AGENTE" && agenteId && existente.agenteId !== agenteId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => ({}));

    const nextEstado = body?.estado ? String(body.estado) : null;
    const nextNotas = Object.prototype.hasOwnProperty.call(body, "notas") ? (body.notas ? String(body.notas) : null) : undefined;
    const nextAccion = Object.prototype.hasOwnProperty.call(body, "proximaAccion") ? (body.proximaAccion ? String(body.proximaAccion) : null) : undefined;
    const nextAccionEn = Object.prototype.hasOwnProperty.call(body, "proximaAccionEn")
      ? (body.proximaAccionEn ? new Date(String(body.proximaAccionEn)) : null)
      : undefined;

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(nextEstado ? { estado: nextEstado } : {}),
        ...(nextNotas !== undefined ? { notas: nextNotas } : {}),
        ...(nextAccion !== undefined ? { proximaAccion: nextAccion } : {}),
        ...(nextAccionEn !== undefined ? { proximaAccionEn: nextAccionEn } : {}),
      },
      include: {
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
      },
    });

    // ✅ Actividades automáticas:
    const actividadesToCreate: Array<{ tipo: string; titulo: string; detalle?: string | null }> = [];

    if (nextEstado && nextEstado !== (existente.estado || "pendiente")) {
      actividadesToCreate.push({
        tipo: "estado",
        titulo: "Cambio de estado",
        detalle: `${(existente.estado || "pendiente").toUpperCase()} → ${nextEstado.toUpperCase()}`,
      });
    }

    if (nextNotas !== undefined && (nextNotas || "") !== (existente.notas || "")) {
      actividadesToCreate.push({
        tipo: "nota",
        titulo: "Nota actualizada",
        detalle: (nextNotas || "").slice(0, 600) || "(vacía)",
      });
    }

    const oldAccion = existente.proximaAccion || "";
    const oldAccionEn = existente.proximaAccionEn ? new Date(existente.proximaAccionEn).toISOString() : "";

    const newAccion = nextAccion !== undefined ? (nextAccion || "") : oldAccion;
    const newAccionEn = nextAccionEn !== undefined ? (nextAccionEn ? nextAccionEn.toISOString() : "") : oldAccionEn;

    if (newAccion !== oldAccion || newAccionEn !== oldAccionEn) {
      actividadesToCreate.push({
        tipo: "accion",
        titulo: "Próxima acción",
        detalle: `${newAccion || "—"} ${newAccionEn ? "· " + new Date(newAccionEn).toLocaleString("es-ES") : ""}`,
      });
    }

    if (actividadesToCreate.length) {
      await prisma.leadActividad.createMany({
        data: actividadesToCreate.map((a) => ({
          leadId,
          tipo: a.tipo,
          titulo: a.titulo,
          detalle: a.detalle ?? null,
          usuarioId,
          adminId: existente.adminId ?? tenantAdminId ?? null,
        })),
      });
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("PATCH lead crm error:", e);
    return NextResponse.json({ error: "Error guardando" }, { status: 500 });
  }
}
