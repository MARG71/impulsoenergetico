import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UploadKind =
  | "FACTURA"
  | "DNI_FRENTE"
  | "DNI_DORSO"
  | "RECIBO_AUTONOMO"
  | "CIF"
  | "OTRO";

type UploadedDoc = {
  kind: UploadKind;
  url: string;
  publicId: string;
  nombreOriginal: string;
  mime: string;
  size: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nombre = String(body?.nombre || "").trim();
    const telefono = String(body?.telefono || "").trim();
    const direccion = String(body?.direccion || "").trim();
    const tipoContratacion = String(body?.tipoContratacion || "").trim();
    const documentos: UploadedDoc[] = Array.isArray(body?.documentos) ? body.documentos : [];

    if (!nombre || !telefono || !direccion) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (nombre, teléfono, dirección)." },
        { status: 400 }
      );
    }

    if (!documentos.length) {
      return NextResponse.json(
        { error: "Debes subir al menos un documento." },
        { status: 400 }
      );
    }

    // 1) Crear solicitud
    const solicitud = await prisma.solicitudContrato.create({
      data: {
        nombre,
        apellidos: body?.apellidos ? String(body.apellidos).trim() : null,
        telefono,
        email: body?.email ? String(body.email).trim() : null,
        dni: body?.dni ? String(body.dni).trim() : null,
        direccionSuministro: direccion,
        cups: body?.cups ? String(body.cups).trim() : null,
        iban: body?.iban ? String(body.iban).trim() : null,

        tipoContratacion: tipoContratacion || null,

        ofertaId: body?.ofertaId ? Number(body.ofertaId) : null,
        compania: body?.compania ? String(body.compania).trim() : null,
        tarifa: body?.tarifa ? String(body.tarifa).trim() : null,
        agenteId: body?.agenteId ? Number(body.agenteId) : null,
        lugarId: body?.lugarId ? Number(body.lugarId) : null,
        tipoCliente: body?.tipoCliente ? String(body.tipoCliente).trim() : null,
        nombreTarifa: body?.nombreTarifa ? String(body.nombreTarifa).trim() : null,

        estado: "PENDIENTE",
      },
      select: { id: true },
    });

    // 2) Guardar documentos ya subidos a Cloudinary
    for (const d of documentos) {
      if (!d?.url || !d?.publicId) continue;

      await prisma.solicitudContratoArchivo.create({
        data: {
          solicitudId: solicitud.id,
          url: d.url,
          publicId: d.publicId,
          tipo: d.kind,
          nombreOriginal: d.nombreOriginal || null,
          mime: d.mime || null,
          size: d.size || null,
        },
      });
    }

    return NextResponse.json({ ok: true, id: solicitud.id });
  } catch (err) {
    console.error("POST /api/solicitudes-contrato-v2", err);
    return NextResponse.json(
      { error: "Error interno creando la solicitud." },
      { status: 500 }
    );
  }
}
