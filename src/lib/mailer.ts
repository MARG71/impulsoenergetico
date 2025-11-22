import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

export const mailer = nodemailer.createTransport({
  host,
  port,
  secure: false, // en 587 se usa STARTTLS
  auth: {
    user,
    pass,
  },
});

// Función cómoda para enviar emails
export async function enviarEmail(opciones: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!user) {
    console.error("SMTP_USER no está definido");
    return;
  }

  const from = process.env.EMAIL_FROM || user;

  await mailer.sendMail({
    from,
    to: opciones.to,
    subject: opciones.subject,
    html: opciones.html,
    text: opciones.text,
  });
}
