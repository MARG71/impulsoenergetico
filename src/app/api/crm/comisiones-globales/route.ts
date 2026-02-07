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

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.error, tenant.status);

  const role = getRole(tenant);
  if (!["ADMIN", "SUPERADMIN"].includes(role)) return jsonError("No autorizado", 403);

  const url = new URL(req.url);
  const seccionId = parseId(url.searchParams.get("seccionId"));
  const subSeccionId = parseId(url.searchParams.get("subSeccionId"));

  if (!seccionId) return jsonError("seccionId requerido", 400);

  // tenant mode para superadmin: ?adminId=xx
  const adminIdFromQuery = parseId(url.searchParams.get("adminId"));
  const tenantAdminId = tenant.tenantAdminId ?? null;

  const effectiveAdminId =
    role === "SUPERADMIN" ? (adminIdFromQuery ?? tenantAdminId ?? null) : tenantAdminId;

  if (role !== "SUPERADMIN" && !effectiveAdminId) return jsonError("tenantAdminId no disponible", 400);

  const where: any = {
    seccionId,
    subSeccionId: subSeccionId ?? null,
  };

  if (role !== "SUPERADMIN") where.adminId = effectiveAdminId;
  else if (effectiveAdminId) where.adminId = effectiveAdminId; // superadmin tenant-mode opcional

  const items = await prisma.reglaComisionGlobal.findMany({
    where,
    orderBy: { id: "asc" },
  });

  const byNivel: any = {};
  for (const n of NIVELES) {
    byNivel[n] = items.find((x: any) => String(x.nivel) === String(n)) ?? null;
  }

  return NextResponse.json({ ok: true, items, byNivel });
}

export async function POST(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.error, tenant.status);

  const role = getRole(tenant);
  if (!["ADMIN", "SUPERADMIN"].includes(role)) return jsonError("No autorizado", 403);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Body inválido", 400);

  const seccionId = parseId(body.seccionId);
  const subSeccionId = parseId(body.subSeccionId);
  const nivel = String(body.nivel ?? "").toUpperCase();
  const regla = body.regla ?? {};

  if (!seccionId) return jsonError("seccionId requerido", 400);
  if (!NIVELES.includes(nivel as any)) return jsonError("nivel inválido", 400, { nivel });

  const tenantAdminId = tenant.tenantAdminId ?? null;
  const adminIdBody = parseId(body.adminId ?? body.tenantAdminId);
  const effectiveAdminId = role === "SUPERADMIN" ? (adminIdBody ?? tenantAdminId ?? null) : tenantAdminId;

  if (role !== "SUPERADMIN" && !effectiveAdminId) return jsonError("tenantAdminId no disponible", 400);
  if (role === "SUPERADMIN" && !effectiveAdminId) return jsonError("SUPERADMIN: pasa adminId (tenant mode)", 400);

  // Upsert por clave lógica (adminId + seccionId + subSeccionId + nivel)
  const existing = await prisma.reglaComisionGlobal.findFirst({
    where: {
      adminId: effectiveAdminId,
      seccionId,
      subSeccionId: subSeccionId ?? null,
      nivel: nivel as any,
    } as any,
    select: { id: true },
  });

  const data: any = {
    adminId: effectiveAdminId,
    seccionId,
    subSeccionId: subSeccionId ?? null,
    nivel: nivel as any,
    activa: Boolean(regla.activa ?? true),

    tipo: (regla.tipo ?? "PORC_BASE") as any,
    porcentaje: regla.porcentaje ?? 0,
    fijoEUR: regla.fijoEUR ?? 0,

    minEUR: regla.minEUR ?? null,
    maxEUR: regla.maxEUR ?? null,

    minAgenteEUR: regla.minAgenteEUR ?? null,
    maxAgenteEUR: regla.maxAgenteEUR ?? null,

    minLugarEspecialEUR: regla.minLugarEspecialEUR ?? null,
    maxLugarEspecialEUR: regla.maxLugarEspecialEUR ?? null,
  };

  let saved: any;
  if (existing?.id) {
    saved = await prisma.reglaComisionGlobal.update({
      where: { id: existing.id },
      data,
    });
  } else {
    saved = await prisma.reglaComisionGlobal.create({ data });
  }

  return NextResponse.json({ ok: true, item: saved });
}
