// src/app/api/crm/subsecciones/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function sessionInfo(session: any) {
  const role = String(session?.user?.role ?? session?.user?.rol ?? "");
  const userId = Number(session?.user?.id ?? 0);
  const adminId = Number(session?.user?.adminId ?? 0);

  // ✅ SUPERADMIN ve todo (sin filtro tenant)
  // ✅ ADMIN es el tenant (adminId = userId)
  // ✅ resto usa adminId de sesión
  let tenantAdminId: number | null = null;
  if (role === "SUPERADMIN") tenantAdminId = null;
  else if (role === "ADMIN") tenantAdminId = userId || null;
  else tenantAdminId = adminId || null;

  return { role, tenantAdminId };
}

function normalizeHex(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const hex = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null;
}

function parseId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * GET /api/crm/subsecciones?seccionId=1&parentId= (vacío o null => ROOT)
 * Devuelve hijosCount filtrado por tenant (NO usa _count.hijos porque engaña)
 */
export async function GET(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantAdminId } = sessionInfo(auth.session);

  const url = new URL(req.url);
  const seccionId = parseId(url.searchParams.get("seccionId"));
  const parentIdRaw = url.searchParams.get("parentId");

  const parentId =
    parentIdRaw === null || parentIdRaw === "" || parentIdRaw === "null"
      ? null
      : parseId(parentIdRaw);

  if (!seccionId) return NextResponse.json({ error: "seccionId requerido" }, { status: 400 });

  const whereAdmin =
    tenantAdminId ? { OR: [{ adminId: tenantAdminId }, { adminId: null }] } : undefined;

  // 1) Traemos las subsecciones del nivel actual (filtradas por tenant)
  const items = await prisma.subSeccion.findMany({
    where: {
      ...(whereAdmin as any),
      seccionId,
      parentId,
    } as any,
    orderBy: [{ activa: "desc" }, { nombre: "asc" }],
    select: {
      id: true,
      seccionId: true,
      parentId: true,
      nombre: true,
      slug: true,
      activa: true,
      colorHex: true,
      imagenUrl: true,
    },
  });

  // 2) Calculamos hijosCount FILTRADO por tenant (para no engañar)
  const ids = items.map((x) => x.id);
  let hijosCountByParent: Record<number, number> = {};

  if (ids.length) {
    const grouped = await prisma.subSeccion.groupBy({
      by: ["parentId"],
      where: {
        ...(whereAdmin as any),
        seccionId,
        parentId: { in: ids },
      } as any,
      _count: { _all: true },
    });

    for (const g of grouped) {
      if (g.parentId != null) hijosCountByParent[g.parentId] = g._count._all;
    }
  }

  const itemsWithCount = items.map((it) => ({
    ...it,
    hijosCount: hijosCountByParent[it.id] ?? 0,
  }));

  return NextResponse.json({ ok: true, items: itemsWithCount });
}


/**
 * POST /api/crm/subsecciones
 * body: { seccionId, nombre, colorHex?, imagenUrl?, parentId? }
 */
export async function POST(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantAdminId } = sessionInfo(auth.session);

  const body = await req.json().catch(() => ({}));
  const seccionId = parseId(body?.seccionId);
  const parentId = body?.parentId ? parseId(body.parentId) : null;

  const nombre = String(body?.nombre ?? "").trim();
  if (!seccionId) return NextResponse.json({ error: "seccionId requerido" }, { status: 400 });
  if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const colorHex = normalizeHex(body?.colorHex);
  const imagenUrl = body?.imagenUrl ? String(body.imagenUrl).trim() : null;

  // validar parent si viene
  if (parentId) {
    const parent = await prisma.subSeccion.findFirst({
      where: {
        id: parentId,
        seccionId,
        ...(tenantAdminId ? { OR: [{ adminId: tenantAdminId }, { adminId: null }] } : {}),
      } as any,
      select: { id: true },
    });
    if (!parent) return NextResponse.json({ error: "parentId no válido" }, { status: 400 });
  }

  // slug único por seccionId (en el ámbito del tenant)
  const base = slugify(nombre);
  let slug = base;
  let i = 2;

  const whereAdmin =
    tenantAdminId ? { OR: [{ adminId: tenantAdminId }, { adminId: null }] } : undefined;

  while (
    await prisma.subSeccion.findFirst({
      where: { ...(whereAdmin as any), seccionId, slug } as any,
      select: { id: true },
    })
  ) {
    slug = `${base}-${i++}`;
  }

  const created = await prisma.subSeccion.create({
    data: {
      nombre,
      slug,
      seccionId,
      parentId,
      activa: body?.activa ?? true,
      ...(tenantAdminId ? { adminId: tenantAdminId } : {}),
      ...(colorHex ? { colorHex } : {}),
      ...(imagenUrl ? { imagenUrl } : {}),
    } as any,
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id });
}

/**
 * PATCH /api/crm/subsecciones
 * body: { id, nombre?, colorHex?, imagenUrl?, activa? }
 */
export async function PATCH(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantAdminId } = sessionInfo(auth.session);

  const body = await req.json().catch(() => ({}));
  const id = parseId(body?.id);
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const data: any = {};
  if (body.nombre !== undefined) data.nombre = String(body.nombre).trim();
  if (body.activa !== undefined) data.activa = Boolean(body.activa);
  if (body.colorHex !== undefined) data.colorHex = normalizeHex(body.colorHex);
  if (body.imagenUrl !== undefined) data.imagenUrl = String(body.imagenUrl || "").trim() || null;

  try {
    if (tenantAdminId) {
      const updated = await prisma.subSeccion.updateMany({
        where: { id, OR: [{ adminId: tenantAdminId }, { adminId: null }] } as any,
        data: { ...data, adminId: tenantAdminId },
      });
      if (!updated.count) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      return NextResponse.json({ ok: true });
    }

    // SUPERADMIN (sin filtro)
    await prisma.subSeccion.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}

/**
 * DELETE /api/crm/subsecciones
 * - Borra rama completa (por cascade de hijos)
 */
export async function DELETE(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantAdminId } = sessionInfo(auth.session);

  const body = await req.json().catch(() => ({}));
  const id = parseId(body?.id);
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  try {
    if (tenantAdminId) {
      const del = await prisma.subSeccion.deleteMany({
        where: { id, OR: [{ adminId: tenantAdminId }, { adminId: null }] } as any,
      });
      if (!del.count) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      return NextResponse.json({ ok: true });
    }

    await prisma.subSeccion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar. Puede estar en uso (reglas/contrataciones)." },
      { status: 400 }
    );
  }
}
