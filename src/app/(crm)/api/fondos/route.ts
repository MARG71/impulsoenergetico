import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, url } = body;

    if (!nombre || !url) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const fondo = await prisma.fondoCartel.create({
      data: {
        nombre,
        url,
      },
    });

    return NextResponse.json(fondo);
  } catch (error) {
    console.error('❌ Error al guardar en base de datos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const fondos = await prisma.fondoCartel.findMany({
      orderBy: { creadoEn: 'desc' },
    });

    const urls = fondos.map((f) => f.url);

    return NextResponse.json(urls);
  } catch (error) {
    console.error('❌ Error obteniendo fondos:', error);
    return NextResponse.json({ error: 'Error al obtener los fondos' }, { status: 500 });
  }
}
