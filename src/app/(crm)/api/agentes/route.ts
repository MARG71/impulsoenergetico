import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

const normPct = (v: any) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n; // 15 -> 0.15
};

// GET /api/agentes?take=6&skip=0&q=texto
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get('take') ?? 6);
    const skip = Number(searchParams.get('skip') ?? 0);
    const q = searchParams.get('q')?.trim() ?? '';

    let where: Prisma.AgenteWhereInput | undefined;
    if (q) {
      where = {
        OR: [
          { nombre:   { contains: q, mode: 'insensitive' as const } },
          { email:    { contains: q, mode: 'insensitive' as const } },
          { telefono: { contains: q, mode: 'insensitive' as const } },
        ],
      };
    }

    const items = await prisma.agente.findMany({
      where, orderBy: { id: 'desc' }, take, skip,
      select: { id: true, nombre: true, email: true, telefono: true, pctAgente: true },
    });
    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/agentes {nombre,email,telefono?,pctAgente?}
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const nombre = (b?.nombre ?? '').trim();
    const email = (b?.email ?? '').trim();
    const telefono = (b?.telefono ?? '').trim();
    const pctAgente = normPct(b?.pctAgente);

    if (!nombre || !email) {
      return NextResponse.json({ error: 'nombre y email son obligatorios' }, { status: 400 });
    }

    const dup = await prisma.agente.findUnique({ where: { email } });
    if (dup) return NextResponse.json({ error: 'Email ya existe' }, { status: 409 });

    const agente = await prisma.agente.create({
      data: { nombre, email, telefono, ...(pctAgente !== undefined ? { pctAgente } : {}) },
      select: { id: true, nombre: true, email: true, telefono: true, pctAgente: true },
    });
    return NextResponse.json(agente, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
