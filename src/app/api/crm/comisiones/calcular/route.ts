//src/app/api/crm/comisiones/calcular/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionRole,
  sessionAdminId,
} from "@/lib/auth-server";
import { TipoCalculoComision } from "@prisma/client";

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

function toMoney2(v: any) {
  // Prisma Decimal llega como string/Decimal. Convertimos a number seguro.
  const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, min?: number | null, max?: number | null) {
  let x = n;
  if (typeof min === "number") x = Math.max(min, x);
  if (typeof max === "number") x = Math.min(max, x);
  return x;
}

/**
 * Selección de regla:
 * 1) exacta (seccionId + subSeccionId + nivel + activa)
 * 2) fallback a subSeccionId = null (misma seccionId + nivel)
 * 3) fallback a cualquier activa de esa seccionId + nivel
 */
async function pickRegla({
  seccionId,
  subSeccionId,
  nivel,
}: {
  seccionId: number;
  subSeccionId: number | null;
  nivel: any;
}) {
  // 1) exacta
  if (subSeccionId) {
    const r1 = await prisma.reglaComisionGlobal.findFirst({
      where: { seccionId, subSeccionId, nivel, activa: true },
      orderBy: { id: "asc" },
    });
    if (r1) return r1;
  }

  // 2) null
  const r2 = await prisma.reglaComisionGlobal.findFirst({
    where: { seccionId, subSeccionId: null, nivel, activa: true },
    orderBy: { id: "asc" },
  });
  if (r2) return r2;

  // 3) cualquiera activa de sección+nivel
  const r3 = await prisma.reglaComisionGlobal.findFirst({
    where: { seccionId, nivel, activa: true },
    orderBy: { id: "asc" },
  });
  return r3;
}

export async function GET(req: Request) {
  try {
    const session = await getSessionOrThrow();
    const role = String(sessionRole(session) ?? "").toUpperCase();
    const adminId = sessionAdminId(session);

    if (!["ADMIN", "SUPERADMIN"].includes(role)) {
      return jsonError("No autorizado", 403);
    }

    const { searchParams } = new URL(req.url);
    const contratacionId = parseId(searchParams.get("contratacionId"));
    if (!contratacionId) return jsonError("contratacionId requerido", 400);

    const contratacion = await prisma.contratacion.findUnique({
      where: { id: contratacionId },
      include: {
        seccion: true,
        lugar: { select: { id: true, pctLugar: true, especial: true } },
        agente: { select: { id: true, pctAgente: true } },
      },
    });

    if (!contratacion) return jsonError("Contratación no encontrada", 404);

    // tenant: si no eres superadmin, debes pertenecer al adminId del registro
    if (role !== "SUPERADMIN") {
      if ((contratacion as any).adminId && (contratacion as any).adminId !== adminId) {
        return jsonError("No autorizado para esta contratación", 403);
      }
    }

    // base usada (EUR)
    const base =
      toMoney2((contratacion as any).baseImponible) ||
      toMoney2((contratacion as any).totalFactura) ||
      0;

    const seccionId = Number((contratacion as any).seccionId);
    const subSeccionId = (contratacion as any).subSeccionId
      ? Number((contratacion as any).subSeccionId)
      : null;

    const regla = await pickRegla({
      seccionId,
      subSeccionId,
      nivel: (contratacion as any).nivel,
    });

    if (!regla) {
      return NextResponse.json({
        ok: true,
        contratacionId,
        base,
        regla: null,
        comisiones: { total: 0, agente: 0, lugar: 0, admin: 0 },
        warning: "No hay reglas globales activas para esta sección/nivel.",
      });
    }

    // calcular total comisión según tipo
    const fijo = toMoney2((regla as any).fijoEUR);
    const pct = toNumber((regla as any).porcentaje, 0); // % (ej 10 => 10%)
    let total = 0;

    const tipo = (regla as any).tipo as TipoCalculoComision;

    if (tipo === "FIJA") total = fijo;
    else if (tipo === "PORC_BASE") total = base * (pct / 100);
    else if (tipo === "PORC_MARGEN") {
      // si algún día añades margen, aquí lo conectaríamos.
      total = base * (pct / 100);
    } else if (tipo === "MIXTA") total = fijo + base * (pct / 100);
    else total = base * (pct / 100);

    // clamp total por min/max regla
    total = clamp(
      total,
      (regla as any).minEUR != null ? toMoney2((regla as any).minEUR) : null,
      (regla as any).maxEUR != null ? toMoney2((regla as any).maxEUR) : null
    );

    // defaults de reparto (si no hay pct en agente/lugar)
    const defaults = await prisma.globalComisionDefaults.findUnique({
      where: { id: 1 },
    });

    const pctAgenteSnap =
      toNumber((contratacion as any).agente?.pctAgente, NaN) ||
      (defaults ? toNumber(defaults.defaultPctAgente, 0) : 0);

    const pctLugarSnap =
      toNumber((contratacion as any).lugar?.pctLugar, NaN) ||
      (defaults ? toNumber(defaults.defaultPctLugar, 0) : 0);

    let agente = total * (pctAgenteSnap / 100);
    let lugar = total * (pctLugarSnap / 100);

    // límites opcionales para pagar a red
    agente = clamp(
      agente,
      (regla as any).minAgenteEUR != null ? toMoney2((regla as any).minAgenteEUR) : null,
      (regla as any).maxAgenteEUR != null ? toMoney2((regla as any).maxAgenteEUR) : null
    );

    const lugarEsEspecial = Boolean((contratacion as any).lugar?.especial);
    if (lugarEsEspecial) {
      lugar = clamp(
        lugar,
        (regla as any).minLugarEspecialEUR != null ? toMoney2((regla as any).minLugarEspecialEUR) : null,
        (regla as any).maxLugarEspecialEUR != null ? toMoney2((regla as any).maxLugarEspecialEUR) : null
      );
    }

    // admin = resto (nunca negativo)
    let admin = total - agente - lugar;
    if (!Number.isFinite(admin) || admin < 0) admin = 0;

    return NextResponse.json({
      ok: true,
      contratacionId,
      base,
      regla: {
        id: regla.id,
        tipo: regla.tipo,
        porcentaje: regla.porcentaje,
        fijoEUR: regla.fijoEUR,
      },
      comisiones: {
        total,
        agente,
        lugar,
        admin,
      },
      reparto: {
        pctAgenteSnap,
        pctLugarSnap,
      },
    });
  } catch (e: any) {
    return jsonError("Error interno calculando comisiones", 500, {
      message: String(e?.message ?? e),
    });
  }
}
