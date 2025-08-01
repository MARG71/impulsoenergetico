import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: obtener lugar por ID
export async function GET(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  const lugar = await prisma.lugar.findUnique({
    where: { id: parseInt(id) },
    include: {
      agente: true,
    },
  });

  if (!lugar) {
    return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
  }

  return NextResponse.json(lugar);
}

// PUT: actualizar lugar por ID
export async function PUT(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { nombre, direccion, qrCode, agenteId } = body;

    const lugarActualizado = await prisma.lugar.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        direccion,
        qrCode,
        ...(agenteId ? { agenteId: Number(agenteId) } : {}),
      },
    });

    return NextResponse.json(lugarActualizado);
  } catch (error) {
    console.error('Error al actualizar lugar:', error);
    return NextResponse.json({ error: 'Error al actualizar lugar' }, { status: 500 });
  }
}

// DELETE: eliminar lugar por ID
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  try {
    await prisma.lugar.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ mensaje: 'Lugar eliminado' });
  } catch (error) {
    console.error('Error al eliminar lugar:', error);
    return NextResponse.json({ error: 'Error al eliminar lugar' }, { status: 500 });
  }
}

