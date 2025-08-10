import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function toId(v: string) {
  const id = Number(v);
  if (Number.isNaN(id)) throw new Error('ID inválido');
  return id;
}

export async function GET(_req: Request, context: any) {
  try {
    const agenteId = toId(context.params.id);

    const agente = await prisma.agente.findUnique({
      where: { id: agenteId },
      include: {
        // Quita o ajusta relaciones según tu schema
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

    if (!agente) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });

    const comparativasConLugar = (agente.comparativas ?? []).map((comp: any) => ({
      ...comp,
      nombreLugar: comp.lugar?.nombre || null,
      direccionLugar: comp.lugar?.direccion || null,
      nombreCliente: comp.cliente?.nombre || null,
    }));

    return NextResponse.json({ ...agente, comparativas: comparativasConLugar });
  } catch (error: any) {
    const msg = error?.message ?? 'Error al obtener detalle del agente';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
