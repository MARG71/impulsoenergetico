// src/app/api/leads/route.ts
// src/app/api/leads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmailBienvenida } from "@/lib/email";

// 🔹 GET: devolver todos los leads (para el dashboard)
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: {
        creadoEn: "desc",
      },
      include: {
        agente: true,
        lugar: true,
      },
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

// Helper: genera una contraseña provisional sencilla (8 caracteres)
function generarPasswordProvisional() {
  return Math.random().toString(36).slice(-8);
}

// 🔹 POST: crear/actualizar lead + crear usuario (si no existe) + enviar email bienvenida SOLO la 1ª vez
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

    // Normalizamos email para evitar duplicados por mayúsculas
    const emailNormalizado = email.toLowerCase();

    const agenteIdNum =
      typeof agenteId === "string" ? Number(agenteId) : agenteId ?? undefined;
    const lugarIdNum =
      typeof lugarId === "string" ? Number(lugarId) : lugarId ?? undefined;

    // 1️⃣ Buscamos si ya existe un lead con ese email
    const existingLead = await prisma.lead.findFirst({
      where: { email: emailNormalizado },
    });

    let nuevoLead = false;
    let lead;

    if (existingLead) {
      // 🔁 Ya existía: actualizamos datos (para que en el CRM veas los últimos)
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          nombre,
          telefono,
          email: emailNormalizado,
          agenteId: agenteIdNum ?? existingLead.agenteId,
          lugarId: lugarIdNum ?? existingLead.lugarId,
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
        },
      });
      nuevoLead = true;
    }

    // 2️⃣ Buscamos si ya existe un usuario con ese email
    let usuario = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    let passwordProvisional: string | null = null;
    let nuevoUsuario = false;
    let emailEnviado = false;

    if (!usuario) {
      // 🆕 Creamos usuario y contraseña provisional SOLO la primera vez
      passwordProvisional = generarPasswordProvisional();
      const hash = await bcrypt.hash(passwordProvisional, 10);

      usuario = await prisma.usuario.create({
        data: {
          nombre: nombre || "Usuario Impulso",
          email: emailNormalizado,
          password: hash,
          rol: "LUGAR",
          ...(agenteIdNum
            ? {
                agente: {
                  connect: { id: agenteIdNum },
                },
              }
            : {}),
          ...(lugarIdNum
            ? {
                lugar: {
                  connect: { id: lugarIdNum },
                },
              }
            : {}),
        },
      });

      nuevoUsuario = true;

      // 3️⃣ Enviamos email de bienvenida con los datos de acceso
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
        // No rompemos la respuesta al cliente si el email falla
      }
    } else {
      // Si el usuario ya existe NO enviamos email (ya lo recibió en su día)
      emailEnviado = false;
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
