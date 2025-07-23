import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  const agenteId = parseInt(id);

  try {
    const agente = await prisma.agente.findUnique({
      where: { id: agenteId },
      include: {
        usuarios: true,
        lugares: true,
        comparativas: {
          include: {
            cliente: true,
            lugar: true,
          },
        },
      },
    });

    if (!agente) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
    }

    const comparativasConLugar = agente.comparativas.map((comp) => ({
      ...comp,
      nombreLugar: comp.lugar?.nombre || null,
      direccionLugar: comp.lugar?.direccion || null,
      nombreCliente: comp.cliente?.nombre || null,
    }));

    return NextResponse.json({
      ...agente,
      comparativas: comparativasConLugar,
    });
  } catch (error) {
    console.error('Error al obtener detalle del agente:', error);
    return NextResponse.json({ error: 'Error al obtener detalle del agente' }, { status: 500 });
  }
}
