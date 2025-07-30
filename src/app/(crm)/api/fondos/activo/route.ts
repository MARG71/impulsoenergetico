import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const fondoActivo = await prisma.fondoCartel.findFirst({
      where: { activo: true },
    });

    if (!fondoActivo) {
      return NextResponse.json({ error: 'No hay fondo activo seleccionado' }, { status: 404 });
    }

    return NextResponse.json(fondoActivo);
  } catch (error) {
    console.error('Error al obtener fondo activo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
