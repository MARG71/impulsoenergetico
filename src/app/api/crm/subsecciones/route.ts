//src/app/api/crm/subsecciones/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole, sessionAdminId } from "@/lib/auth-server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
function parseId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function normalizeHex(v: string) {
  const s = (v || "").trim();
  if (!s) return null;
  const hex = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null;
}
function slugify(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function requireAdminish() {
  const session = await getSessionOrThrow();
  const role = sessionRole(session);
  if (role !== "SUPERADMIN" && role !== "ADMIN") return null;
  const adminId = sessionAdminId(session);
  return { session, role, adminId };
}

/**
 * GET /api/crm/subsecciones?seccionId=1&parentId=2
 * - parentId omitido => null (root)
 */
export async function GET(req: Request) {
  const auth = await requireAdminish();
  if (!auth) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const seccionId = parseId(searchParams.get("seccionId"));
  if (!seccionId) return jsonError("seccionId requerido", 400);

  const parentRaw = searchParams.get("parentId");
  const parentId = parentRaw ? parseId(parentRaw) : null;

  // ✅ Multi-tenant: asegura que la sección pertenece al admin
  const sec = await prisma.seccion.findFirst({
    where: { id: seccionId, adminId: auth.adminId },
    select: { id: true },
  });
  if (!sec) return jsonError("Sección no encontrada", 404);

  const subs = await prisma.subSeccion.findMany({
    where: { seccionId, parentId: parentId ?? null },
    orderBy: [{ nombre: "asc" }],
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

  return NextResponse.json({ ok: true, items: subs });
}

/**
 * POST { seccionId, parentId?, nombre, colorHex?, imagenUrl? }
 */
export async function POST(req: Request) {
  const auth = await requireAdminish();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const seccionId = parseId(body?.seccionId);
  const parentId = body?.parentId ? parseId(body.parentId) : null;
  const nombre = String(body?.nombre || "").trim();
  const colorHex = normalizeHex(String(body?.colorHex || ""));
  const imagenUrl = String(body?.imagenUrl || "").trim() || null;

  if (!seccionId) return jsonError("seccionId requerido");
  if (!nombre) return jsonError("nombre requerido");

  // sección del tenant
  const sec = await prisma.seccion.findFirst({
    where: { id: seccionId, adminId: auth.adminId },
    select: { id: true },
  });
  if (!sec) return jsonError("Sección no encontrada", 404);

  // si parentId viene, valida que exista y sea de esa sección
  if (parentId) {
    const parent = await prisma.subSeccion.findFirst({
      where: { id: parentId, seccionId },
      select: { id: true },
    });
    if (!parent) return jsonError("parentId inválido", 400);
  }

  const baseSlug = slugify(nombre);
  const slug = baseSlug ? `${baseSlug}-${Date.now().toString(36)}` : `sub-${Date.now().toString(36)}`;

  const created = await prisma.subSeccion.create({
    data: {
      adminId: auth.adminId,
      seccionId,
      parentId: parentId ?? null,
      nombre,
      slug,
      colorHex,
      imagenUrl,
    } as any,
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

  return NextResponse.json({ ok: true, item: created });
}

/**
 * PATCH { id, nombre?, colorHex?, imagenUrl?, activa? }
 */
export async function PATCH(req: Request) {
  const auth = await requireAdminish();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const id = parseId(body?.id);
  if (!id) return jsonError("id requerido");

  // asegura tenant
  const found = await prisma.subSeccion.findFirst({
    where: { id, adminId: auth.adminId },
    select: { id: true },
  });
  if (!found) return jsonError("No encontrada", 404);

  const data: any = {};
  if (body?.nombre !== undefined) data.nombre = String(body.nombre || "").trim();
  if (body?.colorHex !== undefined) data.colorHex = normalizeHex(String(body.colorHex || "")); // null si invalida/vacio
  if (body?.imagenUrl !== undefined) data.imagenUrl = String(body.imagenUrl || "").trim() || null;
  if (body?.activa !== undefined) data.activa = !!body.activa;

  // si cambias nombre, no toco slug para no romper históricos

  const updated = await prisma.subSeccion.update({
    where: { id },
    data,
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

  return NextResponse.json({ ok: true, item: updated });
}

/**
 * DELETE { id }
 */
export async function DELETE(req: Request) {
  const auth = await requireAdminish();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const id = parseId(body?.id);
  if (!id) return jsonError("id requerido");

  const found = await prisma.subSeccion.findFirst({
    where: { id, adminId: auth.adminId },
    select: { id: true },
  });
  if (!found) return jsonError("No encontrada", 404);

  try {
    await prisma.subSeccion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("No se pudo eliminar. Puede estar en uso. Prueba desactivar.", 400);
  }
}
