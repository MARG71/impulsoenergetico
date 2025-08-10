// src/app/(crm)/api/lugares/[id]/comision/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, ctx: any) {
  const id = Number(ctx.params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const body = await req.json();
  const data: any = {};
  if (body.pctLugar !== undefined) data.pctLugar = body.pctLugar;     // 0..1
  if (body.pctCliente !== undefined) data.pctCliente = body.pctCliente; // 0..1

  const updated = await prisma.lugar.update({
    where: { id },
    data,
    select: { id: true, nombre: true, pctLugar: true, pctCliente: true },
  });
  return NextResponse.json(updated);
}
