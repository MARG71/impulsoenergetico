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

function isUploadKind(v: string): v is UploadKind {
  return [
    "FACTURA",
    "DNI_FRENTE",
    "DNI_DORSO",
    "RECIBO_AUTONOMO",
    "CIF",
    "OTRO",
  ].includes(v);
}

async function fileToDataUri(file: File) {
  const ab = await file.arrayBuffer();
  const b64 = Buffer.from(ab).toString("base64");
  return `data:${file.type};base64,${b64}`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const nombre = String(form.get("nombre") || "").trim();
    const apellidos = String(form.get("apellidos") || "").trim();
    const telefono = String(form.get("telefono") || "").trim();
    const email = String(form.get("email") || "").trim();
    const dni = String(form.get("dni") || "").trim();
    const direccion = String(form.get("direccion") || "").trim();
    const cups = String(form.get("cups") || "").trim();
    const iban = String(form.get("iban") || "").trim();

    const tipoContratacionRaw = String(form.get("tipoContratacion") || "PERSONA_FISICA");
    const tipoContratacion: TipoContratacion =
      tipoContratacionRaw === "AUTONOMO" || tipoContratacionRaw === "EMPRESA"
        ? tipoContratacionRaw
        : "PERSONA_FISICA";

    // Campos obligatorios (como en pantalla)
    if (!nombre || !apellidos || !telefono || !direccion) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (nombre, apellidos, teléfono, dirección)." },
        { status: 400 }
      );
    }

    const ofertaId = Number(form.get("ofertaId") || 0) || null;
    const compania = String(form.get("compania") || "");
    const tarifa = String(form.get("tarifa") || "");
    const agenteId = Number(form.get("agenteId") || 0) || null;
    const lugarId = Number(form.get("lugarId") || 0) || null;
    const tipoCliente = String(form.get("tipoCliente") || "");
    const nombreTarifa = String(form.get("nombreTarifa") || "");

    const files = form.getAll("files").filter(Boolean) as File[];
    const filesKindsRaw = form.getAll("filesKinds").map((x) => String(x || "").trim());

    if (!files.length) {
      return NextResponse.json(
        { error: "Debes subir al menos un documento." },
        { status: 400 }
      );
    }

    // Alinear kinds con cada archivo
    const filesKinds: UploadKind[] = files.map((_, idx) => {
      const v = filesKindsRaw[idx] || "OTRO";
      return isUploadKind(v) ? v : "OTRO";
    });

    // Validación documentación obligatoria según tipo
    const required = requiredKindsByTipo[tipoContratacion];
    const missing = required.filter((k) => !filesKinds.includes(k));
    if (missing.length) {
      return NextResponse.json(
        { error: `Falta documentación obligatoria: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // 1) Crear solicitud
    const solicitud = await prisma.solicitudContrato.create({
      data: {
        nombre,
        apellidos,
        telefono,
        email,
        dni,
        direccionSuministro: direccion,
        cups,
        iban,
        ofertaId,
        compania,
        tarifa,
        agenteId,
        lugarId,
        tipoCliente,
        nombreTarifa,
        estado: "PENDIENTE",

        // ⚠️ Si tu modelo tiene este campo, perfecto.
        // Si Prisma te marca error aquí, dime y lo ajusto a tu schema real.
        tipoContratacion,
      } as any,
    });

    // 2) Subir archivos + guardar
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const kind = filesKinds[i];

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
