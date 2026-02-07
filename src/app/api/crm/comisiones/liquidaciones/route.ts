export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function jsonError(status: number, message: string, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ? { extra } : {}) }, { status });
}

function getRole(tenant: any) {
  return String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
}

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: NextRequest, ctx: any) {
  // Acción: "ADD_MOVIMIENTOS" o "CERRAR"
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = getRole(tenant);
  const tenantAdminId = tenant.tenantAdminId ?? null;

  if (!["SUPERADMIN", "ADMIN"].includes(role)) return jsonError(403, "No autorizado");

  const id = toId(ctx?.params?.id);
  if (!id) return jsonError(400, "ID inválido");

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "").toUpperCase();

  const liq = await prisma.liquidacionComision.findUnique({ where: { id } });
  if (!liq) return jsonError(404, "Liquidación no encontrada");

  if (role !== "SUPERADMIN") {
    if (!tenantAdminId) return jsonError(400, "tenantAdminId no disponible");
    if ((liq as any).adminId !== tenantAdminId) return jsonError(403, "Fuera de tu tenant");
  }

  if (action === "ADD_MOVIMIENTOS") {
    if ((liq as any).estado !== "ABIERTA") return jsonError(400, "Solo se puede añadir en ABIERTA");

    // Adjuntar movimientos PENDIENTES en rango, aún no liquidados
    const movimientos = await prisma.movimientoComision.findMany({
      where: {
        adminId: (liq as any).adminId ?? null,
        liquidacionId: null,
        creadoEn: { gte: (liq as any).desde, lte: (liq as any).hasta },
      } as any,
      select: { id: true, receptorTipo: true, importeEUR: true, asientoId: true },
      take: 5000,
    });

    if (movimientos.length === 0) {
      return NextResponse.json({ ok: true, added: 0 });
    }

    // asignar liquidacionId
    await prisma.movimientoComision.updateMany({
      where: { id: { in: movimientos.map((m) => m.id) } } as any,
      data: { liquidacionId: id } as any,
    });

    // recalcular totales
    const agg = movimientos.reduce(
      (acc, m) => {
        const v = Number(m.importeEUR ?? 0);
        if (m.receptorTipo === "AGENTE") acc.agente += v;
        else if (m.receptorTipo === "LUGAR") acc.lugar += v;
        else acc.admin += v;
        return acc;
      },
      { agente: 0, lugar: 0, admin: 0 }
    );

    await prisma.liquidacionComision.update({
      where: { id },
      data: {
        totalAgenteEUR: (Number((liq as any).totalAgenteEUR ?? 0) + agg.agente) as any,
        totalLugarEUR: (Number((liq as any).totalLugarEUR ?? 0) + agg.lugar) as any,
        totalAdminEUR: (Number((liq as any).totalAdminEUR ?? 0) + agg.admin) as any,
      } as any,
    });

    return NextResponse.json({ ok: true, added: movimientos.length });
  }

  if (action === "CERRAR") {
    if ((liq as any).estado !== "ABIERTA") return jsonError(400, "Ya está cerrada");

    // Marcar asientos como LIQUIDADO si todos sus movimientos están en esta liquidación
    const mvs = await prisma.movimientoComision.findMany({
      where: { liquidacionId: id } as any,
      select: { asientoId: true },
      take: 5000,
    });

    const asientoIds = Array.from(new Set(mvs.map((x) => x.asientoId)));

    await prisma.asientoComision.updateMany({
      where: { id: { in: asientoIds }, estado: "PENDIENTE" as any } as any,
      data: { estado: "LIQUIDADO" as any, liquidadoEn: new Date() } as any,
    });

    const updated = await prisma.liquidacionComision.update({
      where: { id },
      data: { estado: "CERRADA" as any } as any,
    });

    return NextResponse.json({ ok: true, item: updated, asientosLiquidados: asientoIds.length });
  }

  return jsonError(400, "Acción no válida. Usa ADD_MOVIMIENTOS o CERRAR.");
}
