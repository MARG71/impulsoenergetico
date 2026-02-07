//src/app/api/crm/comisiones/asientos/route.ts
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

function getRole(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
}

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = getRole(tenant);
  const tenantAdminId = tenant.tenantAdminId ?? null;

  if (!["SUPERADMIN", "ADMIN"].includes(role)) return jsonError(403, "No autorizado");

  const url = new URL(req.url);

  const q = String(url.searchParams.get("q") ?? "").trim();
  const estado = String(url.searchParams.get("estado") ?? "").trim().toUpperCase();
  const agenteId = toId(url.searchParams.get("agenteId"));
  const lugarId = toId(url.searchParams.get("lugarId"));
  const seccionId = toId(url.searchParams.get("seccionId"));

  const where: any = {};

  if (role !== "SUPERADMIN") {
    if (!tenantAdminId) return jsonError(400, "tenantAdminId no disponible");
    where.adminId = tenantAdminId;
  } else {
    // si quieres modo tenant, puedes filtrar por tenantAdminId si viene:
    // if (tenantAdminId) where.adminId = tenantAdminId;
  }

  if (estado && ["PENDIENTE", "LIQUIDADO", "ANULADO"].includes(estado)) where.estado = estado;

  if (agenteId) where.agenteId = agenteId;
  if (lugarId) where.lugarId = lugarId;
  if (seccionId) where.seccionId = seccionId;

  // búsqueda simple (por id, nombre agente/lugar/cliente/lead)
  if (q) {
    const idQ = toId(q);
    where.OR = [
      ...(idQ ? [{ id: idQ }, { contratacionId: idQ }] : []),
      { agente: { is: { nombre: { contains: q, mode: "insensitive" } } } },
      { lugar: { is: { nombre: { contains: q, mode: "insensitive" } } } },
      { cliente: { is: { nombre: { contains: q, mode: "insensitive" } } } },
      { lead: { is: { nombre: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const items = await prisma.asientoComision.findMany({
    where,
    orderBy: { id: "desc" },
    take: 300,
    include: {
      contratacion: { select: { id: true, estado: true, creadaEn: true, confirmadaEn: true } },
      agente: { select: { id: true, nombre: true } },
      lugar: { select: { id: true, nombre: true, especial: true } },
      cliente: { select: { id: true, nombre: true } },
      lead: { select: { id: true, nombre: true } },
      seccion: { select: { id: true, nombre: true, slug: true } },
      subSeccion: { select: { id: true, nombre: true, slug: true } },
    } as any,
  });

  return NextResponse.json({ ok: true, items });
}
