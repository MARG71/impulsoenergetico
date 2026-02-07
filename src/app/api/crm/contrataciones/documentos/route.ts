// src/app/api/crm/contrataciones/documentos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function POST(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN", "AGENTE"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const contratacionId = Number(body?.contratacionId);
  const url = String(body?.url || "").trim();
  const tipo = (body?.tipo || "OTRO") as any;
  const nombre = body?.nombre ? String(body.nombre) : null;

  if (!contratacionId || !url) {
    return NextResponse.json({ error: "contratacionId y url requeridos" }, { status: 400 });
  }

  const doc = await prisma.contratacionDocumento.create({
    data: { contratacionId, url, tipo, nombre },
  });

  return NextResponse.json(doc);
}

export async function DELETE(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  await prisma.contratacionDocumento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
