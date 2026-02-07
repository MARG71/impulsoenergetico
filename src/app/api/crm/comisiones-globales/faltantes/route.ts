export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ? { extra } : {}) }, { status });
}

function parseId(v: any) {
  if (v === null || v === undefined) return null;
  if (String(v) === "null") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getRole(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
}

const NIVELES = ["C1", "C2", "C3", "ESPECIAL"] as const;

export async function POST(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.error, tenant.status);

  const role = getRole(tenant);
  if (!["ADMIN", "SUPERADMIN"].includes(role)) return jsonError("No autorizado", 403);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Body inválido", 400);

  const seccionId = parseId(body.seccionId);
  const subSeccionId = parseId(body.subSeccionId);

  if (!seccionId) return jsonError("seccionId requerido", 400);

  const tenantAdminId = tenant.tenantAdminId ?? null;
  const adminIdBody = parseId(body.adminId ?? body.tenantAdminId);
  const effectiveAdminId = role === "SUPERADMIN" ? (adminIdBody ?? tenantAdminId ?? null) : tenantAdminId;

  if (role !== "SUPERADMIN" && !effectiveAdminId) return jsonError("tenantAdminId no disponible", 400);
  if (role === "SUPERADMIN" && !effectiveAdminId) return jsonError("SUPERADMIN: pasa adminId (tenant mode)", 400);

  const existentes = await prisma.reglaComisionGlobal.findMany({
    where: {
      adminId: effectiveAdminId,
      seccionId,
      subSeccionId: subSeccionId ?? null,
    } as any,
    select: { nivel: true },
  });

  const set = new Set(existentes.map((x: any) => String(x.nivel)));
  let created = 0;

  for (const n of NIVELES) {
    if (set.has(String(n))) continue;

    await prisma.reglaComisionGlobal.create({
      data: {
        adminId: effectiveAdminId,
        seccionId,
        subSeccionId: subSeccionId ?? null,
        nivel: n as any,
        activa: true,
        tipo: "PORC_BASE" as any,
        porcentaje: 0,
        fijoEUR: 0,
      } as any,
    });
    created++;
  }

  return NextResponse.json({ ok: true, created });
}
