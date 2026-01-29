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

export async function POST(req: Request) {
  const auth = await requireRole(["SUPERADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const seccionId = Number(body?.seccionId);
  const nombre = String(body?.nombre || "").trim();
  if (!seccionId || !nombre) {
    return NextResponse.json({ error: "seccionId y nombre son requeridos" }, { status: 400 });
  }

  const slug = body?.slug ? String(body.slug) : slugify(nombre);

  try {
    const created = await prisma.subSeccion.create({
      data: { seccionId, nombre, slug, activa: body?.activa ?? true },
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "No se pudo crear (slug duplicado?)" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireRole(["SUPERADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const data: any = {};
  if (body.nombre !== undefined) data.nombre = String(body.nombre).trim();
  if (body.slug !== undefined) data.slug = String(body.slug).trim();
  if (body.activa !== undefined) data.activa = Boolean(body.activa);

  try {
    const updated = await prisma.subSeccion.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
