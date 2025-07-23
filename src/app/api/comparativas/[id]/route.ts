import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/comparativas/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const comparativaId = parseInt(params.id);

  try {
    const comparativa = await prisma.comparativa.findUnique({
      where: { id: comparativaId },
      include: {
        cliente: true,
        datosFactura: true,
        resultados: true,
        agente: true,         // 👈 Añadir
        lugar: true           // 👈 Añadir
      },
    });

    if (!comparativa) {
      return NextResponse.json({ error: 'Comparativa no encontrada' }, { status: 404 });
    }

    return NextResponse.json(comparativa);
  } catch (error) {
    console.error('Error al obtener comparativa:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
