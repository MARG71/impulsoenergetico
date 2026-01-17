// src/app/api/crm/leads/[id]/route.ts
// src/app/api/crm/leads/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function getIdFromPath(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  const idStr = parts[parts.length - 1];
  const id = Number(idStr);
  return Number.isFinite(id) ? id : null;
}

function tenantWhereFromToken(token: any) {
  const role = (token?.role as Role | undefined) || undefined;

  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";
  const isAgente = role === "AGENTE";
  const isLugar = role === "LUGAR";

  // 🔐 Tenant adminId:
  // - ADMIN: su tenant es su propio id
  // - AGENTE/LUGAR: tenant = token.adminId (lo setea authOptions)
  // - SUPERADMIN: sin filtro
  const tenantAdminId =
    isAdmin ? Number(token?.id) : Number(token?.adminId ?? null);

  const where: any = {};

  if (!isSuperadmin) {
    if (!tenantAdminId || !Number.isFinite(tenantAdminId)) {
      // Si no hay adminId en un rol que lo requiere, bloqueamos
      return { error: "Tenant no resuelto", where: null };
    }
    where.adminId = tenantAdminId;
  }

  // Restricciones por rol
  if (isAgente) {
    const agenteId = Number(token?.agenteId ?? null);
    if (!agenteId || !Number.isFinite(agenteId)) {
      return { error: "agenteId no válido", where: null };
    }
    where.agenteId = agenteId;
  }

  if (isLugar) {
    const lugarId = Number(token?.lugarId ?? null);
    if (!lugarId || !Number.isFinite(lugarId)) {
      return { error: "lugarId no válido", where: null };
    }
    where.lugarId = lugarId;
  }

  return { error: null, where };
}

// ✅ GET /api/crm/leads/[id]
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const id = getIdFromPath(req);
    if (!id) return NextResponse.json({ error: "ID no válido" }, { status: 400 });

    const { error, where } = tenantWhereFromToken(token);
    if (error || !where) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const lead = await prisma.lead.findFirst({
      where: { id, ...where },
      include: {
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
      },
    });

    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    return NextResponse.json(lead);
  } catch (e) {
    console.error("GET lead error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ✅ PATCH /api/crm/leads/[id]
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const id = getIdFromPath(req);
    if (!id) return NextResponse.json({ error: "ID no válido" }, { status: 400 });

    const { error, where } = tenantWhereFromToken(token);
    if (error || !where) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    // Campos permitidos (ajusta si quieres)
    const data: any = {};

    if (typeof body.estado === "string") data.estado = body.estado;
    if (typeof body.notas === "string") data.notas = body.notas;
    if (typeof body.proximaAccion === "string") data.proximaAccion = body.proximaAccion;

    // proximaAccionEn puede venir como ISO string o null
    if (body.proximaAccionEn === null) {
      data.proximaAccionEn = null;
    } else if (typeof body.proximaAccionEn === "string" && body.proximaAccionEn.trim()) {
      const d = new Date(body.proximaAccionEn);
      if (Number.isFinite(d.getTime())) data.proximaAccionEn = d;
    }

    // Seguridad: solo actualiza si existe y pertenece al tenant/rol
    const existente = await prisma.lead.findFirst({
      where: { id, ...where },
      select: { id: true },
    });

    if (!existente) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    const updated = await prisma.lead.update({
      where: { id },
      data,
      include: {
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH lead error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
