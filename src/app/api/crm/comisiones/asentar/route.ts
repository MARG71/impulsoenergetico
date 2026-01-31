export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole, sessionAdminId } from "@/lib/auth-server";
import { TipoCalculoComision } from "@prisma/client";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

function toMoney2(v: any) {
  const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function toNumber(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function clamp(n: number, min?: number | null, max?: number | null) {
  let x = n;
  if (typeof min === "number") x = Math.max(min, x);
  if (typeof max === "number") x = Math.min(max, x);
  return x;
}

async function pickRegla({
  seccionId,
  subSeccionId,
  nivel,
}: {
  seccionId: number;
  subSeccionId: number | null;
  nivel: any;
}) {
  if (subSeccionId) {
    const r1 = await prisma.reglaComisionGlobal.findFirst({
      where: { seccionId, subSeccionId, nivel, activa: true },
      orderBy: { id: "asc" },
    });
    if (r1) return r1;
  }
  const r2 = await prisma.reglaComisionGlobal.findFirst({
    where: { seccionId, subSeccionId: null, nivel, activa: true },
    orderBy: { id: "asc" },
  });
  if (r2) return r2;

  return prisma.reglaComisionGlobal.findFirst({
    where: { seccionId, nivel, activa: true },
    orderBy: { id: "asc" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = String(sessionRole(session) ?? "").toUpperCase();
    const adminId = sessionAdminId(session);

    if (!["ADMIN", "SUPERADMIN"].includes(role)) return jsonError("No autorizado", 403);

    const body = await req.json().catch(() => ({}));
    const contratacionId = Number(body?.contratacionId ?? 0);
    if (!Number.isFinite(contratacionId) || contratacionId <= 0) {
      return jsonError("contratacionId requerido");
    }

    const contratacion = await prisma.contratacion.findUnique({
      where: { id: contratacionId },
      include: {
        lugar: { select: { id: true, pctLugar: true, especial: true } },
        agente: { select: { id: true, pctAgente: true } },
      },
    });
    if (!contratacion) return jsonError("Contratación no encontrada", 404);

    // tenant check
    if (role !== "SUPERADMIN") {
      if ((contratacion as any).adminId && (contratacion as any).adminId !== adminId) {
        return jsonError("No autorizado para esta contratación", 403);
      }
    }

    if (String((contratacion as any).estado) !== "CONFIRMADA") {
      return jsonError("Solo se puede asentar una contratación CONFIRMADA", 400);
    }

    // Evitar duplicados (contratacionId es unique)
    const existente = await prisma.asientoComision.findUnique({
      where: { contratacionId },
      select: { id: true },
    });
    if (existente) {
      return NextResponse.json({ ok: true, asientoId: existente.id, already: true });
    }

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
    if (!regla) return jsonError("No hay regla activa para esta sección/nivel", 400);

    const fijo = toMoney2((regla as any).fijoEUR);
    const pct = toNumber((regla as any).porcentaje, 0);
    let total = 0;

    const tipo = (regla as any).tipo as TipoCalculoComision;
    if (tipo === "FIJA") total = fijo;
    else if (tipo === "PORC_BASE") total = base * (pct / 100);
    else if (tipo === "PORC_MARGEN") total = base * (pct / 100);
    else if (tipo === "MIXTA") total = fijo + base * (pct / 100);
    else total = base * (pct / 100);

    total = clamp(
      total,
      (regla as any).minEUR != null ? toMoney2((regla as any).minEUR) : null,
      (regla as any).maxEUR != null ? toMoney2((regla as any).maxEUR) : null
    );

    const defaults = await prisma.globalComisionDefaults.findUnique({ where: { id: 1 } });

    const pctAgenteSnap =
      toNumber((contratacion as any).agente?.pctAgente, NaN) ||
      (defaults ? toNumber(defaults.defaultPctAgente, 0) : 0);

    const pctLugarSnap =
      toNumber((contratacion as any).lugar?.pctLugar, NaN) ||
      (defaults ? toNumber(defaults.defaultPctLugar, 0) : 0);

    let agenteEUR = total * (pctAgenteSnap / 100);
    let lugarEUR = total * (pctLugarSnap / 100);

    agenteEUR = clamp(
      agenteEUR,
      (regla as any).minAgenteEUR != null ? toMoney2((regla as any).minAgenteEUR) : null,
      (regla as any).maxAgenteEUR != null ? toMoney2((regla as any).maxAgenteEUR) : null
    );

    const lugarEsEspecial = Boolean((contratacion as any).lugar?.especial);
    if (lugarEsEspecial) {
      lugarEUR = clamp(
        lugarEUR,
        (regla as any).minLugarEspecialEUR != null ? toMoney2((regla as any).minLugarEspecialEUR) : null,
        (regla as any).maxLugarEspecialEUR != null ? toMoney2((regla as any).maxLugarEspecialEUR) : null
      );
    }

    let adminEUR = total - agenteEUR - lugarEUR;
    if (!Number.isFinite(adminEUR) || adminEUR < 0) adminEUR = 0;

    const created = await prisma.asientoComision.create({
      data: {
        adminId: (contratacion as any).adminId ?? adminId ?? null,

        contratacionId,
        seccionId,
        subSeccionId,
        nivel: (contratacion as any).nivel,

        reglaId: (regla as any).id ?? null,

        baseEUR: base,
        totalComision: total,

        agenteEUR,
        lugarEUR,
        adminEUR,

        pctAgenteSnap,
        pctLugarSnap,

        leadId: (contratacion as any).leadId ?? null,
        clienteId: (contratacion as any).clienteId ?? null,
        agenteId: (contratacion as any).agenteId ?? null,
        lugarId: (contratacion as any).lugarId ?? null,

        // estado por defecto PENDIENTE (según tu schema)
      } as any,
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      asientoId: created.id,
      already: false,
    });
  } catch (e: any) {
    return jsonError("Error asentando comisión", 500, { message: String(e?.message ?? e) });
  }
}
