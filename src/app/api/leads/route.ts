// src/app/api/leads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmailBienvenida } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Helper: genera una contraseña provisional sencilla (8 caracteres)
function generarPasswordProvisional() {
  return Math.random().toString(36).slice(-8);
}

// ✅ Helper: resuelve el tenant (admin dueño) según rol
async function resolverTenantDesdeSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return { ok: false as const, status: 401, error: "No autenticado" };
  }

  const rol = ((session.user as any).rol ?? (session.user as any).role ?? null) as
    | "SUPERADMIN"
    | "ADMIN"
    | "AGENTE"
    | "LUGAR"
    | "CLIENTE"
    | null;

  const userId = (session.user as any).id ? Number((session.user as any).id) : null;
  const adminId = (session.user as any).adminId ? Number((session.user as any).adminId) : null;
  const agenteId = (session.user as any).agenteId ? Number((session.user as any).agenteId) : null;
  const lugarId = (session.user as any).lugarId ? Number((session.user as any).lugarId) : null;

  // tenantAdminId = admin dueño de los datos
  const tenantAdminId =
    rol === "SUPERADMIN" ? null : rol === "ADMIN" ? userId : adminId;

  return {
    ok: true as const,
    session,
    rol,
    userId,
    adminId,
    agenteId,
    lugarId,
    tenantAdminId,
  };
}

// 🔹 GET: devolver leads según rol y trazabilidad multi-tenant
export async function GET() {
  try {
    const auth = await resolverTenantDesdeSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { rol, tenantAdminId, agenteId, lugarId } = auth;

    const where: any = {};

    // ✅ SUPERADMIN ve todo
    if (rol !== "SUPERADMIN") {
      if (!tenantAdminId) {
        return NextResponse.json(
          { error: "No se pudo resolver el tenant (adminId)" },
          { status: 400 }
        );
      }
      where.adminId = tenantAdminId;
    }

    // ✅ AGENTE: solo sus leads
    if (rol === "AGENTE") where.agenteId = agenteId ?? -1;

    // ✅ LUGAR: solo sus leads
    if (rol === "LUGAR") where.lugarId = lugarId ?? -1;

    // (Opcional) si CLIENTE no debe ver nada aquí:
    if (rol === "CLIENTE") {
      return NextResponse.json({ leads: [] });
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      include: { agente: true, lugar: true },
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("[LEADS][GET] Error al obtener leads:", error);
    return NextResponse.json(
      { error: "Error al obtener los leads" },
      { status: 500 }
    );
  }
}

// 🔹 POST: crear/actualizar lead + crear usuario (si no existe) + enviar email bienvenida SOLO la 1ª vez
// ✅ Este POST se usa desde el registro público (QR), así que NO dependemos de session.
// ✅ Debemos resolver adminId desde lugar/agente (trazabilidad).
export async function POST(req: Request) {
  try {
    const body = await req.json();

    let { nombre, email, telefono, agenteId, lugarId } = body as {
      nombre?: string;
      email?: string;
      telefono?: string;
      agenteId?: string | number | null;
      lugarId?: string | number | null;
    };

    nombre = (nombre || "").trim();
    email = (email || "").trim();
    telefono = (telefono || "").trim();

    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { error: "Nombre, email y teléfono son obligatorios." },
        { status: 400 }
      );
    }

    const emailNormalizado = email.toLowerCase();

    const agenteIdNum =
      typeof agenteId === "string" ? Number(agenteId) : agenteId ?? undefined;
    const lugarIdNum =
      typeof lugarId === "string" ? Number(lugarId) : lugarId ?? undefined;

    // ✅ Resolver adminId (tenant) desde Lugar o Agente (prioridad Lugar)
    let tenantAdminId: number | null = null;

    if (lugarIdNum) {
      const lugar = await prisma.lugar.findUnique({
        where: { id: lugarIdNum },
        select: { adminId: true, agenteId: true },
      });
      tenantAdminId = (lugar?.adminId ?? null) as any;

      // si no viene agenteId pero el lugar lo tiene, lo completamos
      if (!agenteIdNum && lugar?.agenteId) {
        agenteIdNum = lugar.agenteId;
      }
    }

    if (!tenantAdminId && agenteIdNum) {
      const agente = await prisma.agente.findUnique({
        where: { id: agenteIdNum },
        select: { adminId: true },
      });
      tenantAdminId = (agente?.adminId ?? null) as any;
    }

    // Si no podemos resolver el adminId, NO creamos lead huérfano
    if (!tenantAdminId) {
      return NextResponse.json(
        { error: "No se pudo resolver el admin (tenant) para este registro." },
        { status: 400 }
      );
    }

    // 1️⃣ Buscamos si ya existe un lead con ese email *dentro del tenant*
    const existingLead = await prisma.lead.findFirst({
      where: { email: emailNormalizado, adminId: tenantAdminId },
    });

    let nuevoLead = false;
    let lead;

    if (existingLead) {
      // 🔁 Ya existía: actualizamos datos
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          nombre,
          telefono,
          email: emailNormalizado,
          agenteId: agenteIdNum ?? existingLead.agenteId,
          lugarId: lugarIdNum ?? existingLead.lugarId,
          adminId: tenantAdminId,
        },
      });
    } else {
      // 🆕 No existía: creamos lead nuevo
      lead = await prisma.lead.create({
        data: {
          nombre,
          email: emailNormalizado,
          telefono,
          estado: "pendiente",
          agenteId: agenteIdNum,
          lugarId: lugarIdNum,
          adminId: tenantAdminId,
        },
      });
      nuevoLead = true;
    }

    // 2️⃣ Buscamos si ya existe un usuario con ese email (en tu tabla global)
    // ⚠️ Recomendación: si quieres multi-tenant "puro", habría que permitir email duplicado por tenant.
    // Por ahora respetamos tu sistema actual.
    let usuario = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    let passwordProvisional: string | null = null;
    let nuevoUsuario = false;
    let emailEnviado = false;

    if (!usuario) {
      passwordProvisional = generarPasswordProvisional();
      const hash = await bcrypt.hash(passwordProvisional, 10);

      usuario = await prisma.usuario.create({
        data: {
          nombre: nombre || "Usuario Impulso",
          email: emailNormalizado,
          password: hash,
          rol: "LUGAR",
          adminId: tenantAdminId, // ✅ clave para trazabilidad
          ...(agenteIdNum ? { agente: { connect: { id: agenteIdNum } } } : {}),
          ...(lugarIdNum ? { lugar: { connect: { id: lugarIdNum } } } : {}),
        },
      });

      nuevoUsuario = true;

      // 3️⃣ Email bienvenida solo 1ª vez
      try {
        const baseUrl =
          process.env.NEXTAUTH_URL ||
          process.env.NEXT_PUBLIC_APP_URL ||
          "https://impulsoenergetico.es";

        const linkAcceso = `${baseUrl.replace(/\/$/, "")}/login`;

        await enviarEmailBienvenida({
          nombre,
          email: emailNormalizado,
          passwordProvisional,
          linkAcceso,
        });

        emailEnviado = true;
      } catch (err) {
        console.error("[LEADS][POST] Error enviando email de bienvenida:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      lead,
      nuevoLead,
      nuevoUsuario,
      emailEnviado,
    });
  } catch (error) {
    console.error("[LEADS][POST] Error al crear/actualizar lead:", error);
    return NextResponse.json(
      { error: "Error al registrar el lead" },
      { status: 500 }
    );
  }
}
