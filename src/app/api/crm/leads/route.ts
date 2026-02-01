// src/app/api/crm/leads/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function parseId(v: any): number | null {
  const n = Number(v);
  if (!n || Number.isNaN(n)) return null;
  return n;
}

function getRole(user: any): Role | null {
  return (user?.rol ?? user?.role ?? null) as Role | null;
}

function tenantWhere(sessionUser: any) {
  const role = getRole(sessionUser);

  if (role === "SUPERADMIN") return {};

  if (role === "ADMIN") {
    return { adminId: Number(sessionUser.id) };
  }

  if (role === "AGENTE") {
    return {
      adminId: Number(sessionUser.adminId),
      agenteId: Number(sessionUser.agenteId),
    };
  }

  if (role === "LUGAR") {
    return {
      adminId: Number(sessionUser.adminId),
      lugarId: Number(sessionUser.lugarId),
    };
  }

  return { id: -1 };
}

async function resolverAdminIdDesdeLugarAgente(args: {
  lugarId: number | null;
  agenteId: number | null;
}): Promise<number | null> {
  const { lugarId, agenteId } = args;

  if (lugarId) {
    const lugar = await prisma.lugar.findUnique({
      where: { id: lugarId },
      select: { adminId: true, agenteId: true },
    });
    if (lugar?.adminId) return lugar.adminId;
  }

  if (agenteId) {
    const agente = await prisma.agente.findUnique({
      where: { id: agenteId },
      select: { adminId: true },
    });
    if (agente?.adminId) return agente.adminId;
  }

  return null;
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

    const role = getRole(session.user);

    if (!(role === "SUPERADMIN" || role === "ADMIN" || role === "AGENTE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const url = new URL(req.url);

    const body = await req.json().catch(() => ({}));
    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "").trim();
    const telefono = String(body.telefono || "").trim();

    if (!nombre) {
      return NextResponse.json({ error: "Nombre obligatorio" }, { status: 400 });
    }

    // Email/teléfono en tu schema son requeridos => guardamos "" si no vienen
    const emailSafe = email || "";
    const telSafe = telefono || "";

    const lugarId = parseId(body.lugarId);
    const agenteIdBody = parseId(body.agenteId);

    // Si es AGENTE y no pasan agenteId, usamos el de sesión
    const agenteId =
      agenteIdBody ?? (role === "AGENTE" ? parseId((session.user as any).agenteId) : null);

    // ✅ Resolver adminId SIEMPRE
    let adminId: number | null = null;

    if (role === "ADMIN") {
      adminId = parseId((session.user as any).id);
    } else if (role === "AGENTE") {
      adminId = parseId((session.user as any).adminId);
    } else if (role === "SUPERADMIN") {
      // tenant mode por query o body
      const adminIdFromQuery = parseId(url.searchParams.get("adminId"));
      const adminIdFromBody = parseId(body.adminId ?? body.tenantAdminId);

      adminId = adminIdFromBody ?? adminIdFromQuery ?? null;

      // si no viene adminId explícito, intentamos deducirlo desde lugar/agente
      if (!adminId) {
        adminId = await resolverAdminIdDesdeLugarAgente({ lugarId, agenteId });
      }
    }

    if (!adminId) {
      return NextResponse.json(
        {
          error:
            "No se pudo resolver adminId. Si eres SUPERADMIN, pasa ?adminId=XX o incluye adminId en el body, o indica lugarId/agenteId válidos.",
        },
        { status: 400 }
      );
    }

    // ✅ Seguridad mínima: si NO eres SUPERADMIN, evita mezclar tenant con lugar/agente ajenos
    if (role !== "SUPERADMIN") {
      // Validar lugar si viene
      if (lugarId) {
        const lugar = await prisma.lugar.findUnique({
          where: { id: lugarId },
          select: { adminId: true },
        });
        if (!lugar || lugar.adminId !== adminId) {
          return NextResponse.json(
            { error: "lugarId no pertenece a tu tenant" },
            { status: 403 }
          );
        }
      }

      // Validar agente si viene
      if (agenteId) {
        const agente = await prisma.agente.findUnique({
          where: { id: agenteId },
          select: { adminId: true },
        });
        if (!agente || agente.adminId !== adminId) {
          return NextResponse.json(
            { error: "agenteId no pertenece a tu tenant" },
            { status: 403 }
          );
        }
      }
    }

    const lead = await prisma.lead.create({
      data: {
        nombre,
        email: emailSafe,
        telefono: telSafe,
        estado: String(body.estado || "pendiente"),
        notas: body.notas ? String(body.notas) : null,
        proximaAccion: body.proximaAccion ? String(body.proximaAccion) : null,
        proximaAccionEn: body.proximaAccionEn ? new Date(body.proximaAccionEn) : null,
        agenteId: agenteId ?? null,
        lugarId: lugarId ?? null,
        adminId, // ✅ NUNCA null
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
