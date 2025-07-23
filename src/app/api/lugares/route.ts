import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, direccion, qrCode, agenteId } = body;

    if (!nombre || !direccion || !qrCode || !agenteId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const nuevoLugar = await prisma.lugar.create({
      data: {
        nombre,
        direccion,
        qrCode,
        agenteId: Number(agenteId),
      },
      include: {
        agente: true, // <- Asegura que se incluya el objeto agente
      },
    });

    return NextResponse.json(nuevoLugar, { status: 201 });
  } catch (error) {
    console.error('Error al registrar lugar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const lugares = await prisma.lugar.findMany({
      include: {
        agente: true,
      },
    });
    return NextResponse.json(lugares);
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    return NextResponse.json({ error: 'Error al obtener lugares' }, { status: 500 });
  }
}
