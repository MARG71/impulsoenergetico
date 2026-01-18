// src/app/api/crm/plantillas/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionAdminId, sessionRole } from "@/lib/auth-server";

function parseId(id: unknown) {
  const n = Number(id);
  return !n || Number.isNaN(n) ? null : n;
}

// GET /api/crm/plantillas/[id]
export async function GET(_req: NextRequest, context: any) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);

    const plantillaId = parseId(context?.params?.id);
    if (!plantillaId) return NextResponse.json({ error: "ID no válido" }, { status: 400 });

    const item = await prisma.plantillaMensaje.findUnique({
      where: { id: plantillaId },
    });

    if (!item) return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });

    // Permisos multi-tenant (si no eres SUPERADMIN, solo tus plantillas)
    if (role !== "SUPERADMIN") {
      if ((item.adminId ?? null) !== (tenantAdminId ?? null)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    return NextResponse.json(item);
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("GET plantilla error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH /api/crm/plantillas/[id]
export async function PATCH(req: NextRequest, context: any) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);

    const plantillaId = parseId(context?.params?.id);
    if (!plantillaId) return NextResponse.json({ error: "ID no válido" }, { status: 400 });

    const existente = await prisma.plantillaMensaje.findUnique({
      where: { id: plantillaId },
      select: { id: true, adminId: true },
    });

    if (!existente) return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });

    // Permisos multi-tenant
    if (role !== "SUPERADMIN") {
      if ((existente.adminId ?? null) !== (tenantAdminId ?? null)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => ({}));

    // Campos editables (validación sencilla)
    const patch: any = {};

    if (Object.prototype.hasOwnProperty.call(body, "titulo")) {
      patch.titulo = body.titulo ? String(body.titulo) : "";
    }
    if (Object.prototype.hasOwnProperty.call(body, "contenido")) {
      patch.contenido = body.contenido ? String(body.contenido) : "";
    }
    if (Object.prototype.hasOwnProperty.call(body, "activa")) {
      patch.activa = Boolean(body.activa);
    }
    if (Object.prototype.hasOwnProperty.call(body, "etapa")) {
      patch.etapa = body.etapa ? String(body.etapa) : "primero";
    }
    if (Object.prototype.hasOwnProperty.call(body, "canal")) {
      patch.canal = body.canal ? String(body.canal) : "whatsapp";
    }
    if (Object.prototype.hasOwnProperty.call(body, "variante")) {
      patch.variante = body.variante ? String(body.variante).toUpperCase() : "A";
    }

    patch.actualizadaEn = new Date();

    const updated = await prisma.plantillaMensaje.update({
      where: { id: plantillaId },
      data: patch,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("PATCH plantilla error:", e);
    return NextResponse.json({ error: "Error guardando" }, { status: 500 });
  }
}

// DELETE /api/crm/plantillas/[id] (opcional, por si lo necesitas)
export async function DELETE(_req: NextRequest, context: any) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);

    const plantillaId = parseId(context?.params?.id);
    if (!plantillaId) return NextResponse.json({ error: "ID no válido" }, { status: 400 });

    const existente = await prisma.plantillaMensaje.findUnique({
      where: { id: plantillaId },
      select: { id: true, adminId: true },
    });

    if (!existente) return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });

    if (role !== "SUPERADMIN") {
      if ((existente.adminId ?? null) !== (tenantAdminId ?? null)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    await prisma.plantillaMensaje.delete({ where: { id: plantillaId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("DELETE plantilla error:", e);
    return NextResponse.json({ error: "Error eliminando" }, { status: 500 });
  }
}
