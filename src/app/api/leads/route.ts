// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmail } from "@/lib/email";

// 🔹 GET: devolver todos los leads (para el dashboard)
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { creadoEn: "desc" },
      include: {
        agente: true,
        lugar: true,
      },
    });

    // 👇 Devolvemos SOLO el array, para que funcione tanto si el front hace
    // data.leads || data || []  como si solo usa data
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error en GET /api/leads:", error);
    return NextResponse.json(
      { error: "Error al cargar los leads" },
      { status: 500 }
    );
  }
}

// 🔹 POST: crear Lead, crear/actualizar Usuario y mandar email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, email, telefono, agenteId, lugarId } = body;

    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { error: "Nombre, email y teléfono son obligatorios" },
        { status: 400 }
      );
    }

    // Normalizamos IDs opcionales
    const agenteIdNum =
      typeof agenteId === "string" ? Number(agenteId) : agenteId ?? null;
    const lugarIdNum =
      typeof lugarId === "string" ? Number(lugarId) : lugarId ?? null;

    // 1) Buscar si ya existe un usuario con ese email
    let usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    let passwordProvisional: string | null = null;
    const esUsuarioNuevo = !usuario;

    // 2) Si NO existe, creamos usuario con contraseña provisional
    if (!usuario) {
      passwordProvisional = Math.random().toString(36).slice(-10); // 10 caracteres
      const passwordHasheado = await bcrypt.hash(passwordProvisional, 10);

      usuario = await prisma.usuario.create({
        data: {
          nombre,
          email,
          password: passwordHasheado,
          rol: "LUGAR", // rol por defecto para clientes finales
          agenteId: agenteIdNum,
          lugarId: lugarIdNum,
        },
      });
    } else {
      // Si ya existe, actualizamos nombre/relaciones por si han cambiado
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          nombre,
          agenteId: agenteIdNum ?? usuario.agenteId,
          lugarId: lugarIdNum ?? usuario.lugarId,
        },
      });
    }

    // 3) Crear el Lead
    const lead = await prisma.lead.create({
      data: {
        nombre,
        email,
        telefono,
        estado: "pendiente",
        agenteId: agenteIdNum,
        lugarId: lugarIdNum,
      },
    });

    // 4) Mandar email de bienvenida SOLO si el usuario es nuevo
    if (esUsuarioNuevo && passwordProvisional) {
      try {
        const base =
          process.env.NEXT_PUBLIC_BASE_URL ??
          process.env.NEXTAUTH_URL ??
          "https://impulsoenergetico.es";

        const loginUrl = base.replace(/\/+$/, "") + "/login";

        const asunto = "Bienvenido/a a Impulso Energético";
        const html = `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a;">
            <h2 style="color:#10b981;">Hola ${nombre || ""}, ¡bienvenido/a!</h2>
            <p>
              Gracias por registrarte en <strong>Impulso Energético</strong>. 
              Desde tu área privada podrás ver tus comparativas, ofertas y ventajas como socio.
            </p>
            <p>Hemos creado tu acceso provisional:</p>
            <ul>
              <li><strong>Usuario (email):</strong> ${email}</li>
              <li><strong>Contraseña provisional:</strong> ${passwordProvisional}</li>
            </ul>
            <p>Te recomendamos cambiar la contraseña la primera vez que entres.</p>
            <p>
              Puedes acceder desde este enlace:<br/>
              <a href="${loginUrl}" style="color:#10b981;">${loginUrl}</a>
            </p>
            <p style="margin-top:24px;">
              Un saludo,<br/>
              <strong>Equipo Impulso Energético</strong>
            </p>
          </div>
        `;

        await enviarEmail({
          to: email,
          subject: asunto,
          html,
        });
      } catch (error) {
        console.error("Error enviando email de bienvenida:", error);
        // No rompemos la creación del lead si el email falla
      }
    }

    // El modal solo mira res.ok, así que con esto es suficiente
    return NextResponse.json(
      {
        ok: true,
        lead,
        usuarioId: usuario.id,
        usuarioNuevo: esUsuarioNuevo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/leads:", error);
    return NextResponse.json(
      { error: "Error interno creando el lead" },
      { status: 500 }
    );
  }
}
