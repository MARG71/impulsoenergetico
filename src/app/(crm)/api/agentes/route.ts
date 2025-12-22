// src/app/(crm)/api/agentes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendAccessEmail } from "@/lib/sendAccessEmail";
import { getTenantContext } from "@/lib/tenant";

export const runtime = "nodejs";

const normPct = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n; // 15 -> 0.15
};

// GET /api/agentes?take=6&skip=0&q=texto&adminId=1 (solo SUPERADMIN)
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { role, tenantAdminId, isSuperadmin, isAdmin, isAgente } = ctx;

    // ✅ Permisos:
    // SUPERADMIN: global o tenant
    // ADMIN: solo su tenant
    // AGENTE: puede listar SOLO su propio agente (para no romper su panel)
    if (!(isSuperadmin || isAdmin || isAgente)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const take = Number(searchParams.get("take") ?? 50);
    const skip = Number(searchParams.get("skip") ?? 0);
    const q = searchParams.get("q")?.trim() ?? "";

    let where: Prisma.AgenteWhereInput = {};

    // ✅ Tenant filter (si tenantAdminId existe)
    if (tenantAdminId) where.adminId = tenantAdminId;

    // ✅ Si es AGENTE, solo su agenteId (y dentro de su tenant)
    if (isAgente) {
      if (!ctx.agenteId) {
        return NextResponse.json({ error: "AGENTE sin agenteId asociado" }, { status: 400 });
      }
      where.id = ctx.agenteId;
    }

    if (q) {
      where = {
        ...where,
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { telefono: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const items = await prisma.agente.findMany({
      where,
      orderBy: { id: "desc" },
      take,
      skip,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        pctAgente: true,
        adminId: true,
      },
    });

    return NextResponse.json(items);
  } catch (e: any) {
    console.error("[API][agentes][GET]", e);
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}

// POST /api/agentes  (ADMIN o SUPERADMIN EN MODO TENANT)
export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { role, isSuperadmin, isAdmin, tenantAdminId, userId } = ctx;

    // ✅ Reglas:
    // - ADMIN: crea en su tenant (tenantAdminId = userId)
    // - SUPERADMIN: solo puede crear si está en modo tenant (?adminId=...)
    if (!(isAdmin || isSuperadmin)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (isSuperadmin && !tenantAdminId) {
      return NextResponse.json(
        { error: "SUPERADMIN debe indicar ?adminId=... para crear dentro de un tenant" },
        { status: 400 }
      );
    }

    const targetAdminId = isAdmin ? userId! : tenantAdminId!;

    const b = await req.json();
    const nombre = (b?.nombre ?? "").trim();
    const email = (b?.email ?? "").trim().toLowerCase();
    const telefono = (b?.telefono ?? "").trim();
    const pctAgente = normPct(b?.pctAgente);

    if (!nombre || !email) {
      return NextResponse.json({ error: "nombre y email son obligatorios" }, { status: 400 });
    }

    const [agenteDup, usuarioDup] = await Promise.all([
      prisma.agente.findUnique({ where: { email } }),
      prisma.usuario.findUnique({ where: { email } }),
    ]);

    if (agenteDup || usuarioDup) {
      return NextResponse.json({ error: "Ya existe un agente o usuario con ese email" }, { status: 409 });
    }

    const plainPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const agente = await prisma.agente.create({
      data: {
        nombre,
        email,
        telefono,
        adminId: targetAdminId, // ✅ TENANT
        ...(pctAgente !== undefined ? { pctAgente } : {}),
        usuarios: {
          create: [
            {
              nombre,
              email,
              password: hashedPassword,
              rol: "AGENTE",
              adminId: targetAdminId, // ✅ TENANT también en Usuario
            },
          ],
        },
      },
      include: { usuarios: true },
    });

    const usuario = agente.usuarios[0];

    await sendAccessEmail({
      to: email,
      nombre,
      rol: "AGENTE",
      email,
      password: plainPassword,
    });

    return NextResponse.json(
      {
        agente: {
          id: agente.id,
          nombre: agente.nombre,
          email: agente.email,
          telefono: agente.telefono,
          pctAgente: agente.pctAgente,
          adminId: agente.adminId,
        },
        usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol, adminId: usuario.adminId },
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("[API][agentes][POST]", e);
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
  }
}
