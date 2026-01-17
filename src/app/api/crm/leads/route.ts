// src/app/api/crm/leads/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function tenantWhere(sessionUser: any) {
  const role = sessionUser?.role as Role | undefined;

  // SUPERADMIN ve todo
  if (role === "SUPERADMIN") return {};

  // ADMIN ve lo suyo: adminId = su propio id
  if (role === "ADMIN") return { adminId: Number(sessionUser.id) };

  // AGENTE ve lo suyo
  if (role === "AGENTE") {
    return {
      adminId: Number(sessionUser.adminId),
      agenteId: Number(sessionUser.agenteId),
    };
  }

  // LUGAR ve lo suyo
  if (role === "LUGAR") {
    return {
      adminId: Number(sessionUser.adminId),
      lugarId: Number(sessionUser.lugarId),
    };
  }

  // CLIENTE (si lo usas) -> sin acceso por defecto
  return { id: -1 };
}

// GET /api/crm/leads?q=...&estado=...&take=...&skip=...
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const whereTenant = tenantWhere(session.user);

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const estado = (searchParams.get("estado") || "").trim().toLowerCase();
    const take = Math.min(Number(searchParams.get("take") || 200), 500);
    const skip = Math.max(Number(searchParams.get("skip") || 0), 0);

    const where: any = { ...whereTenant };

    if (estado && estado !== "todos") {
      where.estado = estado;
    }

    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q, mode: "insensitive" } },
        { estado: { contains: q, mode: "insensitive" } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: [{ proximaAccionEn: "asc" }, { creadoEn: "desc" }],
      include: {
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
      },
      take,
      skip,
    });

    const total = await prisma.lead.count({ where });

    return NextResponse.json({ items: leads, total, take, skip });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/crm/leads  (crear lead manual desde CRM)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const role = (session.user as any).role as Role | undefined;

    // Permitimos crear lead manual a SUPERADMIN / ADMIN / AGENTE
    if (!(role === "SUPERADMIN" || role === "ADMIN" || role === "AGENTE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "").trim();
    const telefono = String(body.telefono || "").trim();

    if (!nombre) {
      return NextResponse.json({ error: "Nombre obligatorio" }, { status: 400 });
    }

    // En tu schema Lead.email y Lead.telefono son String (no opcionales)
    // => guardamos "" si no vienen (pero lo ideal es pedir al menos uno).
    const emailSafe = email || "";
    const telSafe = telefono || "";

    // Resolver adminId:
    // - SUPERADMIN puede crear con adminId explícito si quiere, si no, null
    // - ADMIN: adminId = su id
    // - AGENTE: adminId = su adminId
    let adminId: number | null = null;

    if (role === "SUPERADMIN") {
      adminId = body.adminId ? Number(body.adminId) : null;
    } else if (role === "ADMIN") {
      adminId = Number((session.user as any).id);
    } else if (role === "AGENTE") {
      adminId = Number((session.user as any).adminId);
    }

    const agenteId = body.agenteId ? Number(body.agenteId) : (session.user as any).agenteId ?? null;
    const lugarId = body.lugarId ? Number(body.lugarId) : null;

    const lead = await prisma.lead.create({
      data: {
        nombre,
        email: emailSafe,
        telefono: telSafe,
        estado: String(body.estado || "pendiente"),
        notas: body.notas ? String(body.notas) : null,
        proximaAccion: body.proximaAccion ? String(body.proximaAccion) : null,
        proximaAccionEn: body.proximaAccionEn ? new Date(body.proximaAccionEn) : null,
        agenteId: agenteId ? Number(agenteId) : null,
        lugarId: lugarId ? Number(lugarId) : null,
        adminId,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
