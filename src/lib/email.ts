// src/lib/email.ts
import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || "587");
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || "info@impulsoenergetico.es";

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn(
    "[email] Faltan variables SMTP_HOST / SMTP_USER / SMTP_PASS en .env – el envío de emails fallará."
  );
}

// Transporter compartido
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true si usas 465 (SSL); en 587 se usa STARTTLS
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

// ========= FUNCION GENÉRICA =========
export async function enviarEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("[email] No se envía email porque faltan variables SMTP.");
    return;
  }

  const from = smtpFrom || smtpUser;

  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("[email] Enviado OK:", info.messageId);
  } catch (err) {
    console.error("[email] Error enviando correo:", err);
    throw err;
  }
}

// ========= EMAIL DE BIENVENIDA =========
interface EmailBienvenidaParams {
  nombre: string;
  email: string;
  passwordProvisional: string;
  linkAcceso: string;
}

export async function enviarEmailBienvenida({
  nombre,
  email,
  passwordProvisional,
  linkAcceso,
}: EmailBienvenidaParams) {
  const asunto = "Bienvenid@ a Impulso Energético";

  const textoPlano = `
Hola ${nombre || ""},

Gracias por registrarte en Impulso Energético.

Estos son tus datos de acceso a tu área de cliente:

Usuario: ${email}
Contraseña provisional: ${passwordProvisional}

Puedes acceder desde este enlace:
${linkAcceso}

Te recomendamos cambiar la contraseña la primera vez que entres.

Un saludo,
Equipo de Impulso Energético
`;

  const html = `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#0f172a;">
    <h1 style="font-size:20px; margin-bottom:8px;">Hola ${nombre || ""} 👋</h1>
    <p style="font-size:14px; line-height:1.5;">
      Gracias por registrarte en <strong>Impulso Energético</strong>.
    </p>
    <p style="font-size:14px; line-height:1.5; margin-top:12px;">
      Estos son tus datos de acceso a tu <strong>área de cliente</strong>:
    </p>
    <ul style="font-size:14px; line-height:1.5;">
      <li><strong>Usuario:</strong> ${email}</li>
      <li><strong>Contraseña provisional:</strong> ${passwordProvisional}</li>
    </ul>
    <p style="font-size:14px; line-height:1.5; margin-top:12px;">
      Accede desde aquí:
    </p>
    <p>
      <a href="${linkAcceso}"
         style="display:inline-block;padding:10px 18px;border-radius:999px;background:#10b981;color:#0f172a;text-decoration:none;font-weight:600;">
         Acceder a mi cuenta
      </a>
    </p>
    <p style="font-size:12px; color:#6b7280; margin-top:16px;">
      Te recomendamos cambiar la contraseña la primera vez que entres.
    </p>
    <p style="font-size:12px; color:#6b7280; margin-top:8px;">
      Un saludo,<br/>
      <strong>Equipo de Impulso Energético</strong>
    </p>
  </div>
`;

  // reutilizamos la genérica
  await enviarEmail({
    to: email,
    subject: asunto,
    html,
    text: textoPlano,
  });
}
