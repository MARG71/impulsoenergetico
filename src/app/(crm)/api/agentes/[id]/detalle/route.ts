// src/app/api/agentes/[id]/detalle/route.ts
import { prisma } from '@/lib/prisma';


import { NextResponse } from 'next/server';

// ✅ Obtener agente por ID desde URL
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').filter(Boolean).pop(); // obtener el último segmento: el ID

  const agenteId = parseInt(id || '', 10);

  if (isNaN(agenteId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

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
