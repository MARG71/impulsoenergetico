export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function jsonError(status: number, message: string, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

function roleOf(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "")
    .toUpperCase()
    .trim();
}

function toInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getUserIds(tenant: any) {
  // Intentamos cubrir tu getTenantContext sin conocer su shape exacto
  const userId = toInt((tenant as any)?.userId ?? (tenant as any)?.session?.user?.id ?? (tenant as any)?.sessionUserId);
  const agenteId = toInt((tenant as any)?.agenteId ?? (tenant as any)?.session?.user?.agenteId);
  const lugarId = toInt((tenant as any)?.lugarId ?? (tenant as any)?.session?.user?.lugarId);
  const tenantAdminId = toInt((tenant as any)?.tenantAdminId ?? (tenant as any)?.adminId);
  return { userId, agenteId, lugarId, tenantAdminId };
}

function periodoToDate(periodo: string | null) {
  if (!periodo || periodo === "ALL") return null;
  const days = Number(periodo);
  if (!Number.isFinite(days) || days <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = roleOf(tenant);
  const { userId, agenteId, lugarId, tenantAdminId } = getUserIds(tenant);

  const url = new URL(req.url);
  const estado = String(url.searchParams.get("estado") || "ACTIVO").toUpperCase();
  const periodo = String(url.searchParams.get("periodo") || "90").toUpperCase();
  const adminIdParam = toInt(url.searchParams.get("adminId"));

  // Roles válidos
  if (!["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"].includes(role)) {
    return jsonError(403, "No autorizado");
  }

  // tenant adminId efectivo:
  // - SUPERADMIN puede supervisar pasando ?adminId=...
  // - el resto usa su tenantAdminId
  const effectiveAdminId =
    role === "SUPERADMIN" ? (adminIdParam ?? null) : (tenantAdminId ?? null);

  if (role !== "SUPERADMIN" && !effectiveAdminId) {
    return jsonError(400, "tenantAdminId no disponible");
  }

  // Construir WHERE base
  const where: any = {};

  // Siempre filtramos por adminId (tenant) excepto SUPERADMIN sin adminId (modo global sin filtro)
  if (effectiveAdminId) where.adminId = effectiveAdminId;

  // Filtro estado
  if (estado === "ANULADO") where.estado = "ANULADO";
  else if (estado === "ACTIVO") where.estado = { not: "ANULADO" };
  // TODOS -> no filtra

  // Filtro periodo
  const from = periodoToDate(periodo);
  if (from) where.creadoEn = { gte: from };

  // Filtro por rol (quién “es mío”)
  if (role === "ADMIN") {
    // admin ve sus asientos del tenant (ya filtrado por adminId)
    // (si quieres solo los que tengan adminEUR > 0, lo añadimos)
  } else if (role === "AGENTE") {
    if (!agenteId) return jsonError(400, "agenteId no disponible en sesión");
    where.agenteId = agenteId;
  } else if (role === "LUGAR") {
    if (!lugarId) return jsonError(400, "lugarId no disponible en sesión");
    where.lugarId = lugarId;
  } else if (role === "SUPERADMIN") {
    // Si no pasa adminId, mostramos “global” (sin filtro) pero OJO: puede ser enorme
    // Recomendado: usar siempre adminId en supervisión
  }

  const itemsRaw = await prisma.asientoComision.findMany({
    where,
    orderBy: { creadoEn: "desc" },
    take: 300, // límite razonable para UI (ajústalo si quieres paginación)
    select: {
      id: true,
      creadoEn: true,
      estado: true,
      nivel: true,
      seccionId: true,
      subSeccionId: true,
      baseEUR: true,
      totalComision: true,
      adminEUR: true,
      agenteEUR: true,
      lugarEUR: true,
      contratacionId: true,
      adminId: true,
      agenteId: true,
      lugarId: true,
    },
  });

  // Resolver nombres de sección/subsección
  const seccionIds = Array.from(new Set(itemsRaw.map((x) => x.seccionId).filter(Boolean)));
  const subIds = Array.from(new Set(itemsRaw.map((x) => x.subSeccionId).filter(Boolean))) as number[];

  const [secciones, subSecciones] = await Promise.all([
    seccionIds.length
      ? prisma.seccion.findMany({
          where: {
            id: { in: seccionIds as number[] },
            ...(effectiveAdminId ? { adminId: effectiveAdminId } : {}),
          },
          select: { id: true, nombre: true },
        })
      : Promise.resolve([]),
    subIds.length
      ? prisma.subSeccion.findMany({
          where: {
            id: { in: subIds },
            ...(effectiveAdminId ? { adminId: effectiveAdminId } : {}),
          },
          select: { id: true, nombre: true },
        })
      : Promise.resolve([]),
  ]);

  const seccionMap = new Map(secciones.map((s) => [s.id, s.nombre]));
  const subMap = new Map(subSecciones.map((s) => [s.id, s.nombre]));

  const items = itemsRaw.map((r) => ({
    ...r,
    baseEUR: Number(r.baseEUR),
    totalComision: Number(r.totalComision),
    adminEUR: Number(r.adminEUR),
    agenteEUR: Number(r.agenteEUR),
    lugarEUR: Number(r.lugarEUR),
    seccionNombre: seccionMap.get(r.seccionId) ?? null,
    subSeccionNombre: r.subSeccionId ? subMap.get(r.subSeccionId) ?? null : null,
  }));

  return NextResponse.json({ ok: true, items, meta: { role, effectiveAdminId } });
}
