export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

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

// ✅ Next.js 15: el "context" NO lo tipamos como { params: { id: string } }
// Lo recibimos como "any" y leemos context.params.id
export async function GET(req: Request, context: any) {
  const ctx = await getTenantContext(req as any);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const id = parseId(context?.params?.id);
  if (!id) return jsonError("ID inválido", 400);

  const regla = await prisma.reglaComisionGlobal.findUnique({
    where: { id },
    include: { seccion: true, subSeccion: true },
  });

  if (!regla) return jsonError("Regla no encontrada", 404);

  // ✅ MULTI-TENANT: SUPERADMIN ve todo; ADMIN solo sus reglas (adminId = userId) o global (adminId = null)
  if (!ctx.isSuperadmin) {
    if (ctx.tenantAdminId == null) return jsonError("tenantAdminId no disponible", 400);
    const ok = regla.adminId === null || regla.adminId === ctx.tenantAdminId;
    if (!ok) return jsonError("No autorizado", 403);
  }

  return NextResponse.json({ ok: true, regla });
}

export async function PATCH(req: Request, context: any) {
  const ctx = await getTenantContext(req as any);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  if (!ctx.isSuperadmin) return jsonError("No autorizado", 403);

  const id = parseId(context?.params?.id);
  if (!id) return jsonError("ID inválido", 400);

  const body = await req.json().catch(() => ({}));

  const fields = [
    "adminId",
    "seccionId",
    "subSeccionId",
    "nivel",
    "tipo",
    "fijoEUR",
    "porcentaje",
    "minEUR",
    "maxEUR",
    "minAgenteEUR",
    "maxAgenteEUR",
    "minLugarEspecialEUR",
    "maxLugarEspecialEUR",
    "activa",
  ] as const;

  const data: any = {};
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  const updated = await prisma.reglaComisionGlobal.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, regla: updated });
}

export async function DELETE(req: Request, context: any) {
  const ctx = await getTenantContext(req as any);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  if (!ctx.isSuperadmin) return jsonError("No autorizado", 403);

  const id = parseId(context?.params?.id);
  if (!id) return jsonError("ID inválido", 400);

  await prisma.reglaComisionGlobal.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
