// src/app/(crm)/api/agentes/route.ts
// src/app/(crm)/api/agentes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendAccessEmail } from "@/lib/sendAccessEmail";
import { getTenantContext, requireRoles } from "@/lib/tenant";

const normPct = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n;
};

// GET /api/agentes?take=6&skip=0&q=texto
export async function GET(req: Request) {
  try {
    const ctx = await getTenantContext(req as any);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    // Solo ADMIN y SUPERADMIN (y superadmin global/tenant)
    if (!requireRoles(ctx.role, ["ADMIN", "SUPERADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("take") ?? 6);
    const skip = Number(searchParams.get("skip") ?? 0);
    const q = searchParams.get("q")?.trim() ?? "";

    const where: Prisma.AgenteWhereInput = {};

    // 🔒 filtro por tenant si aplica
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;

    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q, mode: "insensitive" } },
      ];
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/agentes { nombre, email, telefono?, pctAgente? }
export async function POST(req: Request) {
  try {
    const ctx = await getTenantContext(req as any);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    if (!requireRoles(ctx.role, ["ADMIN", "SUPERADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Si SUPERADMIN está en global (tenantAdminId=null), obligamos a elegir adminId
    if (ctx.role === "SUPERADMIN" && !ctx.tenantAdminId) {
      return NextResponse.json(
        { error: "SUPERADMIN debe indicar ?adminId=... para crear agentes dentro de un tenant" },
        { status: 400 }
      );
    }

    const b = await req.json();
    const nombre = (b?.nombre ?? "").trim();
    const email = (b?.email ?? "").trim().toLowerCase();
    const telefono = (b?.telefono ?? "").trim();
    const pctAgente = normPct(b?.pctAgente);

    if (!nombre || !email) {
      return NextResponse.json({ error: "nombre y email son obligatorios" }, { status: 400 });
    }

    const adminId = ctx.tenantAdminId!; // aquí ya no es null

    // Evitar duplicados
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
        adminId, // ✅ tenant
        ...(pctAgente !== undefined ? { pctAgente } : {}),
        usuarios: {
          create: [
            {
              nombre,
              email,
              password: hashedPassword,
              rol: "AGENTE",
              adminId, // ✅ usuario agente también pertenece al tenant
              agenteId: undefined,
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
    console.error("Error creando agente:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
