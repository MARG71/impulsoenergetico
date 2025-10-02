// src/app/api/lugares-public/[id]/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function toId(v: string) {
  const id = Number(v);
  if (Number.isNaN(id)) throw new Error('ID inválido');
  return id;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = toId(params.id);

    const lugar = await prisma.lugar.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        especial: true,
        especialLogoUrl: true,
        especialColor: true,
        especialMensaje: true,
        aportacionAcumulada: true,
        updatedAt: true,
      },
    });

    if (!lugar) {
      return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    }

    // Solo lo público que necesita la landing
    return NextResponse.json({
      id: lugar.id,
      nombre: lugar.nombre,
      especial: !!lugar.especial,
      logo: lugar.especialLogoUrl || null,
      color: lugar.especialColor || null,
      mensajeCorto: lugar.especialMensaje || null,
      aportacionAcumulada: lugar.aportacionAcumulada ?? 0,
      actualizadoEn: lugar.updatedAt,
    });
  } catch (e: any) {
    const msg = e?.message ?? 'Error';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
