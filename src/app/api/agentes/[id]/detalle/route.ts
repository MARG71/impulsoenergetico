import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const agenteId = parseInt(params.id);

  try {
    const agente = await prisma.agente.findUnique({
      where: { id: agenteId },
      include: {
        usuarios: true,
        lugares: true,
        comparativas: {
          include: {
            cliente: true,
            lugar: true
          }
        },
      },
    });

    if (!agente) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
    }

    // Agregamos campos nombreLugar y direccionLugar manualmente para cada comparativa
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
