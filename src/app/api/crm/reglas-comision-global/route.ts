//src/app/api/crm/reglas-comision-global/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const seccionId = Number(url.searchParams.get("seccionId") ?? 0);
  const subSeccionId = url.searchParams.get("subSeccionId");
  const nivel = url.searchParams.get("nivel");

  const ctx = await getTenantContext(req);
  if (!ctx.ok) return jsonError(ctx.error, ctx.status);

  const where: any = {};

  // ✅ Tenant:
  // - SUPERADMIN: puede listar por adminId query (?adminId=) o global (si no hay)
  // - ADMIN: solo sus reglas (adminId = tenantAdminId)
  // - resto: por seguridad, no deberían gestionar reglas (pero listamos por tenant si hace falta)
  if (ctx.isSuperadmin) {
    // tenantAdminId puede ser null => reglas globales
    where.adminId = ctx.tenantAdminId ?? null;
  } else {
    where.adminId = ctx.tenantAdminId ?? null;
  }

  if (seccionId) where.seccionId = seccionId;
  if (subSeccionId != null && subSeccionId !== "") where.subSeccionId = Number(subSeccionId);
  if (nivel) where.nivel = nivel;

  const reglas = await prisma.reglaComisionGlobal.findMany({
    where,
    orderBy: [{ seccionId: "asc" }, { subSeccionId: "asc" }, { nivel: "asc" }],
    include: { seccion: true, subSeccion: true },
  });

  return NextResponse.json({ ok: true, reglas });
}

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return jsonError(ctx.error, ctx.status);

  // ✅ Aquí decide: ¿solo SUPERADMIN crea reglas? o también ADMIN
  // Te recomiendo permitir ADMIN para que cada admin gestione las suyas:
  if (!ctx.isSuperadmin && !ctx.isAdmin) return jsonError("No autorizado", 403);

  const body = await req.json().catch(() => ({}));

  const seccionId = Number(body?.seccionId);
  const subSeccionId = body?.subSeccionId != null ? Number(body.subSeccionId) : null;
  const nivel = String(body?.nivel ?? "");
  const tipo = String(body?.tipo ?? "");

  if (!seccionId) return jsonError("Falta seccionId", 400);
  if (!nivel) return jsonError("Falta nivel", 400);
  if (!tipo) return jsonError("Falta tipo", 400);

  // ✅ adminId destino:
  // - SUPERADMIN: usa tenantAdminId (query ?adminId=) o null global
  // - ADMIN: su tenantAdminId (que en tu caso es su userId)
  const adminIdToUse = ctx.isSuperadmin ? (ctx.tenantAdminId ?? null) : (ctx.tenantAdminId ?? null);

  const created = await prisma.reglaComisionGlobal.create({
    data: {
      adminId: adminIdToUse,

      seccionId,
      subSeccionId,
      nivel: nivel as any,
      tipo: tipo as any,

      fijoEUR: body?.fijoEUR ?? null,
      porcentaje: body?.porcentaje ?? null,

      minEUR: body?.minEUR ?? null,
      maxEUR: body?.maxEUR ?? null,

      minAgenteEUR: body?.minAgenteEUR ?? null,
      maxAgenteEUR: body?.maxAgenteEUR ?? null,
      minLugarEspecialEUR: body?.minLugarEspecialEUR ?? null,
      maxLugarEspecialEUR: body?.maxLugarEspecialEUR ?? null,

      activa: body?.activa ?? true,
    } as any,
  });

  return NextResponse.json({ ok: true, regla: created });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return jsonError(ctx.error, ctx.status);

  if (!ctx.isSuperadmin && !ctx.isAdmin) return jsonError("No autorizado", 403);

  const body = await req.json().catch(() => ({}));
  const id = Number(body?.id);
  if (!id) return jsonError("Falta id", 400);

  const current = await prisma.reglaComisionGlobal.findUnique({ where: { id } });
  if (!current) return jsonError("Regla no encontrada", 404);

  if (!ctx.isSuperadmin) {
    const t = ctx.tenantAdminId ?? null;
    if ((current as any).adminId !== t) return jsonError("No autorizado", 403);
  }

  const data: any = {};
  const fields = [
    "seccionId","subSeccionId","nivel","tipo",
    "fijoEUR","porcentaje","minEUR","maxEUR",
    "minAgenteEUR","maxAgenteEUR","minLugarEspecialEUR","maxLugarEspecialEUR",
    "activa",
  ] as const;

  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  // Seguridad: no cambiar adminId salvo superadmin (si lo quieres)
  if (body.adminId !== undefined && !ctx.isSuperadmin) {
    return jsonError("No se puede cambiar adminId", 403);
  }

  const updated = await prisma.reglaComisionGlobal.update({ where: { id }, data });
  return NextResponse.json({ ok: true, regla: updated });
}
