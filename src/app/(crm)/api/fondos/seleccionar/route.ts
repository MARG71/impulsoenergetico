import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: 'ID del fondo requerido' }, { status: 400 });
    }

    // Desactivamos todos los fondos
    await prisma.fondo.updateMany({
      data: { activo: false },
    });

    // Activamos el fondo con el ID recibido
    const fondoActualizado = await prisma.fondo.update({
      where: { id },
      data: { activo: true },
    });

    return NextResponse.json({ ok: true, fondo: fondoActualizado });
  } catch (error: any) {
    console.error('Error al seleccionar fondo:', error);
    return NextResponse.json({ error: error?.message || 'Error interno del servidor' }, { status: 500 });
  }
}
