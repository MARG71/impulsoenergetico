// src/app/api/contacto-pladur/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      nombre,
      email,
      telefono,
      tipoTrabajo,
      mensaje,
      preferenciaContacto,
      aceptaContacto,
      agenteId,
      lugarId,
    } = body;

    if (!nombre || !email || !telefono || !mensaje) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    // 🔹 Aquí podrías:
    //  - Guardarlo en Prisma (tabla ContactoPladur, por ejemplo)
    //  - Enviarlo por email usando Nodemailer o un proveedor externo
    //  - Crear un lead especial "PLADUR"
    console.log("📩 Nuevo contacto PLADUR DICOPLAC:", {
      nombre,
      email,
      telefono,
      tipoTrabajo,
      mensaje,
      preferenciaContacto,
      aceptaContacto,
      agenteId,
      lugarId,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Solicitud recibida correctamente.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error en /api/contacto-pladur", err);
    return NextResponse.json(
      { message: "Error interno al procesar la solicitud." },
      { status: 500 }
    );
  }
}
