import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filtro = searchParams.get('filtro');

  try {
    let fondos;

    if (filtro === 'ultimos7') {
      const fecha7dias = new Date();
      fecha7dias.setDate(fecha7dias.getDate() - 7);

      fondos = await prisma.fondoCartel.findMany({
        where: {
          creadoEn: { gte: fecha7dias },
        },
        orderBy: { creadoEn: 'desc' },
      });
    } else {
      fondos = await prisma.fondoCartel.findMany({
        orderBy: { creadoEn: 'desc' },
      });
    }

    return NextResponse.json(fondos);
  } catch (error) {
    console.error('❌ Error al obtener fondos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, url } = body;

    if (!nombre || !url) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const fondo = await prisma.fondoCartel.create({
      data: { nombre, url },
    });

    return NextResponse.json(fondo);
  } catch (error) {
    console.error('❌ Error al guardar en base de datos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta ID de fondo' }, { status: 400 });
    }

    await prisma.fondoCartel.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('❌ Error al eliminar fondo:', error);
    return NextResponse.json({ error: 'Error interno al eliminar' }, { status: 500 });
  }
}
