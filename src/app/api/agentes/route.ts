import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { hash } from "bcryptjs";
import { sendAccessEmail } from "@/lib/sendAccessEmail";

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { isSuperadmin, tenantAdminId } = ctx;
  const url = new URL(req.url);
  const includeOcultos = url.searchParams.get("includeOcultos") === "1";

  const where: any = {};

  if (!isSuperadmin) {
    // ADMIN (y otros roles si entrasen): solo su tenant
    if (!tenantAdminId) {
      return NextResponse.json(
        { error: "Config de tenant inválida" },
        { status: 400 }
      );
    }
    where.adminId = tenantAdminId;
  } else if (tenantAdminId) {
    // SUPERADMIN en modo tenant
    where.adminId = tenantAdminId;
  }

  if (!includeOcultos) {
    where.ocultoParaAdmin = false;
  }

  const agentes = await prisma.agente.findMany({
    where,
    include: {
      _count: {
        select: {
          lugares: true,
          leads: true,
          comparativas: true,
        },
      },
    },
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(agentes);
}

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
  const { nombre, email, telefono, pctAgente } = body || {};

  if (!nombre || !email) {
    return NextResponse.json(
      { error: "Nombre y email son obligatorios" },
      { status: 400 }
    );
  }

  const adminId = ctx.tenantAdminId;
  if (!adminId) {
    // SUPERADMIN debe estar en modo tenant para crear agentes de ese admin
    return NextResponse.json(
      {
        error:
          "Falta adminId. Entra en el dashboard de un tenant (/dashboard?adminId=XXX) para crear sus agentes.",
      },
      { status: 400 }
    );
  }

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
        adminId, // tenant dueño
      },
    });

    // 2) Crear agente vinculado
    const agente = await prisma.agente.create({
      data: {
        nombre,
        email,
        telefono: telefono || null,
        pctAgente: pctAgente ?? null,
        adminId,
        usuarios: { connect: { id: usuario.id } },
      },
    });

    // 3) Enviar email de acceso (no bloqueamos si falla)
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
