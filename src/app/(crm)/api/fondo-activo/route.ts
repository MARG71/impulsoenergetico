import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const fondo = await prisma.fondoActivo.findUnique({ where: { id: 1 } });
  return NextResponse.json(fondo || {});
}

export async function POST(req: Request) {
  const body = await req.json();
  const { url } = body;

  if (!url) {
    return new NextResponse('URL requerida', { status: 400 });
  }

  const fondo = await prisma.fondoActivo.upsert({
    where: { id: 1 },
    update: { url },
    create: { id: 1, url },
  });

  return NextResponse.json(fondo);
}
