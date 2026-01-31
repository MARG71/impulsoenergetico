export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole, sessionAdminId } from "@/lib/auth-server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function parseId(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET(req: Request) {
  try {
    const session = await getSessionOrThrow();
    const role = String(sessionRole(session) ?? "").toUpperCase();
    const adminId = sessionAdminId(session);

    if (!["ADMIN", "SUPERADMIN"].includes(role)) return jsonError("No autorizado", 403);

    const { searchParams } = new URL(req.url);
    const contratacionId = parseId(searchParams.get("contratacionId"));
    if (!contratacionId) return jsonError("contratacionId requerido", 400);

    const asiento = await prisma.asientoComision.findUnique({
      where: { contratacionId } as any,
    });

    if (!asiento) return NextResponse.json({ ok: true, asiento: null });

    if (role !== "SUPERADMIN") {
      if (!adminId) return jsonError("tenantAdminId no disponible", 400);
      if ((asiento as any).adminId !== adminId) return jsonError("No autorizado", 403);
    }

    return NextResponse.json({ ok: true, asiento });
  } catch (e: any) {
    return jsonError(String(e?.message ?? e), 500);
  }
}
