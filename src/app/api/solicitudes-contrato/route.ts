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

export async function GET() {
  return NextResponse.json({ ok: true, where: "app/api/solicitudes-contrato" });
}


async function fileToDataUri(file: File) {
  const ab = await file.arrayBuffer();
  const b64 = Buffer.from(ab).toString("base64");
  return `data:${file.type};base64,${b64}`;
}

function getStr(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function getNumOrNull(form: FormData, key: string) {
  const v = getStr(form, key);
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const nombre = getStr(form, "nombre");
    const telefono = getStr(form, "telefono");
    const direccion = getStr(form, "direccion");

    if (!nombre || !telefono || !direccion) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (nombre, teléfono, dirección)." },
        { status: 400 }
      );
    }

    // ✅ files bien tipados (solo File)
    const files = form
      .getAll("files")
      .filter((v): v is File => v instanceof File);

    if (!files.length) {
      return NextResponse.json(
        { error: "Debes subir al menos un documento." },
        { status: 400 }
      );
    }

    // ✅ kinds por archivo (mismo orden que los files)
    const kinds = form.getAll("filesKinds").map((k) => String(k || "OTRO"));

    const payload = {
      nombre,
      apellidos: getStr(form, "apellidos") || null,
      telefono,
      email: getStr(form, "email") || null,
      dni: getStr(form, "dni") || null,
      direccionSuministro: direccion || null,
      cups: getStr(form, "cups") || null,
      iban: getStr(form, "iban") || null,

      tipoContratacion: getStr(form, "tipoContratacion") || null,

      ofertaId: getNumOrNull(form, "ofertaId"),
      compania: getStr(form, "compania") || null,
      tarifa: getStr(form, "tarifa") || null,
      agenteId: getNumOrNull(form, "agenteId"),
      lugarId: getNumOrNull(form, "lugarId"),
      tipoCliente: getStr(form, "tipoCliente") || null,
      nombreTarifa: getStr(form, "nombreTarifa") || null,
    };

    // 1) Crear solicitud
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

        tipoContratacion: payload.tipoContratacion,

        ofertaId: payload.ofertaId,
        compania: payload.compania,
        tarifa: payload.tarifa,
        agenteId: payload.agenteId,
        lugarId: payload.lugarId,
        tipoCliente: payload.tipoCliente,
        nombreTarifa: payload.nombreTarifa,

        estado: "PENDIENTE",
      },
      select: { id: true },
    });

    // 2) Subir archivos + guardar en BD
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const kind = kinds[i] ?? "OTRO";

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
          tipo: kind,
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
