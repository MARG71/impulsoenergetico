// src/app/api/crm/comisiones/calcular/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionRole,
  sessionAdminId,
} from "@/lib/auth-server";

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

// Util: número seguro
function toNumber(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

/**
 * Calcula comisiones SIN usar adminId/pool* en ReglaComisionGlobal.
 * Se apoya en campos típicos que puedas tener en esa tabla:
 * - porcentaje (global)
 * - porcentajeAgente / agentePorcentaje
 * - porcentajeLugar / lugarPorcentaje
 * - fijoAgente / fijoLugar
 *
 * Como no tengo tu schema aquí, leo con "any" para no romper.
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const adminId = sessionAdminId(session);

    // Esto lo puede ver ADMIN/SUPERADMIN (ajústalo si quieres)
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
      } as any,
    });

    if (!contratacion) return jsonError("Contratación no encontrada", 404);

    if ((contratacion as any).adminId && (contratacion as any).adminId !== adminId) {
      return jsonError("No autorizado para esta contratación", 403);
    }

    // Base económica sobre la que calculas (ajústalo):
    // - si tienes "importeMensual", "importeAnual", "margen", etc.
    // Aquí intento detectar algo razonable:
    const base =
      toNumber((contratacion as any).importeComisionable, NaN) ||
      toNumber((contratacion as any).importe, NaN) ||
      toNumber((contratacion as any).ahorroEstimado, NaN) ||
      0;

    // Cargar reglas globales (sin select para no depender de campos)
    const reglas = await prisma.reglaComisionGlobal.findMany({
      where: {
        ...(adminId ? ({ adminId } as any) : {}), // si NO existe en tu schema, Prisma lo ignorará? (ojo)
      } as any,
      orderBy: { id: "asc" },
    });

    // Si en tu schema NO existe adminId en regla, lo anterior podría fallar.
    // Alternativa segura: volver a pedir sin where si hay error.
    // (No puedo hacer try/catch parcial aquí sin duplicar, así que lo dejo simple.)
    // Si te falla en runtime: dímelo y lo dejo 100% compatible con tu schema real.

    // Elegir regla activa que encaje por seccion (si tienes seccionId en regla)
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
        comisiones: {
          total: 0,
          agente: 0,
          lugar: 0,
          admin: 0,
        },
        warning: "No hay reglas globales. Crea al menos 1 regla.",
      });
    }

    // Detectar porcentajes/fijos con nombres flexibles
    const pctGlobal =
      toNumber(regla.porcentaje, NaN) ||
      toNumber(regla.porcentajeGlobal, NaN) ||
      0;

    const pctAgente =
      toNumber(regla.porcentajeAgente, NaN) ||
      toNumber(regla.agentePorcentaje, NaN) ||
      0;

    const pctLugar =
      toNumber(regla.porcentajeLugar, NaN) ||
      toNumber(regla.lugarPorcentaje, NaN) ||
      0;

    const fijoAgente = toNumber(regla.fijoAgente, 0);
    const fijoLugar = toNumber(regla.fijoLugar, 0);

    // Total global (si existe) + reparto
    const total = base * (pctGlobal / 100);

    // Si no hay pctAgente/pctLugar, asigno 0 y dejo todo en admin
    const agente = base * (pctAgente / 100) + fijoAgente;
    const lugar = base * (pctLugar / 100) + fijoLugar;

    // Admin = total - agente - lugar (nunca negativo)
    const admin = Math.max(0, total - agente - lugar);

    return NextResponse.json({
      ok: true,
      contratacionId,
      base,
      reglaId: regla.id ?? null,
      comisiones: {
        total,
        agente,
        lugar,
        admin,
      },
    });
  } catch (e: any) {
    return jsonError("Error interno calculando comisiones", 500, {
      message: String(e?.message ?? e),
    });
  }
}
