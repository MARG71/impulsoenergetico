// src/app/api/crm/contrataciones/desde-lead/route.ts

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionAdminId, sessionRole } from "@/lib/auth-server";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function parseId(v: unknown): number | null {
  const n = Number(v);
  if (!n || Number.isNaN(n)) return null;
  return n;
}

async function deducirAdminIdDesdeLead(args: {
  leadId: number;
  leadAdminId: number | null;
  leadLugarId: number | null;
  leadAgenteId: number | null;
  tenantAdminId: number | null;
}) {
  const { leadId, leadAdminId, leadLugarId, leadAgenteId, tenantAdminId } = args;

  if (leadAdminId) return leadAdminId;

  // 1) Por lugar
  if (leadLugarId) {
    const lugar = await prisma.lugar.findUnique({
      where: { id: leadLugarId },
      select: { adminId: true },
    });
    if (lugar?.adminId) {
      await prisma.lead.update({ where: { id: leadId }, data: { adminId: lugar.adminId } });
      return lugar.adminId;
    }
  }

  // 2) Por agente
  if (leadAgenteId) {
    const agente = await prisma.agente.findUnique({
      where: { id: leadAgenteId },
      select: { adminId: true },
    });
    if (agente?.adminId) {
      await prisma.lead.update({ where: { id: leadId }, data: { adminId: agente.adminId } });
      return agente.adminId;
    }
  }

  // 3) Fallback tenant (SUPERADMIN tenant mode)
  if (tenantAdminId) {
    await prisma.lead.update({ where: { id: leadId }, data: { adminId: tenantAdminId } });
    return tenantAdminId;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const session = await getSessionOrThrow();
    const role = (sessionRole(session) ?? null) as Rol | null;

    // admin del usuario logado (ADMIN/AGENTE/LUGAR suele venir aquí)
    const myAdminId = sessionAdminId(session);

    // tenant mode: por query o body
    const url = new URL(req.url);
    const tenantAdminIdFromQuery = parseId(url.searchParams.get("adminId"));

    const body = await req.json().catch(() => ({}));
    const leadId = parseId(body?.leadId);
    const seccionId = parseId(body?.seccionId); // ✅ REQUIRED
    const tenantAdminIdFromBody = parseId(body?.adminId ?? body?.tenantAdminId);

    const tenantAdminId = tenantAdminIdFromBody ?? tenantAdminIdFromQuery ?? null;

    if (!leadId) {
      return NextResponse.json({ ok: false, error: "leadId requerido" }, { status: 400 });
    }

    // ✅ Tu Prisma exige seccionId
    if (!seccionId) {
      return NextResponse.json(
        { ok: false, error: "seccionId requerido (tu modelo Contratacion lo exige)" },
        { status: 400 }
      );
    }

    // Cargar lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        adminId: true,
        agenteId: true,
        lugarId: true,
        nombre: true,
        email: true,
        telefono: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ ok: false, error: "Lead no encontrado" }, { status: 404 });
    }

    // Resolver admin objetivo
    const adminObjetivo =
      role === "SUPERADMIN" ? (tenantAdminId ?? lead.adminId ?? null) : myAdminId;

    if (role === "SUPERADMIN" && !adminObjetivo) {
      return NextResponse.json(
        { ok: false, error: "Falta adminId en tenant mode. Pasa ?adminId=XX o envía adminId en body." },
        { status: 400 }
      );
    }

    if (!adminObjetivo) {
      return NextResponse.json({ ok: false, error: "No se pudo resolver adminId del usuario" }, { status: 403 });
    }

    // Seguridad: si NO eres SUPERADMIN, no puedes operar fuera de tu adminId
    if (role !== "SUPERADMIN") {
      if (!myAdminId || myAdminId !== adminObjetivo) {
        return NextResponse.json({ ok: false, error: "Acceso denegado (tenant)" }, { status: 403 });
      }
    }

    // Bloqueo mezcla tenants
    if (lead.adminId && lead.adminId !== adminObjetivo) {
      return NextResponse.json(
        { ok: false, error: "El lead pertenece a otro admin (tenant). No se puede crear contratación en este tenant." },
        { status: 403 }
      );
    }

    // Deducir adminId si falta y persistir
    const adminIdFinal = await deducirAdminIdDesdeLead({
      leadId: lead.id,
      leadAdminId: lead.adminId ?? null,
      leadLugarId: lead.lugarId ?? null,
      leadAgenteId: lead.agenteId ?? null,
      tenantAdminId: adminObjetivo,
    });

    if (!adminIdFinal) {
      return NextResponse.json(
        { ok: false, error: "No se pudo determinar adminId para el lead (necesario para crear contratación)." },
        { status: 400 }
      );
    }

    // ✅ (Opcional pero recomendable) verificar que la seccion pertenece al tenant
    const seccion = await prisma.seccion.findUnique({
    where: { id: seccionId },
    select: { id: true },
    });

    if (!seccion) {
    return NextResponse.json(
        { ok: false, error: "Sección no encontrada" },
        { status: 404 }
    );
    }


    // Crear contratación con trazabilidad total + seccionId
    const contratacion = await prisma.contratacion.create({
      data: {
        adminId: adminIdFinal,
        leadId: lead.id,
        agenteId: lead.agenteId ?? null,
        lugarId: lead.lugarId ?? null,
        seccionId, // ✅ REQUIRED
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, contratacionId: contratacion.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error inesperado" }, { status: 500 });
  }
}
