import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const lugar = await prisma.lugar.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      agente: true,
    },
  });

  if (!lugar) return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });

  return NextResponse.json(lugar);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { nombre, direccion, qrCode, agenteId } = body;

    const lugarActualizado = await prisma.lugar.update({
      where: { id: parseInt(params.id) },
      data: {
        nombre,
        direccion,
        qrCode,
        agenteId: agenteId ? Number(agenteId) : null,
      },
    });

    return NextResponse.json(lugarActualizado);
  } catch (error) {
    console.error('Error al actualizar lugar:', error);
    return NextResponse.json({ error: 'Error al actualizar lugar' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.lugar.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ mensaje: 'Lugar eliminado' });
  } catch (error) {
    console.error('Error al eliminar lugar:', error);
    return NextResponse.json({ error: 'Error al eliminar lugar' }, { status: 500 });
  }
}

