export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function jsonError(status: number, message: string, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ? { extra } : {}) }, { status });
}

function roleOf(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
}

function toDate(v: any) {
  const d = new Date(String(v ?? ""));
  return Number.isFinite(d.getTime()) ? d : null;
}

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = roleOf(tenant);
  const tenantAdminId = tenant.tenantAdminId ?? null;

  if (!["SUPERADMIN", "ADMIN"].includes(role)) return jsonError(403, "No autorizado");

  const url = new URL(req.url);
  const desde = toDate(url.searchParams.get("desde"));
  const hasta = toDate(url.searchParams.get("hasta"));

  if (!desde || !hasta) return jsonError(400, "desde y hasta requeridos (fecha)");

  const where: any = {
    creadoEn: { gte: desde, lte: hasta },
    estado: { in: ["PENDIENTE", "LIQUIDADO"] }, // ANULADO fuera
  };

  if (role !== "SUPERADMIN") {
    if (!tenantAdminId) return jsonError(400, "tenantAdminId no disponible");
    where.adminId = tenantAdminId;
  }

  const asientos = await prisma.asientoComision.findMany({
    where,
    select: {
      id: true,
      agenteId: true,
      lugarId: true,
      totalComision: true,
      agenteEUR: true,
      lugarEUR: true,
      adminEUR: true,
      creadoEn: true,
    } as any,
    take: 100000,
  });

  // Agregación en Node (simple y robusto)
  const byAgente = new Map<number, any>();
  const byLugar = new Map<number, any>();

  function add(map: Map<number, any>, key: number, row: any) {
    const cur = map.get(key) ?? { id: key, asientos: 0, total: 0, agente: 0, lugar: 0, admin: 0 };
    cur.asientos += 1;
    cur.total += Number(row.totalComision ?? 0);
    cur.agente += Number(row.agenteEUR ?? 0);
    cur.lugar += Number(row.lugarEUR ?? 0);
    cur.admin += Number(row.adminEUR ?? 0);
    map.set(key, cur);
  }

  for (const a of asientos) {
    if (a.agenteId) add(byAgente, Number(a.agenteId), a);
    if (a.lugarId) add(byLugar, Number(a.lugarId), a);
  }

  const agenteIds = Array.from(byAgente.keys());
  const lugarIds = Array.from(byLugar.keys());

  const agentes = agenteIds.length
    ? await prisma.agente.findMany({ where: { id: { in: agenteIds } }, select: { id: true, nombre: true } })
    : [];

  const lugares = lugarIds.length
    ? await prisma.lugar.findMany({ where: { id: { in: lugarIds } }, select: { id: true, nombre: true, especial: true } })
    : [];

  const agenteName = new Map(agentes.map((a) => [a.id, a.nombre ?? `Agente ${a.id}`]));
  const lugarName = new Map(lugares.map((l) => [l.id, { nombre: l.nombre ?? `Lugar ${l.id}`, especial: Boolean(l.especial) }]));

  const agentesOut = Array.from(byAgente.values())
    .map((x) => ({
      ...x,
      nombre: agenteName.get(x.id) ?? `Agente ${x.id}`,
    }))
    .sort((a, b) => b.total - a.total);

  const lugaresOut = Array.from(byLugar.values())
    .map((x) => ({
      ...x,
      nombre: lugarName.get(x.id)?.nombre ?? `Lugar ${x.id}`,
      especial: lugarName.get(x.id)?.especial ?? false,
    }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    ok: true,
    rango: { desde, hasta },
    totalAsientos: asientos.length,
    agentes: agentesOut,
    lugares: lugaresOut,
  });
}
