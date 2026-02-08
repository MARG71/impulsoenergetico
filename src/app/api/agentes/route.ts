//src/app/api/agentes/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { hash } from "bcryptjs";
import { sendAccessEmail } from "@/lib/sendAccessEmail";

type Nivel = "C1" | "C2" | "C3" | "ESPECIAL";

function normalizeNivel(v: any): Nivel {
  const s = String(v ?? "C1").toUpperCase();
  if (s === "C2" || s === "C3" || s === "ESPECIAL") return s;
  return "C1";
}

// =======================
// GET /api/agentes
// =======================
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { isSuperadmin, tenantAdminId } = ctx;
  const url = new URL(req.url);

  const includeOcultos = url.searchParams.get("includeOcultos") === "1";

  // adminId por query (solo útil para SUPERADMIN global)
  const adminIdQuery = url.searchParams.get("adminId");
  const adminIdFromQuery = adminIdQuery ? Number(adminIdQuery) : null;

  const where: any = {};

  if (!isSuperadmin) {
    // ADMIN: solo su tenant
    if (!tenantAdminId) {
      return NextResponse.json(
        { error: "Config de tenant inválida" },
        { status: 400 }
      );
    }
    where.adminId = tenantAdminId;
  } else {
    // SUPERADMIN
    if (tenantAdminId) {
      // modo tenant
      where.adminId = tenantAdminId;
    } else {
      // modo global
      if (adminIdFromQuery && Number.isFinite(adminIdFromQuery)) {
        where.adminId = adminIdFromQuery;
      }
    }
  }

  if (!includeOcultos) {
    where.ocultoParaAdmin = false;
  }

  const agentes = await prisma.agente.findMany({
    where,
    include: {
      _count: { select: { lugares: true, leads: true, comparativas: true } },
      admin: { select: { id: true, nombre: true, email: true } },
    },
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(agentes);
}

// =======================
// POST /api/agentes
// =======================
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo SUPERADMIN o ADMIN
  if (!ctx.isSuperadmin && !ctx.isAdmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN o ADMIN pueden crear agentes" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const {
    nombre,
    email,
    telefono,
    pctAgente,
    ocultoParaAdmin,
    adminSeleccionado,
    nivelComisionDefault,
  } = body || {};

  if (!nombre || !email) {
    return NextResponse.json(
      { error: "Nombre y email son obligatorios" },
      { status: 400 }
    );
  }

  // ─────────────────────────────
  // Resolver adminId dueño del agente
  // ─────────────────────────────
  let adminId: number | null = null;

  if (ctx.isSuperadmin) {
    if (adminSeleccionado) {
      const parsed = Number(adminSeleccionado);
      if (Number.isFinite(parsed)) adminId = parsed;
    }

    if (!adminId && ctx.tenantAdminId) {
      adminId = ctx.tenantAdminId;
    }

    if (!adminId) {
      return NextResponse.json(
        {
          error:
            "Debes seleccionar un administrador para este agente o entrar en un tenant (/dashboard?adminId=XXX).",
        },
        { status: 400 }
      );
    }
  } else if (ctx.isAdmin) {
    if (!ctx.tenantAdminId) {
      return NextResponse.json(
        { error: "Config de tenant inválida (falta adminId)" },
        { status: 400 }
      );
    }
    adminId = ctx.tenantAdminId;
  }

  if (!adminId) {
    return NextResponse.json(
      { error: "No se ha podido determinar el administrador del agente." },
      { status: 400 }
    );
  }

  const nivel = normalizeNivel(nivelComisionDefault);

  // Contraseña temporal
  const plainPassword = Math.random().toString(36).slice(-10);
  const passwordHash = await hash(plainPassword, 10);

  try {
    // 1) Crear usuario (rol AGENTE)
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: passwordHash,
        rol: "AGENTE",
        adminId,
        nivelComisionDefault: nivel,
      },
    });

    // 2) Crear agente vinculado (y guardar el nivel EN AGENTE)
    const agente = await prisma.agente.create({
      data: {
        nombre,
        email,
        telefono: telefono || null,
        pctAgente: pctAgente ?? null,
        ocultoParaAdmin: Boolean(ocultoParaAdmin) || false,
        adminId,
        nivelComisionDefault: nivel,
        usuarios: { connect: { id: usuario.id } },
      },
      include: {
        _count: { select: { lugares: true, leads: true, comparativas: true } },
        admin: { select: { id: true, nombre: true, email: true } },
      },
    });

    // 3) Enviar email (no bloquea)
    sendAccessEmail({
      to: email,
      nombre,
      rol: "AGENTE",
      email,
      password: plainPassword,
    }).catch((e) =>
      console.error("Error enviando email de acceso a agente:", e)
    );

    return NextResponse.json(agente, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      {
        error:
          "Error creando agente. Revisa que el email no esté ya en uso como usuario.",
      },
      { status: 500 }
    );
  }
}
