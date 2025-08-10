import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const toId = (v: string) => { const n = Number(v); if (Number.isNaN(n)) throw new Error('ID inválido'); return n; };
const normPct = (v: any) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n;
};

// GET /api/agentes/:id
export async function GET(_req: Request, ctx: any) {
  try {
    const id = toId(ctx.params.id);
    const agente = await prisma.agente.findUnique({
      where: { id },
      select: { id: true, nombre: true, email: true, telefono: true, pctAgente: true },
    });
    if (!agente) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
    return NextResponse.json(agente);
  } catch (e: any) {
    const msg = e?.message ?? 'Error';
    return NextResponse.json({ error: msg }, { status: msg.includes('ID inválido') ? 400 : 500 });
  }
}

// PUT /api/agentes/:id {nombre?,email?,telefono?,pctAgente?}
export async function PUT(req: Request, ctx: any) {
  try {
    const id = toId(ctx.params.id);
    const b = await req.json();
    const data: any = {};
    if (b?.nombre   !== undefined) data.nombre = String(b.nombre).trim();
    if (b?.email    !== undefined) data.email = String(b.email).trim();
    if (b?.telefono !== undefined) data.telefono = String(b.telefono).trim();
    if (b?.pctAgente !== undefined) {
      const p = normPct(b.pctAgente);
      if (p === undefined) return NextResponse.json({ error: 'pctAgente inválido' }, { status: 400 });
      data.pctAgente = p;
    }

    const up = await prisma.agente.update({
      where: { id }, data,
      select: { id: true, nombre: true, email: true, telefono: true, pctAgente: true },
    });
    return NextResponse.json(up);
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Email ya en uso' }, { status: 409 });
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
    const msg = e?.message ?? 'Error';
    return NextResponse.json({ error: msg }, { status: msg.includes('ID inválido') ? 400 : 500 });
  }
}

// DELETE /api/agentes/:id
export async function DELETE(_req: Request, ctx: any) {
  try {
    const id = toId(ctx.params.id);
    await prisma.agente.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
    const msg = e?.message ?? 'Error';
    return NextResponse.json({ error: msg }, { status: msg.includes('ID inválido') ? 400 : 500 });
  }
}
