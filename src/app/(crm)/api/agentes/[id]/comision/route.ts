// src/app/(crm)/api/agentes/[id]/comision/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, ctx: any) {
  const id = Number(ctx.params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const body = await req.json();
  const data: any = {};
  if (body.pctAgente !== undefined) data.pctAgente = body.pctAgente; // 0..1

  const updated = await prisma.agente.update({
    where: { id },
    data,
    select: { id: true, nombre: true, pctAgente: true },
  });
  return NextResponse.json(updated);
}
