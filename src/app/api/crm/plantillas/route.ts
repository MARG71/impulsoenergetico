// src/app/api/crm/plantillas/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionAdminId, sessionRole } from "@/lib/auth-server";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function canWrite(role: Role) {
  return role === "SUPERADMIN" || role === "ADMIN";
}

function roleSafe(x: unknown): Role {
  const r = String(x || "").toUpperCase();
  if (r === "SUPERADMIN") return "SUPERADMIN";
  if (r === "ADMIN") return "ADMIN";
  if (r === "AGENTE") return "AGENTE";
  if (r === "LUGAR") return "LUGAR";
  return "CLIENTE";
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = roleSafe(sessionRole(session));
    const tenantAdminId = sessionAdminId(session);

    const url = new URL(req.url);
    const canal = url.searchParams.get("canal"); // opcional
    const etapa = url.searchParams.get("etapa"); // opcional

    // ✅ multi-tenant
    const where: any = {};
    if (role !== "SUPERADMIN") where.adminId = tenantAdminId ?? -1;
    if (canal) where.canal = String(canal);
    if (etapa) where.etapa = String(etapa);

    const items = await prisma.plantillaMensaje.findMany({
      where,
      orderBy: { actualizadaEn: "desc" },
      take: 500,
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("GET plantillas error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = roleSafe(sessionRole(session));
    const tenantAdminId = sessionAdminId(session);

    if (!canWrite(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    const canal = String(body?.canal || "whatsapp");
    const etapa = String(body?.etapa || "primero");
    const variante = String(body?.variante || "A").toUpperCase() === "B" ? "B" : "A";
    const titulo = String(body?.titulo || `${etapa.toUpperCase()} ${variante}`);
    const contenido = String(body?.contenido || "");
    const activa = Boolean(body?.activa ?? true);

    // SUPERADMIN puede crear plantillas globales (adminId null) si quiere
    // ADMIN crea siempre para su tenant
    const adminIdToSet =
      role === "SUPERADMIN" ? (body?.adminId != null ? Number(body.adminId) : null) : (tenantAdminId ?? null);

    const created = await prisma.plantillaMensaje.create({
      data: {
        canal,
        etapa,
        variante,
        titulo,
        contenido,
        activa,
        adminId: adminIdToSet,
        actualizadaEn: new Date(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("POST plantillas error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
