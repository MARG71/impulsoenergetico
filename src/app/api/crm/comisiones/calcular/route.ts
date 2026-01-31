export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole, sessionAdminId } from "@/lib/auth-server";

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
  if (v === null || v === undefined) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function toMoneyBase(contratacion: any) {
  // Preferimos baseImponible, si no totalFactura, si no 0
  const baseImponible = toNumber(contratacion?.baseImponible, 0);
  if (baseImponible > 0) return baseImponible;

  const totalFactura = toNumber(contratacion?.totalFactura, 0);
  if (totalFactura > 0) return totalFactura;

  // Si tu modelo tiene otros campos, puedes ampliar aquí:
  const importeComisionable = toNumber(contratacion?.importeComisionable, 0);
  if (importeComisionable > 0) return importeComisionable;

  return 0;
}

export async function GET(req: Request) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const adminId = sessionAdminId(session);

    if (!["ADMIN", "SUPERADMIN"].includes(String(role))) {
      return jsonError("No autorizado", 403);
    }

    const { searchParams } = new URL(req.url);
    const contratacionId = parseId(searchParams.get("contratacionId"));
    if (!contratacionId) return jsonError("contratacionId requerido", 400);

    const contratacion = await prisma.contratacion.findUnique({
      where: { id: contratacionId },
      include: {
        seccion: true as any,
        agente: true as any,
        lugar: true as any,
      } as any,
    });

    if (!contratacion) return jsonError("Contratación no encontrada", 404);

    // Scope: si contratacion tiene adminId, validar para ADMIN (SUPERADMIN ve todo)
    if (String(role) !== "SUPERADMIN") {
      if ((contratacion as any).adminId && (contratacion as any).adminId !== adminId) {
        return jsonError("No autorizado para esta contratación", 403);
      }
    }

    const base = toMoneyBase(contratacion);

    // ✅ Reglas globales SIN filtrar por adminId (porque tu schema NO lo tiene)
    const reglas = await prisma.reglaComisionGlobal.findMany({
      orderBy: { id: "asc" },
    });

    // Elegir regla por seccionId si existe
    const seccionId = toNumber((contratacion as any).seccionId, 0);

    let regla: any =
      reglas.find((r: any) => toNumber(r.seccionId, 0) === seccionId && r.activa !== false) ||
      reglas.find((r: any) => r.activa !== false) ||
      reglas[0] ||
      null;

    if (!regla) {
      return NextResponse.json({
        ok: true,
        contratacionId,
        base,
        regla: null,
        comisiones: { total: 0, agente: 0, lugar: 0, admin: 0 },
        warning: "No hay reglas globales. Crea al menos 1 regla.",
      });
    }

    // Campos flexibles
    const pctGlobal = toNumber(regla.porcentaje ?? regla.porcentajeGlobal, 0);
    const pctAgente = toNumber(regla.porcentajeAgente ?? regla.agentePorcentaje, 0);
    const pctLugar = toNumber(regla.porcentajeLugar ?? regla.lugarPorcentaje, 0);

    const fijoAgente = toNumber(regla.fijoAgente, 0);
    const fijoLugar = toNumber(regla.fijoLugar, 0);

    const total = base * (pctGlobal / 100);
    const agente = base * (pctAgente / 100) + fijoAgente;
    const lugar = base * (pctLugar / 100) + fijoLugar;
    const admin = Math.max(0, total - agente - lugar);

    return NextResponse.json({
      ok: true,
      contratacionId,
      base,
      reglaId: regla.id ?? null,
      comisiones: { total, agente, lugar, admin },
      ...(base <= 0 ? { warning: "Base = 0. Rellena baseImponible o totalFactura para calcular bien." } : {}),
    });
  } catch (e: any) {
    return jsonError("Error interno calculando comisiones", 500, {
      message: String(e?.message ?? e),
    });
  }
}
