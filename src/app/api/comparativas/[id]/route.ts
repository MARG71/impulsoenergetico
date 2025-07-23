import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/comparativas/[id]
export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  const comparativaId = parseInt(id);

  try {
    const comparativa = await prisma.comparativa.findUnique({
      where: { id: comparativaId },
      include: {
        cliente: true,
        datosFactura: true,
        resultados: true,
        agente: true,
        lugar: true,
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
