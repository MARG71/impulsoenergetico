// src/app/api/crm/clientes/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function str(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

export async function GET(req: NextRequest) {
  const t = await getTenantContext(req);
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

  if (!["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"].includes(t.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const where: any = {};

  // ✅ multi-tenant: si hay tenantAdminId filtramos
  if (t.tenantAdminId) where.adminId = t.tenantAdminId;

  // ✅ buscador (nombre/email/telefono)
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { telefono: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await prisma.cliente.findMany({
    where,
    // ✅ tu schema NO tiene creadoEn -> ordenamos por id
    orderBy: { id: "desc" },
    take: 200,
    include: {
      contratos: { take: 20, orderBy: { fechaAlta: "desc" } },
      comparativas: { take: 20, orderBy: { fecha: "desc" } },
    },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const t = await getTenantContext(req);
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

  // ✅ crear clientes solo SUPERADMIN/ADMIN por ahora
  if (!["SUPERADMIN", "ADMIN"].includes(t.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  const nombre = str(body.nombre);
  const direccion = str(body.direccion);
  const email = str(body.email) || null;
  const telefono = str(body.telefono) || null;

  if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });

  const created = await prisma.cliente.create({
    data: {
      nombre,
      direccion: direccion || "", // tu schema lo requiere
      email,
      telefono,
      // ✅ multi-tenant: asignamos adminId si estamos en tenant (admin o superadmin con adminId)
      adminId: t.tenantAdminId ?? null,
    },
  });

  return NextResponse.json({ ok: true, cliente: created }, { status: 201 });
}
