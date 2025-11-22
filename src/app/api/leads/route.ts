// src/app/api/leads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmail } from "@/lib/mailer";
import bcrypt from "bcryptjs";

// Genera una contraseña provisional aleatoria
function generarPasswordProvisional(longitud: number = 10): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";
  let pass = "";
  for (let i = 0; i < longitud; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// GET -> listar leads (ya lo usas en el CRM)
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { creadoEn: "desc" },
      include: {
        agente: true,
        lugar: true,
      },
    });

    return NextResponse.json({ leads }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo leads:", error);
    return NextResponse.json(
      { error: "Error al obtener los leads" },
      { status: 500 }
    );
  }
}

// POST -> crear lead + (si no existe) crear Usuario + enviar email bienvenida
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, email, telefono, agenteId, lugarId } = body;

    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { error: "Nombre, email y teléfono son obligatorios" },
        { status: 400 }
      );
    }

    // 1) Crear el lead
    const lead = await prisma.lead.create({
      data: {
        nombre,
        email,
        telefono,
        agenteId: agenteId ? Number(agenteId) : null,
        lugarId: lugarId ? Number(lugarId) : null,
      },
    });

    // 2) Crear Usuario + enviar email SOLO si no existe ese email en Usuario
    try {
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email },
      });

      if (!usuarioExistente) {
        // Generamos contraseña provisional
        const passwordPlano = generarPasswordProvisional();
        const passwordHash = await bcrypt.hash(passwordPlano, 10);

        // Creamos el usuario en la tabla Usuario
        const usuario = await prisma.usuario.create({
          data: {
            nombre,
            email,
            password: passwordHash,
            rol: "LUGAR", // de momento usamos rol LUGAR para clientes
            agenteId: agenteId ? Number(agenteId) : null,
            lugarId: lugarId ? Number(lugarId) : null,
          },
        });

        console.log("Usuario cliente creado desde lead:", usuario.id);

        // URL de login para el email
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXTAUTH_URL ||
          "https://impulsoenergetico.es";

        const loginUrl = `${baseUrl.replace(/\/$/, "")}/login`;

        // Enviar email de bienvenida
        await enviarEmail({
          to: email,
          subject:
            "Bienvenido a Impulso Energético – Acceso a tu área de cliente",
          html: `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height:1.5;">
            <h1 style="color:#16a34a; font-size:22px;">Hola ${
              nombre || ""
            },</h1>
            <p>Gracias por confiar en <strong>Impulso Energético</strong>.</p>
            <p>
              Hemos creado tu acceso personal para que puedas seguir tus 
              <strong>comparativas</strong>, <strong>ofertas</strong> y 
              <strong>ahorros</strong>.
            </p>
            <p>
              Estos son tus datos de acceso provisional:
            </p>
            <p style="background:#0f172a; color:#e5e7eb; padding:12px 16px; border-radius:12px;">
              <strong>Usuario:</strong> ${email}<br/>
              <strong>Contraseña provisional:</strong> ${passwordPlano}
            </p>
            <p>
              Puedes acceder desde este enlace:<br/>
              <a href="${loginUrl}" style="color:#16a34a; font-weight:bold;">
                ${loginUrl}
              </a>
            </p>
            <p style="margin-top:16px;">
              Te recomendamos cambiar esta contraseña la primera vez que entres
              en tu área de cliente.
            </p>
            <p style="margin-top:24px;font-size:12px;color:#64748b;">
              Si tú no has solicitado este registro, puedes ignorar este mensaje.
            </p>
          </div>
        `,
          text: `
Hola ${nombre || ""},

Gracias por confiar en Impulso Energético.

Hemos creado tu acceso personal para que puedas seguir tus comparativas, ofertas y ahorros.

Usuario: ${email}
Contraseña provisional: ${passwordPlano}

Puedes acceder desde:
${loginUrl}

Te recomendamos cambiar esta contraseña la primera vez que entres en tu área de cliente.

Si tú no has solicitado este registro, puedes ignorar este mensaje.
          `.trim(),
        });
      } else {
        // Ya hay usuario con ese email -> opcionalmente podríamos enviar otro tipo de email
        console.log(
          "Email ya registrado como usuario, no se crea usuario nuevo:",
          email
        );
      }
    } catch (error) {
      console.error("Error creando usuario/enviando email desde lead:", error);
      // Importante: NO rompemos la creación del lead aunque falle el email o usuario
    }

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/leads:", error);
    return NextResponse.json(
      { error: "Error al crear el lead" },
      { status: 500 }
    );
  }
}
