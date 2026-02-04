//src/app/api/crm/subsecciones/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function sessionInfo(session: any) {
  const role = String(session?.user?.role ?? session?.user?.rol ?? "");
  const userId = Number(session?.user?.id ?? 0);
  const adminId = Number(session?.user?.adminId ?? 0);

  const tenantAdminId =
    role === "ADMIN" || role === "SUPERADMIN" ? (userId || null) : (adminId || null);

  return { role, tenantAdminId };
}

function normalizeHex(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const hex = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null;
}

export async function POST(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantAdminId } = sessionInfo(auth.session);

  const body = await req.json();
  const seccionId = Number(body?.seccionId);
  const nombre = String(body?.nombre || "").trim();
  if (!seccionId || !nombre) {
    return NextResponse.json({ error: "seccionId y nombre son requeridos" }, { status: 400 });
  }

  // ✅ sección válida si es tuya o legacy (null)
  if (tenantAdminId) {
    const sec = await prisma.seccion.findFirst({
      where: { id: seccionId, OR: [{ adminId: tenantAdminId }, { adminId: null }] } as any,
      select: { id: true },
    });
    if (!sec) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const slug = body?.slug ? String(body.slug) : slugify(nombre);
  const colorHex = normalizeHex(body?.colorHex);
  const imagenUrl = body?.imagenUrl ? String(body.imagenUrl).trim() : null;

  try {
    const created = await prisma.subSeccion.create({
      data: {
        seccionId,
        nombre,
        slug,
        activa: body?.activa ?? true,
        ...(tenantAdminId ? { adminId: tenantAdminId } : {}),
        ...(colorHex ? { colorHex } : {}),
        ...(imagenUrl ? { imagenUrl } : {}),
      } as any,
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "No se pudo crear (slug duplicado?)" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantAdminId } = sessionInfo(auth.session);

  const body = await req.json();
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const data: any = {};
  if (body.nombre !== undefined) data.nombre = String(body.nombre).trim();
  if (body.slug !== undefined) data.slug = String(body.slug).trim();
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

      const fresh = await prisma.subSeccion.findUnique({ where: { id } });
      return NextResponse.json(fresh);
    }

    const updated = await prisma.subSeccion.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
