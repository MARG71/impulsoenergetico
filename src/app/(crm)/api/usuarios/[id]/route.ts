// src/app/(crm)/api/usuarios/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendAccessEmail } from "@/lib/sendAccessEmail";

// GET: obtener usuario por ID
export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      include: {
        agente: true,
        lugar: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT: actualizar usuario por ID
export async function PUT(request: NextRequest) {
  const idStr = request.nextUrl.pathname.split("/").pop();

  if (!idStr) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  const id = Number(idStr);

  try {
    const body = await request.json();
    const { nombre, email, password, rol, agenteId, lugarId } = body;

    const dataToUpdate: any = {
      nombre,
      email,
      rol,
      agenteId: agenteId || null,
      lugarId: lugarId || null,
    };

    let nuevaPasswordPlano: string | null = null;

    if (password && password.trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(password, 10);
      nuevaPasswordPlano = password;
    }

    const updatedUsuario = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
    });

    // Si se ha cambiado la contraseña, mandamos nuevo email
    if (nuevaPasswordPlano) {
      sendAccessEmail({
        to: updatedUsuario.email,
        nombre: updatedUsuario.nombre,
        rol: updatedUsuario.rol as "ADMIN" | "AGENTE" | "LUGAR",
        email: updatedUsuario.email,
        password: nuevaPasswordPlano,
      }).catch((err) => {
        console.error("Error enviando email de actualización de acceso:", err);
      });
    }

    return NextResponse.json(updatedUsuario);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// DELETE: eliminar usuario por ID
export async function DELETE(request: NextRequest) {
  const idStr = request.nextUrl.pathname.split("/").pop();

  if (!idStr) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  const id = Number(idStr);

  try {
    await prisma.usuario.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
