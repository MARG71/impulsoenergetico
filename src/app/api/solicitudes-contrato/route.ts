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

function escHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Datos cliente
    const nombre = getStr(form, "nombre");
    const apellidos = getStr(form, "apellidos");
    const telefono = getStr(form, "telefono");
    const email = getStr(form, "email");
    const dni = getStr(form, "dni");
    const direccion = getStr(form, "direccion");
    const cups = getStr(form, "cups");
    const iban = getStr(form, "iban");

    const tipoContratacion = (getStr(form, "tipoContratacion") ||
      "PERSONA_FISICA") as TipoContratacion;

    // Datos oferta
    const ofertaId = getStr(form, "ofertaId");
    const compania = getStr(form, "compania");
    const tarifa = getStr(form, "tarifa"); // ✅ lo usaremos como "anexo de precios"
    const nombreTarifa = getStr(form, "nombreTarifa");
    const tipoCliente = getStr(form, "tipoCliente");

    // Trazabilidad
    const agenteId = getStr(form, "agenteId");
    const lugarId = getStr(form, "lugarId");

    if (!nombre || !telefono || !direccion) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (nombre, teléfono, dirección)." },
        { status: 400 }
      );
    }

    // Archivos
    const files = form
      .getAll("files")
      .filter((v): v is File => v instanceof File);

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
        {
          error:
            "Falta documentación obligatoria: " +
            missing.map(labelKind).join(", "),
        },
        { status: 400 }
      );
    }

    // Límite recomendado
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

        cups: cups || null,
        iban: iban || null,

        tipoContratacion: tipoContratacion || null,

        ofertaId: getNumOrNull(form, "ofertaId"),
        compania: compania || null,
        tarifa: tarifa || null,
        agenteId: getNumOrNull(form, "agenteId"),
        lugarId: getNumOrNull(form, "lugarId"),
        tipoCliente: tipoCliente || null,
        nombreTarifa: nombreTarifa || null,

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

    // SMTP
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Destino
    const to = process.env.CONTRATOS_TO || "contratosimpulso@gmail.com";

    // IONOS: from = usuario autenticado
    const from = user || "";

    if (!host || !user || !pass || !to || !from) {
      return NextResponse.json(
        { error: "Faltan variables SMTP en servidor (Vercel)." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // 587
      requireTLS: true,
      auth: { user, pass },
      tls: { servername: host, rejectUnauthorized: true },
    });

    await transporter.verify();

    // ✅ ASUNTO: ID + nombre cliente
    const nombreCompleto = `${nombre} ${apellidos}`.trim();
    const asunto = `#${solicitud.id} — ${nombreCompleto}`;

    // ✅ TEXTO
    const texto = [
      `CONTRATO / SOLICITUD`,
      `Solicitud ID: ${solicitud.id}`,
      ``,
      `CLIENTE`,
      `Nombre: ${nombreCompleto}`,
      `Teléfono: ${telefono}`,
      email ? `Email: ${email}` : "",
      dni ? `DNI/NIE: ${dni}` : "",
      `Dirección: ${direccion}`,
      cups ? `CUPS: ${cups}` : "",
      iban ? `IBAN: ${iban}` : "",
      ``,
      `OFERTA CONTRATADA`,
      compania ? `Compañía: ${compania}` : "",
      tarifa ? `Anexo de precios: ${tarifa}` : "",
      nombreTarifa ? `Nombre tarifa: ${nombreTarifa}` : "",
      tipoCliente ? `Tipo cliente: ${tipoCliente}` : "",
      ofertaId ? `OfertaId: ${ofertaId}` : "",
      ``,
      `TRAZABILIDAD`,
      agenteId ? `AgenteId: ${agenteId}` : "",
      lugarId ? `LugarId: ${lugarId}` : "",
      ``,
      `DOCUMENTOS`,
      `Adjuntos: ${files.length}`,
      `Tamaño total: ${Math.round(totalBytes / 1024)} KB`,
    ]
      .filter(Boolean)
      .join("\n");

    // ✅ HTML
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.4">
        <h2 style="margin:0 0 8px">📄 CONTRATO / SOLICITUD</h2>
        <p style="margin:0 0 12px">
          <strong>Solicitud ID:</strong> ${solicitud.id}
        </p>

        <h3 style="margin:16px 0 8px">Cliente</h3>
        <ul style="margin:0 0 12px;padding-left:18px">
          <li><strong>Nombre:</strong> ${escHtml(nombreCompleto)}</li>
          <li><strong>Teléfono:</strong> ${escHtml(telefono)}</li>
          ${email ? `<li><strong>Email:</strong> ${escHtml(email)}</li>` : ""}
          ${dni ? `<li><strong>DNI/NIE:</strong> ${escHtml(dni)}</li>` : ""}
          <li><strong>Dirección:</strong> ${escHtml(direccion)}</li>
          ${cups ? `<li><strong>CUPS:</strong> ${escHtml(cups)}</li>` : ""}
          ${iban ? `<li><strong>IBAN:</strong> ${escHtml(iban)}</li>` : ""}
        </ul>

        <h3 style="margin:16px 0 8px">Oferta contratada</h3>
        <ul style="margin:0 0 12px;padding-left:18px">
          ${compania ? `<li><strong>Compañía:</strong> ${escHtml(compania)}</li>` : ""}
          ${tarifa ? `<li><strong>Anexo de precios:</strong> ${escHtml(tarifa)}</li>` : ""}
          ${nombreTarifa ? `<li><strong>Nombre tarifa:</strong> ${escHtml(nombreTarifa)}</li>` : ""}
          ${tipoCliente ? `<li><strong>Tipo cliente:</strong> ${escHtml(tipoCliente)}</li>` : ""}
          ${ofertaId ? `<li><strong>OfertaId:</strong> ${escHtml(ofertaId)}</li>` : ""}
        </ul>

        <h3 style="margin:16px 0 8px">Trazabilidad</h3>
        <ul style="margin:0 0 12px;padding-left:18px">
          ${agenteId ? `<li><strong>AgenteId:</strong> ${escHtml(agenteId)}</li>` : ""}
          ${lugarId ? `<li><strong>LugarId:</strong> ${escHtml(lugarId)}</li>` : ""}
        </ul>

        <h3 style="margin:16px 0 8px">Documentos</h3>
        <p style="margin:0">
          <strong>Adjuntos:</strong> ${files.length}<br/>
          <strong>Tamaño total:</strong> ${Math.round(totalBytes / 1024)} KB
        </p>

        <hr style="margin:18px 0"/>
        <p style="margin:0;color:#666;font-size:12px">
          Email generado automáticamente desde impulsoenergetico.es
        </p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to,
      subject: asunto,
      text: texto,
      html,
      replyTo: email || undefined,
      attachments,
    });

    return NextResponse.json({ ok: true, id: solicitud.id });
  } catch (err: any) {
    console.error("POST /api/solicitudes-contrato", err);

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
