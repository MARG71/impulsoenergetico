import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const total = await prisma.agente.count();
  return NextResponse.json({ total });
}
