// src/app/(crm)/api/usuarios/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendAccessEmail } from "@/lib/sendAccessEmail";

export async function GET() {
  const usuarios = await prisma.usuario.findMany({
    include: {
      agente: true,
      lugar: true,
    },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, email, password, rol, agenteId, lugarId } = body;

    if (!nombre || !email || !password || !rol) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        rol,
        agenteId: agenteId || null,
        lugarId: lugarId || null,
      },
    });

    // Enviar email de acceso (NO bloquea la respuesta si falla)
    sendAccessEmail({
      to: nuevoUsuario.email,
      nombre: nuevoUsuario.nombre,
      rol: nuevoUsuario.rol as "ADMIN" | "AGENTE" | "LUGAR",
      email: nuevoUsuario.email,
      password, // texto plano introducido en el formulario
    }).catch((err) => {
      console.error("Error enviando email de acceso:", err);
    });

    return NextResponse.json(nuevoUsuario);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
