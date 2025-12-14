import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Buffer } from "buffer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TipoContratacion = "PERSONA_FISICA" | "AUTONOMO" | "EMPRESA";

type UploadKind =
  | "FACTURA"
  | "DNI_FRENTE"
  | "DNI_DORSO"
  | "RECIBO_AUTONOMO"
  | "CIF"
  | "OTRO";

const requiredKindsByTipo: Record<TipoContratacion, UploadKind[]> = {
  PERSONA_FISICA: ["DNI_FRENTE", "DNI_DORSO", "FACTURA"],
  AUTONOMO: ["DNI_FRENTE", "DNI_DORSO", "FACTURA", "RECIBO_AUTONOMO"],
  EMPRESA: ["DNI_FRENTE", "DNI_DORSO", "FACTURA", "CIF"],
};

function getStr(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function getNumOrNull(form: FormData, key: string) {
  const v = getStr(form, key);
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function labelKind(kind: UploadKind) {
  const map: Record<UploadKind, string> = {
    FACTURA: "Factura",
    DNI_FRENTE: "DNI_frontal",
    DNI_DORSO: "DNI_trasera",
    RECIBO_AUTONOMO: "Recibo_autonomo",
    CIF: "CIF",
    OTRO: "Otro",
  };
  return map[kind] ?? kind;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Datos mínimos
    const nombre = getStr(form, "nombre");
    const apellidos = getStr(form, "apellidos");
    const telefono = getStr(form, "telefono");
    const email = getStr(form, "email");
    const dni = getStr(form, "dni");
    const direccion = getStr(form, "direccion");

    const tipoContratacion = (getStr(form, "tipoContratacion") ||
      "PERSONA_FISICA") as TipoContratacion;

    if (!nombre || !telefono || !direccion) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (nombre, teléfono, dirección)." },
        { status: 400 }
      );
    }

    // Archivos
    const files = form.getAll("files").filter((v): v is File => v instanceof File);
    const kinds = form
      .getAll("filesKinds")
      .map((k) => String(k || "OTRO")) as UploadKind[];

    if (!files.length) {
      return NextResponse.json(
        { error: "Debes subir al menos un documento." },
        { status: 400 }
      );
    }

    // Validación por tipo (requeridos)
    const required = requiredKindsByTipo[tipoContratacion] ?? [];
    const missing = required.filter((k) => !kinds.includes(k));
    if (missing.length) {
      return NextResponse.json(
        { error: "Falta documentación obligatoria: " + missing.map(labelKind).join(", ") },
        { status: 400 }
      );
    }

    // ⚠️ Límite recomendado en Vercel (adjuntos)
    // Si quieres 15MB reales sin problemas -> subir a Cloudinary/Blob y mandar enlaces
    const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const MAX_TOTAL = 8 * 1024 * 1024; // 8MB recomendado
    if (totalBytes > MAX_TOTAL) {
      return NextResponse.json(
        { error: "Los documentos pesan demasiado. Máximo 8MB en total." },
        { status: 400 }
      );
    }

    // Guardar solicitud en BD (sin archivos)
    const solicitud = await prisma.solicitudContrato.create({
      data: {
        nombre,
        apellidos: apellidos || null,
        telefono,
        email: email || null,
        dni: dni || null,
        direccionSuministro: direccion || null,

        cups: getStr(form, "cups") || null,
        iban: getStr(form, "iban") || null,

        tipoContratacion: tipoContratacion || null,

        ofertaId: getNumOrNull(form, "ofertaId"),
        compania: getStr(form, "compania") || null,
        tarifa: getStr(form, "tarifa") || null,
        agenteId: getNumOrNull(form, "agenteId"),
        lugarId: getNumOrNull(form, "lugarId"),
        tipoCliente: getStr(form, "tipoCliente") || null,
        nombreTarifa: getStr(form, "nombreTarifa") || null,

        estado: "PENDIENTE",
      },
      select: { id: true },
    });

    // Adjuntos
    const attachments = await Promise.all(
      files.map(async (file, i) => {
        const kind = kinds[i] ?? "OTRO";
        const buffer = Buffer.from(await file.arrayBuffer());

        const safeName = file.name.replace(/[^\w.\-()]/g, "_");
        const prefix = labelKind(kind);
        const filename = `${prefix}__${safeName}`;

        return {
          filename,
          content: buffer,
          contentType: file.type || "application/octet-stream",
        };
      })
    );

    // SMTP (IONOS)
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const to = process.env.CONTRATOS_TO;

    // ✅ IONOS suele exigir que "from" sea el mismo usuario autenticado
    const from = user || "";

    if (!host || !user || !pass || !to || !from) {
      return NextResponse.json(
        { error: "Faltan variables SMTP en servidor (Vercel)." },
        { status: 500 }
      );
    }

    // ✅ Transporter compatible con IONOS en 587 (STARTTLS)
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,       // ✅ 587 -> SIEMPRE false
      requireTLS: true,    // ✅ fuerza STARTTLS
      auth: { user, pass },
      tls: {
        servername: host,  // ✅ importante en Vercel/serverless
        rejectUnauthorized: true,
      },
    });

    // ✅ Esto ayuda a que en logs salga el motivo exacto si falla conexión/auth
    await transporter.verify();

    const asunto = `📄 Nueva solicitud #${solicitud.id} — ${nombre} ${apellidos}`.trim();

    const cuerpo = [
      `Solicitud ID: ${solicitud.id}`,
      `Tipo contratación: ${tipoContratacion}`,
      "",
      `Nombre: ${nombre} ${apellidos}`.trim(),
      `Teléfono: ${telefono}`,
      email ? `Email: ${email}` : "",
      dni ? `DNI/NIE: ${dni}` : "",
      `Dirección: ${direccion}`,
      "",
      `Compañía: ${getStr(form, "compania")}`,
      `Tarifa: ${getStr(form, "tarifa")}`,
      `OfertaId: ${getStr(form, "ofertaId")}`,
      `AgenteId: ${getStr(form, "agenteId")}`,
      `LugarId: ${getStr(form, "lugarId")}`,
      "",
      `Adjuntos: ${files.length}`,
      `Tamaño total: ${Math.round(totalBytes / 1024)} KB`,
    ]
      .filter(Boolean)
      .join("\n");

    await transporter.sendMail({
      from,
      to,
      subject: asunto,
      text: cuerpo,
      replyTo: email || undefined,
      attachments,
    });

    return NextResponse.json({ ok: true, id: solicitud.id });
  } catch (err: any) {
    console.error("POST /api/solicitudes-contrato", err);

    // Sacar detalle útil a logs + cliente
    const detail =
      err?.message ||
      err?.response?.toString?.() ||
      err?.response ||
      JSON.stringify(err, Object.getOwnPropertyNames(err));

    return NextResponse.json(
      { error: "Error interno enviando la solicitud por email.", detail },
      { status: 500 }
    );
  }
}
