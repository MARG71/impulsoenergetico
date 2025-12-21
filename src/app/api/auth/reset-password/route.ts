// src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { enviarEmail } from "@/lib/mailer";

function generarPasswordProvisional(longitud = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < longitud; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const emailRaw = (body?.email || "").trim().toLowerCase();

    if (!emailRaw) {
      return NextResponse.json(
        { error: "Email obligatorio" },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const usuario = await prisma.usuario.findUnique({
      where: { email: emailRaw },
    });

    // Para no dar pistas, respondemos 200 aunque no exista
    if (!usuario) {
      return NextResponse.json({
        ok: true,
        message:
          "Si el email existe en nuestra base de datos, recibirás un correo con tu nueva contraseña.",
      });
    }

    // Generar nueva contraseña provisional
    const nuevaPassword = generarPasswordProvisional(10);
    const hash = await bcrypt.hash(nuevaPassword, 10);

    // Actualizar en BD
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hash },
    });

    // Enviar email con la nueva contraseña
    await enviarEmail({
      to: emailRaw,
      subject: "Nueva contraseña de acceso - Impulso Energético",
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.5;">
          <h2>Hola ${usuario.nombre || ""}</h2>
          <p>Hemos generado una <strong>nueva contraseña provisional</strong> para tu acceso a la plataforma de Impulso Energético.</p>
          <p style="margin-top: 16px;">Tus datos de acceso son:</p>
          <ul>
            <li><strong>Usuario (email):</strong> ${emailRaw}</li>
            <li><strong>Contraseña provisional:</strong> <code style="padding:2px 6px;border-radius:4px;background:#e5f9f0;border:1px solid #10b98133;">${nuevaPassword}</code></li>
          </ul>
          <p style="margin-top: 16px;">
            Por seguridad, te recomendamos que cambies esta contraseña en cuanto accedas a tu cuenta.
          </p>
          <p style="margin-top: 16px;">
            Puedes entrar desde aquí:
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://impulsoenergetico.es"}/login" target="_blank">
              Acceder a mi cuenta
            </a>
          </p>
          <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
            Si tú no has solicitado este cambio, ignora este correo o ponte en contacto con nosotros.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Si el email existe en nuestra base de datos, recibirás un correo con tu nueva contraseña.",
    });
  } catch (err) {
    console.error("[reset-password] Error:", err);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
