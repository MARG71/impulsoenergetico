// src/app/(crm)/api/lugares/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const toPct = (v: any) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  const p = n > 1 ? n / 100 : n;
  return Math.max(0, Math.min(1, p));
};

function toId(v: string) {
  const id = Number(v);
  if (Number.isNaN(id)) throw new Error('ID inválido');
  return id;
}

// GET /api/lugares/:id
export async function GET(_req: Request, context: any) {
  try {
    const id = toId(context.params.id);
    const lugar = await prisma.lugar.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        qrCode: true,
        agenteId: true,
        pctLugar: true,
        pctCliente: true,
        agente: { select: { id: true, nombre: true, email: true } },
      },
    });
    if (!lugar) return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    return NextResponse.json(lugar);
  } catch (error: any) {
    const msg = error?.message ?? 'Error al obtener lugar';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// PUT /api/lugares/:id  { nombre?, direccion?, qrCode?, agenteId?, pctCliente?, pctLugar? }
export async function PUT(req: Request, context: any) {
  try {
    const id = toId(context.params.id);
    const body = await req.json();

    const data: any = {};
    if (body?.nombre !== undefined) data.nombre = String(body.nombre).trim();
    if (body?.direccion !== undefined) data.direccion = String(body.direccion).trim();
    if (body?.qrCode !== undefined) data.qrCode = String(body.qrCode).trim();

    if (body?.agenteId !== undefined) {
      const agenteId = Number(body.agenteId);
      if (Number.isNaN(agenteId)) {
        return NextResponse.json({ error: 'agenteId inválido' }, { status: 400 });
      }
      const agente = await prisma.agente.findUnique({ where: { id: agenteId } });
      if (!agente) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
      data.agenteId = agenteId;
    }

    if (body?.pctCliente !== undefined) data.pctCliente = toPct(body.pctCliente);
    if (body?.pctLugar !== undefined) data.pctLugar = toPct(body.pctLugar);

    const updated = await prisma.lugar.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        direccion: true,
        qrCode: true,
        agenteId: true,
        pctLugar: true,
        pctCliente: true,
        agente: { select: { id: true, nombre: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    if (error?.code === 'P2002') return NextResponse.json({ error: 'qrCode ya existe' }, { status: 409 });
    const msg = error?.message ?? 'Error al actualizar lugar';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// DELETE /api/lugares/:id
export async function DELETE(_req: Request, context: any) {
  try {
    const id = toId(context.params.id);
    await prisma.lugar.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    const msg = error?.message ?? 'Error al eliminar lugar';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
