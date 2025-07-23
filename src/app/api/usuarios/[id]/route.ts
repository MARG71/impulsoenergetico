import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Obtener usuario por ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(params.id) },
      include: {
        agente: true,
        lugar: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Actualizar usuario por ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUsuario = await prisma.usuario.update({
      where: { id: Number(params.id) },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedUsuario);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// Eliminar usuario por ID (por si lo usas)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.usuario.delete({
      where: { id: Number(params.id) },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nuevo = await prisma.usuario.create({
      data: {
        nombre: body.nombre,
        email: body.email,
        password: body.password,
        rol: body.rol,
        agenteId: body.agenteId ? Number(body.agenteId) : null,
        lugarId: body.lugarId ? Number(body.lugarId) : null,
      },
    });
    return NextResponse.json(nuevo);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
