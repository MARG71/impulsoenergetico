import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function toId(v: string) {
  const id = Number(v);
  if (Number.isNaN(id)) throw new Error('ID inválido');
  return id;
}

// GET /api/agentes/:id
export async function GET(_req: Request, context: any) {
  try {
    const id = toId(context.params.id);
    const agente = await prisma.agente.findUnique({
      where: { id },
      select: { id: true, nombre: true, email: true, telefono: true },
    });
    if (!agente) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
    return NextResponse.json(agente);
  } catch (error: any) {
    const msg = error?.message ?? 'Error al obtener agente';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// PUT /api/agentes/:id
export async function PUT(req: Request, context: any) {
  try {
    const id = toId(context.params.id);
    const body = await req.json();
    const data: any = {};
    if (body?.nombre !== undefined) data.nombre = String(body.nombre).trim();
    if (body?.email !== undefined) data.email = String(body.email).trim();
    if (body?.telefono !== undefined) data.telefono = String(body.telefono).trim();

    const updated = await prisma.agente.update({
      where: { id },
      data,
      select: { id: true, nombre: true, email: true, telefono: true },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Email ya en uso' }, { status: 409 });
    const msg = error?.message ?? 'Error al actualizar agente';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// DELETE /api/agentes/:id
export async function DELETE(_req: Request, context: any) {
  try {
    const id = toId(context.params.id);
    await prisma.agente.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
    const msg = error?.message ?? 'Error al eliminar agente';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
