// src/app/api/crm/contrataciones/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { Prisma, EstadoContratacion, NivelComision } from "@prisma/client";

const toInt = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toStr = (v: any) => (typeof v === "string" ? v.trim() : "");

const toDec = (v: any) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return new Prisma.Decimal(n);
};

// ✅ convierte string -> enum real (o undefined)
function parseEstado(v: any): EstadoContratacion | undefined {
  const s = toStr(v);
  if (!s) return undefined;
  if ((Object.values(EstadoContratacion) as string[]).includes(s)) return s as EstadoContratacion;
  return undefined;
}

function parseNivel(v: any): NivelComision | undefined {
  const s = toStr(v);
  if (!s) return undefined;
  if ((Object.values(NivelComision) as string[]).includes(s)) return s as NivelComision;
  return undefined;
}

function allowRole(role: string, allowed: string[]) {
  return allowed.includes(role);
}

export async function GET(req: NextRequest) {
  const t = await getTenantContext(req);
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

  if (!allowRole(t.role, ["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"])) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const q = toStr(req.nextUrl.searchParams.get("q"));
  const estadoQ = parseEstado(req.nextUrl.searchParams.get("estado"));
  const nivelQ = parseNivel(req.nextUrl.searchParams.get("nivel"));

  const where: any = {};

  // ✅ multi-tenant
  if (t.tenantAdminId) where.adminId = t.tenantAdminId;

  // ✅ si es AGENTE/LUGAR, restringimos a su ámbito (para que no vean todo)
  if (t.role === "AGENTE" && t.agenteId) where.agenteId = t.agenteId;
  if (t.role === "LUGAR" && t.lugarId) where.lugarId = t.lugarId;

  if (estadoQ) where.estado = estadoQ;
  if (nivelQ) where.nivel = nivelQ;

  if (q) {
    where.OR = [
      { notas: { contains: q, mode: "insensitive" } },
      // si luego guardas nombre/email del cliente como snapshot, añádelo aquí
    ];
  }

  const items = await prisma.contratacion.findMany({
    where,
    orderBy: { id: "desc" },
    take: 200,
    include: {
      seccion: true,
      subSeccion: true,
      lead: { select: { id: true, nombre: true, email: true, telefono: true } },
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
      agente: { select: { id: true, nombre: true } },
      lugar: { select: { id: true, nombre: true } },
      documentos: true,
    },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const t = await getTenantContext(req);
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

  if (!allowRole(t.role, ["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"])) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  const seccionId = toInt(body.seccionId);
  const subSeccionId = toInt(body.subSeccionId);
  const leadId = toInt(body.leadId);
  const clienteId = toInt(body.clienteId);

  const agenteId = toInt(body.agenteId) ?? t.agenteId ?? null;
  const lugarId = toInt(body.lugarId) ?? t.lugarId ?? null;

  const estado = parseEstado(body.estado) ?? EstadoContratacion.BORRADOR;
  const nivel = parseNivel(body.nivel) ?? NivelComision.C1;

  const baseImponible = toDec(body.baseImponible);
  const totalFactura = toDec(body.totalFactura);

  const notas = toStr(body.notas) || null;

  if (!seccionId) return NextResponse.json({ error: "Falta seccionId" }, { status: 400 });

  const created = await prisma.contratacion.create({
    data: {
      estado,
      nivel,
      seccionId,
      subSeccionId: subSeccionId ?? null,
      leadId: leadId ?? null,
      clienteId: clienteId ?? null,
      agenteId,
      lugarId,
      baseImponible,
      totalFactura,
      notas,
      adminId: t.tenantAdminId ?? null,
    },
  });

  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}

/**
 * ✅ PATCH en /api/crm/contrataciones
 * Body: { id, estado?, nivel?, notas?, baseImponible?, totalFactura?, seccionId?, subSeccionId? }
 */
export async function PATCH(req: NextRequest) {
  const t = await getTenantContext(req);
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

  if (!allowRole(t.role, ["SUPERADMIN", "ADMIN"])) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id = toInt(body.id);
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const nextEstado = parseEstado(body.estado);
  const nextNivel = parseNivel(body.nivel);

  const data: any = {};

  // ✅ aquí está la corrección del error: NO strings, solo enums válidos
  if (nextEstado) data.estado = nextEstado;
  if (nextNivel) data.nivel = nextNivel;

  if (body.notas !== undefined) data.notas = toStr(body.notas) || null;
  if (body.baseImponible !== undefined) data.baseImponible = toDec(body.baseImponible);
  if (body.totalFactura !== undefined) data.totalFactura = toDec(body.totalFactura);

  const seccionId = toInt(body.seccionId);
  const subSeccionId = toInt(body.subSeccionId);
  if (body.seccionId !== undefined) data.seccionId = seccionId;
  if (body.subSeccionId !== undefined) data.subSeccionId = subSeccionId ?? null;

  // ✅ multi-tenant: evitamos tocar registros fuera del tenant
  const where: any = { id };
  if (t.tenantAdminId) where.adminId = t.tenantAdminId;

  const updated = await prisma.contratacion.update({
    where,
    data,
  });

  return NextResponse.json({ ok: true, item: updated });
}
