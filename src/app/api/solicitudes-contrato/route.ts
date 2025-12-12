import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { Buffer } from "buffer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function fileToDataUri(file: any) {
  const ab = await file.arrayBuffer();
  const b64 = Buffer.from(ab).toString("base64");
  return `data:${file.type};base64,${b64}`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const nombre = String(form.get("nombre") || "").trim();
    const telefono = String(form.get("telefono") || "").trim();
    const direccion = String(form.get("direccion") || "").trim();

    if (!nombre || !telefono || !direccion) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (nombre, teléfono, dirección)." },
        { status: 400 }
      );
    }

    const payload = {
      nombre,
      apellidos: String(form.get("apellidos") || ""),
      telefono,
      email: String(form.get("email") || ""),
      dni: String(form.get("dni") || ""),
      direccionSuministro: direccion,
      cups: String(form.get("cups") || ""),
      iban: String(form.get("iban") || ""),
      ofertaId: Number(form.get("ofertaId") || 0) || null,
      compania: String(form.get("compania") || ""),
      tarifa: String(form.get("tarifa") || ""),
      agenteId: Number(form.get("agenteId") || 0) || null,
      lugarId: Number(form.get("lugarId") || 0) || null,
      tipoCliente: String(form.get("tipoCliente") || ""),
      nombreTarifa: String(form.get("nombreTarifa") || ""),
      uploadKind: String(form.get("uploadKind") || "OTRO"),
    };

    const files = form.getAll("files").filter(Boolean) as any[];

    if (!files.length) {
      return NextResponse.json(
        { error: "Debes subir al menos un documento." },
        { status: 400 }
      );
    }

    // 1️⃣ Crear solicitud
    const solicitud = await prisma.solicitudContrato.create({
      data: {
        nombre: payload.nombre,
        apellidos: payload.apellidos,
        telefono: payload.telefono,
        email: payload.email,
        dni: payload.dni,
        direccionSuministro: payload.direccionSuministro,
        cups: payload.cups,
        iban: payload.iban,
        ofertaId: payload.ofertaId,
        compania: payload.compania,
        tarifa: payload.tarifa,
        agenteId: payload.agenteId,
        lugarId: payload.lugarId,
        tipoCliente: payload.tipoCliente,
        nombreTarifa: payload.nombreTarifa,
        estado: "PENDIENTE",
      },
    });

    // 2️⃣ Subir archivos
    for (const f of files) {
      const dataUri = await fileToDataUri(f);

      const up = await cloudinary.uploader.upload(dataUri, {
        folder: `impulso/solicitudes/${solicitud.id}`,
        resource_type: "auto",
      });

      await prisma.solicitudContratoArchivo.create({
        data: {
          solicitudId: solicitud.id,
          url: up.secure_url,
          publicId: up.public_id,
          tipo: payload.uploadKind,
          nombreOriginal: f.name,
          mime: f.type,
          size: f.size,
        },
      });
    }

    return NextResponse.json({ ok: true, id: solicitud.id });
  } catch (err) {
    console.error("POST /api/solicitudes-contrato", err);
    return NextResponse.json(
      { error: "Error interno creando la solicitud." },
      { status: 500 }
    );
  }
}
