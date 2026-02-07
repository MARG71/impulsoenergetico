export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function jsonError(status: number, message: string, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ? { extra } : {}) }, { status });
}

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function roleOf(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
}

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = roleOf(tenant);
  const tenantAdminId = tenant.tenantAdminId ?? null;

  if (!["SUPERADMIN", "ADMIN"].includes(role)) return jsonError(403, "No autorizado");

  const url = new URL(req.url);
  const contratacionId = toId(url.searchParams.get("contratacionId"));
  if (!contratacionId) return jsonError(400, "contratacionId requerido");

  const asiento = await prisma.asientoComision.findUnique({
    where: { contratacionId } as any,
  });

  if (!asiento) return NextResponse.json({ ok: true, asiento: null, movimientos: [] });

  if (role !== "SUPERADMIN") {
    if (!tenantAdminId) return jsonError(400, "tenantAdminId no disponible");
    if ((asiento as any).adminId !== tenantAdminId) return jsonError(403, "No autorizado (tenant)");
  }

  const movimientos = await prisma.movimientoComision.findMany({
    where: { asientoId: (asiento as any).id } as any,
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ ok: true, asiento, movimientos });
}
