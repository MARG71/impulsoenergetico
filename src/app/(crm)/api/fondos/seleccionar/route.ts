import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL del fondo requerida' }, { status: 400 });
    }

    // Primero desactivamos todos los fondos
    await prisma.fondo.updateMany({
      data: { activo: false },
    });

    // Activamos solo el seleccionado
    const fondoActualizado = await prisma.fondo.update({
        where: { url },
        data: { activo: true },
    });


    return NextResponse.json({ ok: true, fondo: fondoActualizado });
  } catch (error) {
    console.error('Error al seleccionar fondo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
