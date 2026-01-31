export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { TipoCalculoComision } from "@prisma/client";

function jsonError(status: number, message: string, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ? { extra } : {}) }, { status });
}

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function decToNum(v: any, def = 0) {
  if (v == null) return def;
  if (typeof v?.toNumber === "function") return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function clamp(n: number, min?: number | null, max?: number | null) {
  let x = n;
  if (typeof min === "number") x = Math.max(min, x);
  if (typeof max === "number") x = Math.min(max, x);
  return x;
}

function normPctToRatio(p: number) {
  if (!Number.isFinite(p)) return 0;
  if (p <= 1) return p;
  return p / 100;
}

// ratio (0..1) -> pct (0..100) con 3 decimales
function ratioToPctSnap(r: number) {
  const pct = r * 100;
  return Math.round(pct * 1000) / 1000;
}

export async function POST(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const role = String((tenant as any)?.role || (tenant as any)?.tenantRole || "").toUpperCase();
  if (!["ADMIN", "SUPERADMIN"].includes(role)) return jsonError(403, "No autorizado");

  const body = await req.json().catch(() => ({}));
  const contratacionId = toId(body?.contratacionId);
  if (!contratacionId) return jsonError(400, "contratacionId requerido");

  // Scope tenant
  const whereTenant: any = { id: contratacionId };
  if (role !== "SUPERADMIN") {
    if (tenant.tenantAdminId == null) return jsonError(400, "tenantAdminId no disponible");
    whereTenant.adminId = tenant.tenantAdminId;
  }

  const c = await prisma.contratacion.findFirst({
    where: whereTenant,
    include: { lugar: true, agente: true, seccion: true, subSeccion: true },
  });

  if (!c) return jsonError(404, "Contratación no encontrada");

  // Si quieres exigir CONFIRMADA para asentar, descomenta:
  // if ((c as any).estado !== "CONFIRMADA") return jsonError(400, "Solo se puede asentar si está CONFIRMADA");

  // Evitar duplicados
  const existente = await prisma.asientoComision.findUnique({
    where: { contratacionId: (c as any).id },
    select: { id: true },
  });

  if (existente) {
    return NextResponse.json({ ok: true, already: true, asientoId: existente.id });
  }

  // base
  const baseImponible = decToNum((c as any).baseImponible, NaN);
  const totalFactura = decToNum((c as any).totalFactura, NaN);
  const base = Number.isFinite(baseImponible) ? baseImponible : (Number.isFinite(totalFactura) ? totalFactura : 0);

  // regla
  const reglas = await prisma.reglaComisionGlobal.findMany({
    where: {
      seccionId: (c as any).seccionId,
      activa: true,
      nivel: (c as any).nivel,
    } as any,
    orderBy: [{ subSeccionId: "desc" }, { id: "asc" }],
  });

  const subSeccionId = ((c as any).subSeccionId ?? null) as number | null;
  const regla =
    reglas.find((r: any) => r.subSeccionId != null && r.subSeccionId === subSeccionId) ||
    reglas.find((r: any) => r.subSeccionId == null) ||
    null;

  if (!regla) return jsonError(400, "No hay ReglaComisionGlobal activa para esta sección/nivel");

  const tipo = (regla as any).tipo as TipoCalculoComision;
  const fijoEUR = decToNum((regla as any).fijoEUR, 0);
  const porcentaje = decToNum((regla as any).porcentaje, 0);

  let total = 0;
  if (tipo === "FIJA") total = fijoEUR;
  else if (tipo === "PORC_BASE") total = base * (porcentaje / 100);
  else if (tipo === "PORC_MARGEN") total = base * (porcentaje / 100);
  else if (tipo === "MIXTA") total = fijoEUR + base * (porcentaje / 100);

  total = clamp(total, decToNum((regla as any).minEUR, null as any), decToNum((regla as any).maxEUR, null as any));

  // pct reparto
  const defaults = await prisma.globalComisionDefaults.findUnique({ where: { id: 1 } });

  const pctAgenteRaw = decToNum(
    (c as any).agente?.pctAgente,
    defaults ? decToNum((defaults as any).defaultPctAgente, 0) : 0
  );
  const pctLugarRaw = decToNum(
    (c as any).lugar?.pctLugar,
    defaults ? decToNum((defaults as any).defaultPctLugar, 0) : 0
  );

  const pctAgenteRatio = normPctToRatio(pctAgenteRaw);
  const pctLugarRatio = normPctToRatio(pctLugarRaw);

  let agente = total * pctAgenteRatio;
  let lugar = total * pctLugarRatio;

  agente = clamp(
    agente,
    decToNum((regla as any).minAgenteEUR, null as any),
    decToNum((regla as any).maxAgenteEUR, null as any)
  );

  const esEspecial = Boolean((c as any).lugar?.especial);
  if (esEspecial) {
    lugar = clamp(
      lugar,
      decToNum((regla as any).minLugarEspecialEUR, null as any),
      decToNum((regla as any).maxLugarEspecialEUR, null as any)
    );
  }

  let admin = total - agente - lugar;
  if (admin < 0) admin = 0;

  const asiento = await prisma.asientoComision.create({
    data: {
      adminId: (c as any).adminId ?? tenant.tenantAdminId ?? null,

      contratacionId: (c as any).id,

      seccionId: (c as any).seccionId,
      subSeccionId: (c as any).subSeccionId ?? null,
      nivel: (c as any).nivel,

      reglaId: (regla as any).id ?? null,

      baseEUR: base,
      totalComision: total,

      agenteEUR: agente,
      lugarEUR: lugar,
      adminEUR: admin,

      // Snap 0..100
      pctAgenteSnap: ratioToPctSnap(pctAgenteRatio),
      pctLugarSnap: ratioToPctSnap(pctLugarRatio),

      leadId: (c as any).leadId ?? null,
      clienteId: (c as any).clienteId ?? null,
      agenteId: (c as any).agenteId ?? null,
      lugarId: (c as any).lugarId ?? null,

      // estado: PENDIENTE (por defecto)
      notas: null,
    } as any,
  });

  return NextResponse.json({ ok: true, asiento });
}
