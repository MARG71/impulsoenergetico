export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionRole,
  sessionAdminId,
} from "@/lib/auth-server";

/**
 * Helpers
 */
function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

function parseId(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toNumber(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

// Decimal Prisma (string/number) -> number
function decToNumber(v: any, def = 0) {
  if (v === null || v === undefined) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

/**
 * pct (Decimal(5,4)) puede venir como:
 * - 0.1000 (10%)
 * - 10 (10%)
 * Normalizamos a 0..100
 */
function normalizePct(p: any): number {
  const n = decToNumber(p, 0);
  if (n <= 1) return n * 100;
  return n;
}

/**
 * Redondeo a 2 decimales (EUR)
 */
function eur(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function POST(req: Request) {
  try {
    const session = await getSessionOrThrow();
    const role = String(sessionRole(session) ?? "").toUpperCase();
    const adminId = sessionAdminId(session);

    if (!["ADMIN", "SUPERADMIN"].includes(role)) {
      return jsonError("No autorizado", 403);
    }

    const body = await req.json().catch(() => ({}));
    const contratacionId = parseId(body?.contratacionId);
    if (!contratacionId) return jsonError("contratacionId requerido", 400);

    // 1) Cargar contratación
    const contratacion = await prisma.contratacion.findUnique({
      where: { id: contratacionId },
      include: {
        seccion: true as any,
        subSeccion: true as any,
        agente: true as any,
        lugar: true as any,
      } as any,
    });

    if (!contratacion) return jsonError("Contratación no encontrada", 404);

    // Tenant: ADMIN solo su adminId
    if (role !== "SUPERADMIN") {
      if (!adminId) return jsonError("tenantAdminId no disponible", 400);
      if ((contratacion as any).adminId !== adminId) return jsonError("No autorizado", 403);
    }

    if (String((contratacion as any).estado) !== "CONFIRMADA") {
      return jsonError("Solo se puede asentar si la contratación está CONFIRMADA", 400);
    }

    // 2) Evitar duplicado (1 asiento por contratación)
    const existing = await prisma.asientoComision.findUnique({
      where: { contratacionId: contratacionId } as any,
    });

    if (existing) {
      return NextResponse.json({ ok: true, asiento: existing, duplicated: true });
    }

    const seccionId = toNumber((contratacion as any).seccionId, 0);
    const subSeccionId = (contratacion as any).subSeccionId ?? null;
    const nivel = String((contratacion as any).nivel ?? "C1");

    // 3) Buscar regla (prioridad: exact subSeccionId, si no, regla general null)
    const reglaExacta = await prisma.reglaComisionGlobal.findFirst({
      where: {
        seccionId,
        subSeccionId: subSeccionId,
        nivel: nivel as any,
        activa: true,
      } as any,
      orderBy: { id: "asc" },
    });

    const reglaGeneral = !reglaExacta
      ? await prisma.reglaComisionGlobal.findFirst({
          where: {
            seccionId,
            subSeccionId: null,
            nivel: nivel as any,
            activa: true,
          } as any,
          orderBy: { id: "asc" },
        })
      : null;

    const regla = (reglaExacta || reglaGeneral) as any;

    if (!regla) {
      return jsonError(
        "No hay ReglaComisionGlobal activa para esta sección/nivel (crea reglas primero).",
        400,
        { seccionId, subSeccionId, nivel }
      );
    }

    // 4) Base comisionable (preferimos baseImponible; si no, totalFactura)
    const baseEUR =
      decToNumber((contratacion as any).baseImponible, NaN) ||
      decToNumber((contratacion as any).totalFactura, NaN) ||
      0;

    // 5) Calcular total comisión según regla.tipo
    const tipo = String(regla.tipo ?? "PORC_BASE");
    const fijo = decToNumber(regla.fijoEUR, 0);
    const pct = decToNumber(regla.porcentaje, 0);

    let totalComision = 0;

    if (tipo === "FIJA") totalComision = fijo;
    else if (tipo === "MIXTA") totalComision = fijo + baseEUR * (pct / 100);
    else {
      // PORC_BASE / PORC_MARGEN => por base (en tu modelo Contratacion no hay margen aún)
      totalComision = baseEUR * (pct / 100);
    }

    // min/max total
    const minEUR = decToNumber(regla.minEUR, NaN);
    const maxEUR = decToNumber(regla.maxEUR, NaN);
    if (Number.isFinite(minEUR)) totalComision = Math.max(totalComision, minEUR);
    if (Number.isFinite(maxEUR)) totalComision = Math.min(totalComision, maxEUR);

    totalComision = eur(totalComision);

    // 6) Reparto (por ahora con pctAgente de Agente y pctLugar de Lugar)
    const pctAgente = normalizePct((contratacion as any).agente?.pctAgente ?? 0);
    const pctLugar = normalizePct((contratacion as any).lugar?.pctLugar ?? 0);

    let agenteEUR = eur(totalComision * (pctAgente / 100));
    let lugarEUR = eur(totalComision * (pctLugar / 100));

    // límites opcionales en regla (si existen)
    const minAgenteEUR = decToNumber(regla.minAgenteEUR, NaN);
    const maxAgenteEUR = decToNumber(regla.maxAgenteEUR, NaN);

    if (Number.isFinite(minAgenteEUR)) agenteEUR = Math.max(agenteEUR, minAgenteEUR);
    if (Number.isFinite(maxAgenteEUR)) agenteEUR = Math.min(agenteEUR, maxAgenteEUR);

    const isLugarEspecial = Boolean((contratacion as any).lugar?.especial);
    if (isLugarEspecial) {
      const minLE = decToNumber(regla.minLugarEspecialEUR, NaN);
      const maxLE = decToNumber(regla.maxLugarEspecialEUR, NaN);
      if (Number.isFinite(minLE)) lugarEUR = Math.max(lugarEUR, minLE);
      if (Number.isFinite(maxLE)) lugarEUR = Math.min(lugarEUR, maxLE);
    }

    // admin = resto (nunca negativo)
    let adminEUR = eur(totalComision - agenteEUR - lugarEUR);
    if (adminEUR < 0) adminEUR = 0;

    // 7) Crear asiento (transaction)
    const created = await prisma.$transaction(async (tx) => {
      const asiento = await tx.asientoComision.create({
        data: {
          adminId: (contratacion as any).adminId ?? adminId ?? null,

          contratacionId: contratacionId,

          seccionId,
          subSeccionId,
          nivel: nivel as any,

          reglaId: regla.id ?? null,

          baseEUR: baseEUR as any,
          totalComision: totalComision as any,

          agenteEUR: agenteEUR as any,
          lugarEUR: lugarEUR as any,
          adminEUR: adminEUR as any,

          pctAgenteSnap: pctAgente as any,
          pctLugarSnap: pctLugar as any,

          leadId: (contratacion as any).leadId ?? null,
          clienteId: (contratacion as any).clienteId ?? null,
          agenteId: (contratacion as any).agenteId ?? null,
          lugarId: (contratacion as any).lugarId ?? null,

          estado: "PENDIENTE" as any,
          notas: null,
        } as any,
      });

      // Movimientos (si tu modelo existe). Lo hago “safe” con any para no romper el build
      try {
        const mv = (tx as any).movimientoComision;
        if (mv?.createMany) {
          await mv.createMany({
            data: [
              {
                asientoId: asiento.id,
                tipo: "GENERADO",
                destino: "AGENTE",
                destinoId: (contratacion as any).agenteId ?? null,
                importeEUR: agenteEUR,
              },
              {
                asientoId: asiento.id,
                tipo: "GENERADO",
                destino: "LUGAR",
                destinoId: (contratacion as any).lugarId ?? null,
                importeEUR: lugarEUR,
              },
              {
                asientoId: asiento.id,
                tipo: "GENERADO",
                destino: "ADMIN",
                destinoId: (contratacion as any).adminId ?? adminId ?? null,
                importeEUR: adminEUR,
              },
            ],
          });
        }
      } catch {
        // si tu tabla/campos no coinciden, no frenamos el asiento
      }

      return asiento;
    });

    return NextResponse.json({
      ok: true,
      asiento: created,
      regla: { id: regla.id, tipo, pct, fijo },
    });
  } catch (e: any) {
    return jsonError("Error interno asentando comisiones", 500, {
      message: String(e?.message ?? e),
    });
  }
}
