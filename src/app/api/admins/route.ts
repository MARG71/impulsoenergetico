// src/app/api/admins/route.ts
// src/app/api/admins/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { hash } from "bcryptjs";
import { sendAccessEmail } from "@/lib/sendAccessEmail";

/**
 * LISTAR ADMINS (solo SUPERADMIN)
 */
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!ctx.isSuperadmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN puede listar administradores" },
      { status: 403 }
    );
  }

  // Los "tenants" son usuarios con rol ADMIN y adminId = null (raíz del tenant)
  const admins = await prisma.usuario.findMany({
    where: {
      rol: "ADMIN",
      adminId: null,
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      // métricas básicas del tenant
      _count: {
        select: {
          agentesGestionados: true,
          lugaresGestionados: true,
          leadsGestionados: true,
          comparativasGestionadas: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(admins);
}

/**
 * CREAR NUEVO ADMIN / TENANT (solo SUPERADMIN)
 * - Crea un usuario con rol ADMIN
 * - Genera contraseña temporal
 * - Envía email con las credenciales
 */
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!ctx.isSuperadmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN puede crear administradores" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { nombre, email } = body || {};

  if (!nombre || !email) {
    return NextResponse.json(
      { error: "Nombre y email son obligatorios" },
      { status: 400 }
    );
  }

  // Contraseña temporal
  const plainPassword = Math.random().toString(36).slice(-10);
  const passwordHash = await hash(plainPassword, 10);

  try {
    const admin = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: passwordHash,
        rol: "ADMIN",
        adminId: null, // raíz de tenant
      },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });

    // Enviar email de acceso (no bloquea si falla)
    sendAccessEmail({
      to: email,
      nombre,
      rol: "ADMIN",
      email,
      password: plainPassword,
    }).catch((e) =>
      console.error("Error enviando email de acceso a admin:", e)
    );

    return NextResponse.json(admin, { status: 201 });
  } catch (e: any) {
    console.error(e);
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error creando admin." },
      { status: 500 }
    );
  }
}
