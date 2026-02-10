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

function parseId(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return jsonError(ctx.error, ctx.status);

  const id = parseId(params.id);
  if (!id) return jsonError("ID inválido", 400);

  const regla = await prisma.reglaComisionGlobal.findUnique({
    where: { id },
    include: { seccion: true, subSeccion: true },
  });

  if (!regla) return jsonError("Regla no encontrada", 404);

  // ✅ tenant
  // - SUPERADMIN: puede leer cualquiera
  // - resto: solo su tenantAdminId o global (adminId null) si lo usas
  if (!ctx.isSuperadmin) {
    const t = ctx.tenantAdminId ?? null;
    if ((regla as any).adminId !== t) {
      return jsonError("No autorizado", 403);
    }
  }

  return NextResponse.json({ ok: true, regla });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return jsonError(ctx.error, ctx.status);

  if (!ctx.isSuperadmin && !ctx.isAdmin) return jsonError("No autorizado", 403);

  const id = parseId(params.id);
  if (!id) return jsonError("ID inválido", 400);

  const current = await prisma.reglaComisionGlobal.findUnique({ where: { id } });
  if (!current) return jsonError("Regla no encontrada", 404);

  if (!ctx.isSuperadmin) {
    const t = ctx.tenantAdminId ?? null;
    if ((current as any).adminId !== t) return jsonError("No autorizado", 403);
  }

  const body = await req.json().catch(() => ({}));

  // Campos editables (mismo set que ya usas)
  const fields = [
    "seccionId","subSeccionId","nivel","tipo",
    "fijoEUR","porcentaje","minEUR","maxEUR",
    "minAgenteEUR","maxAgenteEUR","minLugarEspecialEUR","maxLugarEspecialEUR",
    "activa",
  ] as const;

  const data: any = {};
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  // Seguridad: si NO eres superadmin, no permitas cambiar adminId
  if (body.adminId !== undefined && !ctx.isSuperadmin) {
    return jsonError("No se puede cambiar adminId", 403);
  }
  // Si es superadmin y quieres permitir cambiar adminId, descomenta:
  // if (body.adminId !== undefined) data.adminId = body.adminId;

  const updated = await prisma.reglaComisionGlobal.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, regla: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return jsonError(ctx.error, ctx.status);

  // yo lo limitaría a SUPERADMIN/ADMIN (y ADMIN solo su tenant)
  if (!ctx.isSuperadmin && !ctx.isAdmin) return jsonError("No autorizado", 403);

  const id = parseId(params.id);
  if (!id) return jsonError("ID inválido", 400);

  const current = await prisma.reglaComisionGlobal.findUnique({ where: { id } });
  if (!current) return jsonError("Regla no encontrada", 404);

  if (!ctx.isSuperadmin) {
    const t = ctx.tenantAdminId ?? null;
    if ((current as any).adminId !== t) return jsonError("No autorizado", 403);
  }

  // ✅ recomendable: “borrado lógico” (activa=false) para no romper históricos
  const updated = await prisma.reglaComisionGlobal.update({
    where: { id },
    data: { activa: false } as any,
  });

  return NextResponse.json({ ok: true, deleted: true, regla: updated });
}
