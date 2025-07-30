import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('🟢 Body recibido:', body); // DEBUG
    const id = Number(body.id);
    console.log('🔢 ID parseado:', id); // DEBUG

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'ID del fondo inválido' }, { status: 400 });
    }

    // Desactivar todos los fondos
    await prisma.fondo.updateMany({
      data: { activo: false },
    });

    // Activar el nuevo fondo
    const fondoActualizado = await prisma.fondo.update({
      where: { id },
      data: { activo: true },
    });

    return NextResponse.json({ ok: true, fondo: fondoActualizado });
  } catch (error: any) {
    console.error('❌ Error al seleccionar fondo:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
