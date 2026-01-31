// src/app/api/crm/comisiones/calcular/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { TipoCalculoComision, NivelComision } from "@prisma/client";

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function decToNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// pct guardado como 0.2500 => 25%
function pctToNumber(v: any): number {
  const n = decToNumber(v);
  if (n < 0) return 0;
  if (n > 1) return n / 100; // por si algún día guardas 25 en vez de 0.25
  return n;
}

function clamp(n: number, min?: number | null, max?: number | null) {
  const mi = min == null ? null : Number(min);
  const ma = max == null ? null : Number(max);
  let out = n;
  if (mi != null && Number.isFinite(mi)) out = Math.max(out, mi);
  if (ma != null && Number.isFinite(ma)) out = Math.min(out, ma);
  return out;
}

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const contratacionId = toId(req.nextUrl.searchParams.get("contratacionId"));
  if (!contratacionId) return jsonError(400, "contratacionId es obligatorio");

  try {
    const whereContr: any = { id: contratacionId };
    if (tenant.tenantAdminId != null) whereContr.adminId = tenant.tenantAdminId;

    const contr = await prisma.contratacion.findFirst({
      where: whereContr,
      select: {
        id: true,
        estado: true,
        nivel: true,
        seccionId: true,
        subSeccionId: true,
        baseImponible: true,
        totalFactura: true,
        agenteId: true,
        lugarId: true,
        adminId: true,
        leadId: true,
        clienteId: true,
      },
    });

    if (!contr) return jsonError(404, "Contratación no encontrada");

    // ✅ Regla global (según TU schema)
    const regla = await prisma.reglaComisionGlobal.findFirst({
      where: {
        seccionId: contr.seccionId,
        subSeccionId: contr.subSeccionId ?? null,
        nivel: contr.nivel as NivelComision,
        activa: true,
      },
      select: {
        id: true,
        tipo: true,
        fijoEUR: true,
        porcentaje: true,
        minEUR: true,
        maxEUR: true,
      },
    });

    if (!regla) {
      return jsonError(
        400,
        "No existe ReglaComisionGlobal activa para esa sección/subsección/nivel."
      );
    }

    const base = decToNumber(contr.baseImponible);
    const total = decToNumber(contr.totalFactura);

    // ✅ Pool admin calculado desde la regla
    let poolAdmin = 0;

    if (regla.tipo === TipoCalculoComision.FIJA) {
      poolAdmin = decToNumber(regla.fijoEUR);
    } else if (regla.tipo === TipoCalculoComision.PORC_BASE) {
      const pct = decToNumber(regla.porcentaje); // aquí lo interpretamos como %
      poolAdmin = base * (pct / 100);
    } else if (regla.tipo === TipoCalculoComision.PORC_MARGEN) {
      // todavía no tienes “margen” en schema de contratación => usamos BASE por ahora
      const pct = decToNumber(regla.porcentaje);
      poolAdmin = base * (pct / 100);
    } else if (regla.tipo === TipoCalculoComision.MIXTA) {
      const fijo = decToNumber(regla.fijoEUR);
      const pct = decToNumber(regla.porcentaje);
      poolAdmin = fijo + base * (pct / 100);
    }

    poolAdmin = clamp(poolAdmin, regla.minEUR as any, regla.maxEUR as any);

    // ✅ Reparto usando porcentajes del Lugar/Agente o defaults globales
    const defaults = await prisma.globalComisionDefaults.findUnique({
      where: { id: 1 },
      select: { defaultPctCliente: true, defaultPctLugar: true, defaultPctAgente: true },
    });

    const lugar = contr.lugarId
      ? await prisma.lugar.findUnique({
          where: { id: contr.lugarId },
          select: { id: true, pctCliente: true, pctLugar: true, especial: true },
        })
      : null;

    const agente = contr.agenteId
      ? await prisma.agente.findUnique({
          where: { id: contr.agenteId },
          select: { id: true, pctAgente: true },
        })
      : null;

    const pctCliente = pctToNumber(lugar?.pctCliente ?? defaults?.defaultPctCliente ?? 0);
    const pctLugar = pctToNumber(lugar?.pctLugar ?? defaults?.defaultPctLugar ?? 0);
    const pctAgente = pctToNumber(agente?.pctAgente ?? defaults?.defaultPctAgente ?? 0);

    const importeCliente = poolAdmin * pctCliente;
    const importeLugar = poolAdmin * pctLugar;
    const importeAgente = poolAdmin * pctAgente;

    const totalRed = importeCliente + importeLugar + importeAgente;
    const restoAdmin = poolAdmin - totalRed;

    return NextResponse.json({
      ok: true,
      contratacionId: contr.id,
      reglaId: regla.id,
      base,
      total,
      poolAdmin,
      reparto: {
        pctCliente,
        pctLugar,
        pctAgente,
        importeCliente,
        importeLugar,
        importeAgente,
        restoAdmin,
      },
      nota:
        "Este endpoint devuelve cálculo. El guardado de asientos (histórico) lo hacemos en el siguiente paso.",
    });
  } catch (e: any) {
    console.error("GET /api/crm/comisiones/calcular error:", e);
    return jsonError(500, "Error calculando comisiones");
  }
}
