// src/app/(crm)/api/agentes/[id]/detalle/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request, ctx: any) {
  // id desde params (Next 15) y fallback desde URL
  const fromParams = ctx?.params?.id;
  const fromUrl = new URL(req.url).pathname.split('/').filter(Boolean).pop();
  const id = Number(fromParams ?? fromUrl);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const agente = await prisma.agente.findUnique({
      where: { id },
      include: {
        usuarios: true,
        lugares: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            pctCliente: true,
            pctLugar: true,
          },
        },
        comparativas: {
          include: {
            cliente: { select: { id: true, nombre: true } },
            lugar:   { select: { id: true, nombre: true } },
          },
          orderBy: { id: 'desc' },
        },
        leads: {
          include: {
            lugar: { select: { id: true, nombre: true, direccion: true } },
          },
          orderBy: { creadoEn: 'desc' },
        },
      },
    });

    if (!agente) {
      return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
    }

    const comparativasConLugar = agente.comparativas.map((comp) => ({
      ...comp,
      nombreLugar: comp.lugar?.nombre ?? null,
      nombreCliente: comp.cliente?.nombre ?? null,
    }));

    return NextResponse.json({
      ...agente,
      comparativas: comparativasConLugar,
    });
  } catch (error: any) {
    console.error('Error al obtener detalle del agente:', error);
    return NextResponse.json({ error: 'Error al obtener detalle del agente' }, { status: 500 });
  }
}
