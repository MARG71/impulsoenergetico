// src/app/api/crm/comisiones/calcular/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { TipoCalculoComision } from "@prisma/client";

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toDecimalNumber(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp(n: number, min?: number | null, max?: number | null) {
  let x = n;
  if (min !== null && min !== undefined) x = Math.max(x, Number(min));
  if (max !== null && max !== undefined) x = Math.min(x, Number(max));
  return x;
}

/**
 * Calcula el "pool admin" (importe de comisión) usando ReglaComisionGlobal:
 * - FIJA => fijoEUR
 * - PORC_BASE => porcentaje sobre baseImponible
 * - PORC_MARGEN => porcentaje sobre (totalFactura - baseImponible)
 * - MIXTA => fijoEUR + porcentaje sobre baseImponible (si existe)
 */
function calcularPool(regla: any, base: number | null, total: number | null) {
  const fijo = regla?.fijoEUR != null ? Number(regla.fijoEUR) : 0;
  const pct = regla?.porcentaje != null ? Number(regla.porcentaje) : 0;

  const baseImponible = base ?? 0;
  const totalFactura = total ?? 0;
  const margen = Math.max(0, totalFactura - baseImponible);

  let pool = 0;

  const tipo = regla?.tipo as TipoCalculoComision;

  if (tipo === "FIJA") {
    pool = fijo;
  } else if (tipo === "PORC_BASE") {
    pool = (pct / 100) * baseImponible;
  } else if (tipo === "PORC_MARGEN") {
    pool = (pct / 100) * margen;
  } else if (tipo === "MIXTA") {
    pool = fijo + (pct / 100) * baseImponible;
  } else {
    // fallback por si llega algo raro
    pool = fijo;
  }

  pool = clamp(pool, regla?.minEUR, regla?.maxEUR);

  return {
    pool,
    detalle: {
      tipo,
      fijoEUR: fijo,
      porcentaje: pct,
      baseImponible,
      totalFactura,
      margen,
      minEUR: regla?.minEUR ?? null,
      maxEUR: regla?.maxEUR ?? null,
    },
  };
}

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const contratacionId = toId(req.nextUrl.searchParams.get("contratacionId"));
  if (!contratacionId) return jsonError(400, "contratacionId es obligatorio");

  // scope tenant por adminId en Contratacion (sí existe)
  const where: any = { id: contratacionId };
  if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const c = await tx.contratacion.findFirst({
        where,
        select: {
          id: true,
          estado: true,
          nivel: true,
          seccionId: true,
          subSeccionId: true,
          baseImponible: true,
          totalFactura: true,
          adminId: true,
        },
      });

      if (!c) throw new Error("Contratación no encontrada");

      // La regla NO tiene adminId en tu schema, así que la seleccionamos solo por seccion/sub/nivel/activa
      // Priorizamos: regla específica de subsección, si no hay, regla de sección (subSeccionId null)
      const regla =
        (await tx.reglaComisionGlobal.findFirst({
          where: {
            seccionId: c.seccionId,
            subSeccionId: c.subSeccionId ?? undefined,
            nivel: c.nivel,
            activa: true,
          },
          orderBy: { id: "desc" },
        })) ||
        (await tx.reglaComisionGlobal.findFirst({
          where: {
            seccionId: c.seccionId,
            subSeccionId: null,
            nivel: c.nivel,
            activa: true,
          },
          orderBy: { id: "desc" },
        }));

      if (!regla) {
        return {
          ok: false,
          error:
            "No hay regla activa para esa Sección/Subsección y Nivel. Crea una ReglaComisionGlobal.",
        };
      }

      const base = c.baseImponible != null ? Number(c.baseImponible) : null;
      const total = c.totalFactura != null ? Number(c.totalFactura) : null;

      const calc = calcularPool(regla, base, total);

      return {
        ok: true,
        contratacionId: c.id,
        reglaId: regla.id,
        pool: calc.pool,
        detalle: calc.detalle,
      };
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("GET /api/crm/comisiones/calcular error:", e);
    return jsonError(500, e?.message || "Error calculando comisiones");
  }
}
