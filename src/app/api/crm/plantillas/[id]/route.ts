export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole, sessionAdminId } from "@/lib/auth-server";

function parseId(x: unknown) {
  const n = Number(x);
  return !n || Number.isNaN(n) ? null : n;
}
function canWrite(role: string) {
  return role === "SUPERADMIN" || role === "ADMIN";
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);

    if (!canWrite(role)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const id = parseId(context?.params?.id);
    if (!id) return NextResponse.json({ error: "ID no válido" }, { status: 400 });

    const actual = await prisma.plantillaMensaje.findUnique({ where: { id } });
    if (!actual) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    // permiso multi-tenant
    if (role !== "SUPERADMIN" && actual.adminId !== tenantAdminId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    const updated = await prisma.plantillaMensaje.update({
      where: { id },
      data: {
        ...(body?.titulo !== undefined ? { titulo: String(body.titulo) } : {}),
        ...(body?.contenido !== undefined ? { contenido: String(body.contenido) } : {}),
        ...(body?.activa !== undefined ? { activa: Boolean(body.activa) } : {}),
        ...(body?.etapa !== undefined ? { etapa: String(body.etapa) } : {}),
        ...(body?.variante !== undefined ? { variante: String(body.variante) } : {}),
        ...(body?.canal !== undefined ? { canal: String(body.canal) } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("PATCH plantilla error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
