// src/lib/sendAccessEmail.ts
import nodemailer from "nodemailer";

type Rol = "ADMIN" | "AGENTE" | "LUGAR";

interface SendAccessEmailParams {
  to: string;
  nombre: string;
  rol: Rol;
  email: string;
  password: string;
}

function getRoleLabel(rol: Rol) {
  if (rol === "ADMIN") return "Administrador";
  if (rol === "AGENTE") return "Agente";
  return "Cliente / Lugar";
}

export async function sendAccessEmail({
  to,
  nombre,
  rol,
  email,
  password,
}: SendAccessEmailParams) {

  // URL base
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://impulsoenergetico.es";

  const loginUrl = `${baseUrl}/login`;

  // 🔥 CORREGIDO: usar variables SMTP REALES del proyecto
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const rolTexto = getRoleLabel(rol);

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a;">
      <h2 style="color:#22c55e; margin-bottom:8px;">Bienvenido/a a IMPULSO ENERGÉTICO</h2>
      <p style="margin:4px 0;">Hola, <strong>${nombre}</strong>.</p>
      <p style="margin:4px 0;">
        Te hemos creado un acceso como <strong>${rolTexto}</strong> a la plataforma.
      </p>

      <div style="margin:16px 0; padding:12px 16px; background:#020617; color:#e5e7eb; border-radius:10px;">
        <p style="margin:0 0 4px 0;"><strong>URL de acceso:</strong> <a href="${loginUrl}" style="color:#22c55e;">${loginUrl}</a></p>
        <p style="margin:0 0 4px 0;"><strong>Usuario (email):</strong> ${email}</p>
        <p style="margin:0;"><strong>Contraseña:</strong> ${password}</p>
      </div>

      <p style="font-size:12px; color:#64748b; margin-top:16px;">
        Por seguridad, te recomendamos cambiar esta contraseña la primera vez que inicies sesión.
      </p>

      <p style="font-size:12px; color:#94a3b8; margin-top:12px;">
        IMPULSO ENERGÉTICO<br/>
        Plataforma de ahorro y comisiones
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Impulso Energético" <no-reply@impulsoenergetico.es>',
    to,
    subject: `Acceso a tu zona (${rolTexto}) - Impulso Energético`,
    html,
  });
}
