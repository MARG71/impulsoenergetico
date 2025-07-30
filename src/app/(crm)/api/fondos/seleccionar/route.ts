import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('🟢 Body recibido:', body);
    const id = Number(body.id);
    console.log('🔢 ID parseado:', id);

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'ID del fondo inválido' }, { status: 400 });
    }

    // Desactivamos todos los fondos en FondoCartel
    await prisma.fondoCartel.updateMany({
      data: { activo: false },
    });

    // Activamos el fondo con el ID recibido en FondoCartel
    const actualizado = await prisma.fondoCartel.updateMany({
      where: { id },
      data: { activo: true },
    });

    if (actualizado.count === 0) {
      return NextResponse.json({ error: 'No se encontró un fondo con ese ID' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('❌ Error al seleccionar fondo:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
