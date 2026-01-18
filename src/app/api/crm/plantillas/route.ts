export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole, sessionAdminId } from "@/lib/auth-server";

function canWrite(role: string) {
  return role === "SUPERADMIN" || role === "ADMIN";
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);

    const url = new URL(req.url);
    const canal = url.searchParams.get("canal") || "whatsapp";

    const where =
      role === "SUPERADMIN"
        ? { canal }
        : { canal, adminId: tenantAdminId ?? -1 };

    const items = await prisma.plantillaMensaje.findMany({
      where,
      orderBy: [{ canal: "asc" }, { etapa: "asc" }, { variante: "asc" }, { actualizadaEn: "desc" }],
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
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);

    if (!canWrite(role)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const canal = String(body?.canal || "whatsapp");
    const etapa = String(body?.etapa || "primero");
    const variante = String(body?.variante || "A");
    const titulo = String(body?.titulo || `${etapa.toUpperCase()} ${variante}`);
    const contenido = String(body?.contenido || "");
    const activa = Boolean(body?.activa ?? true);

    if (!contenido.trim()) return NextResponse.json({ error: "Contenido requerido" }, { status: 400 });

    const created = await prisma.plantillaMensaje.create({
      data: {
        canal,
        etapa,
        variante,
        titulo,
        contenido,
        activa,
        adminId: role === "SUPERADMIN" ? (body?.adminId ? Number(body.adminId) : null) : (tenantAdminId ?? null),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("POST plantillas error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
