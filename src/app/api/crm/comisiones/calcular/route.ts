export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole, sessionAdminId } from "@/lib/auth-server";

function isAdmin(role?: string | null) {
  return role === "SUPERADMIN" || role === "ADMIN";
}

function toDec(n: any) {
  if (n === null || n === undefined || n === "") return null;
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

export async function GET(req: Request) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    if (!isAdmin(role)) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    const adminId = sessionAdminId(session);
    const { searchParams } = new URL(req.url);
    const contratacionId = Number(searchParams.get("contratacionId"));
    if (!contratacionId) {
      return NextResponse.json({ ok: false, error: "contratacionId inválido" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) cargar contratación confirmada
      const c = await tx.contratacion.findFirst({
        where: { id: contratacionId, adminId },
        select: {
          id: true,
          estado: true,
          nivel: true,
          baseImponible: true,
          totalFactura: true,
          agenteId: true,
          lugarId: true,
          confirmadaEn: true,
        },
      });
      if (!c) throw new Error("Contratación no encontrada");
      if (c.estado !== "CONFIRMADA") throw new Error("Solo se calculan comisiones en CONFIRMADA");

      // 2) regla global activa (ajusta a tu modelo real)
      const regla = await tx.reglaComisionGlobal.findFirst({
        where: { adminId, activa: true },
        select: {
          id: true,
          poolSobre: true,           // "BASE" | "TOTAL"
          poolPorcentaje: true,      // p.ej 10 => 10%
          pctAdmin: true,
          pctAgente: true,
          pctLugar: true,
        },
      });
      if (!regla) throw new Error("No hay ReglaComisionGlobal activa");

      const base = regla.poolSobre === "TOTAL"
        ? toDec(c.totalFactura)
        : toDec(c.baseImponible);

      if (!base) throw new Error("La contratación no tiene base/total para calcular");

      const pool = base * (toDec(regla.poolPorcentaje)! / 100);

      const adminAmt = pool * (toDec(regla.pctAdmin)! / 100);
      const agenteAmt = pool * (toDec(regla.pctAgente)! / 100);
      const lugarAmt = pool * (toDec(regla.pctLugar)! / 100);

      // 3) borrar asientos previos (si recalculas)
      await tx.asientoComision.deleteMany({
        where: { adminId, contratacionId: c.id },
      });

      // 4) crear asientos (histórico)
      const asientos = await tx.asientoComision.createMany({
        data: [
          {
            adminId,
            contratacionId: c.id,
            receptorTipo: "ADMIN",
            receptorId: adminId,
            importe: adminAmt,
          },
          ...(c.agenteId ? [{
            adminId,
            contratacionId: c.id,
            receptorTipo: "AGENTE",
            receptorId: c.agenteId,
            importe: agenteAmt,
          }] : []),
          ...(c.lugarId ? [{
            adminId,
            contratacionId: c.id,
            receptorTipo: "LUGAR",
            receptorId: c.lugarId,
            importe: lugarAmt,
          }] : []),
        ] as any,
      });

      return { pool, adminAmt, agenteAmt, lugarAmt, asientos };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
