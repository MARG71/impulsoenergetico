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
  const n = typeof v === "string" ? Number(v) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, min?: number | null, max?: number | null) {
  let x = n;
  if (typeof min === "number") x = Math.max(min, x);
  if (typeof max === "number") x = Math.min(max, x);
  return x;
}

async function pickRegla({
  adminId,
  seccionId,
  subSeccionId,
  nivel,
}: {
  adminId: number | null;
  seccionId: number;
  subSeccionId: number | null;
  nivel: any;
}) {
  // 1) exacta tenant
  if (subSeccionId) {
    const r1 = await prisma.reglaComisionGlobal.findFirst({
      where: { adminId, seccionId, subSeccionId, nivel, activa: true },
      orderBy: { id: "asc" },
    });
    if (r1) return r1;
  }

  // 2) general tenant
  const r2 = await prisma.reglaComisionGlobal.findFirst({
    where: { adminId, seccionId, subSeccionId: null, nivel, activa: true },
    orderBy: { id: "asc" },
  });
  if (r2) return r2;

  // 3) cualquiera tenant
  const r3 = await prisma.reglaComisionGlobal.findFirst({
    where: { adminId, seccionId, nivel, activa: true },
    orderBy: { id: "asc" },
  });
  if (r3) return r3;

  // 4) fallback global (adminId=null)
  if (adminId !== null) {
    if (subSeccionId) {
      const g1 = await prisma.reglaComisionGlobal.findFirst({
        where: { adminId: null, seccionId, subSeccionId, nivel, activa: true },
        orderBy: { id: "asc" },
      });
      if (g1) return g1;
    }

    const g2 = await prisma.reglaComisionGlobal.findFirst({
      where: { adminId: null, seccionId, subSeccionId: null, nivel, activa: true },
      orderBy: { id: "asc" },
    });
    if (g2) return g2;

    const g3 = await prisma.reglaComisionGlobal.findFirst({
      where: { adminId: null, seccionId, nivel, activa: true },
      orderBy: { id: "asc" },
    });
    return g3;
  }

  return null;
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

    const tenantRulesAdminId = (contratacion as any).adminId ?? null;

    const regla = await pickRegla({
      adminId: tenantRulesAdminId,
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
        warning: "No hay reglas activas para esta sección/nivel (ni tenant ni global).",
      });
    }

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

    const defaults = await prisma.globalComisionDefaults.findUnique({
      where: { id: 1 },
    });

    const pctAgenteSnap =
      toNumber((contratacion as any).agente?.pctAgente, NaN) ||
      (defaults ? toNumber((defaults as any).defaultPctAgente, 0) : 0);

    const pctLugarSnap =
      toNumber((contratacion as any).lugar?.pctLugar, NaN) ||
      (defaults ? toNumber((defaults as any).defaultPctLugar, 0) : 0);

    let agente = total * (pctAgenteSnap / 100);
    let lugar = total * (pctLugarSnap / 100);

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

    let admin = total - agente - lugar;
    if (!Number.isFinite(admin) || admin < 0) admin = 0;

    return NextResponse.json({
      ok: true,
      contratacionId,
      base,
      regla: {
        id: (regla as any).id,
        tipo: (regla as any).tipo,
        porcentaje: (regla as any).porcentaje,
        fijoEUR: (regla as any).fijoEUR,
        adminId: (regla as any).adminId ?? null,
      },
      comisiones: { total, agente, lugar, admin },
      reparto: { pctAgenteSnap, pctLugarSnap },
    });
  } catch (e: any) {
    return jsonError("Error interno calculando comisiones", 500, {
      message: String(e?.message ?? e),
    });
  }
}
