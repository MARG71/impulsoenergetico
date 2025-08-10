// src/app/(crm)/api/lugares/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// GET /api/lugares?take=6&skip=0&q=texto&agenteId=1
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get('take') ?? 6);
    const skip = Number(searchParams.get('skip') ?? 0);
    const q = searchParams.get('q')?.trim() ?? '';
    const agenteIdParam = searchParams.get('agenteId');

    const where: Prisma.LugarWhereInput = {};

    if (q) {
      where.OR = [
        { nombre:    { contains: q, mode: 'insensitive' as const } },
        { direccion: { contains: q, mode: 'insensitive' as const } },
        { qrCode:    { contains: q, mode: 'insensitive' as const } },
      ];
    }
    if (agenteIdParam) {
      const agenteId = Number(agenteIdParam);
      if (!Number.isNaN(agenteId)) where.agenteId = agenteId;
    }

    const lugares = await prisma.lugar.findMany({
      where,
      orderBy: { id: 'desc' }, // cambia a { creadoEn: 'desc' } si prefieres
      take,
      skip,
      select: {
        id: true,
        nombre: true,
        direccion: true,
        qrCode: true,
        agenteId: true,
        // comisiones configurables en el CRM
        pctLugar: true,
        pctCliente: true,
        agente: { select: { id: true, nombre: true, email: true } },
      },
    });

    return NextResponse.json(lugares);
  } catch (error: any) {
    console.error('Error al obtener lugares:', error);
    return NextResponse.json({ error: error.message ?? 'Error al obtener lugares' }, { status: 500 });
  }
}

// POST /api/lugares  { nombre, direccion, qrCode, agenteId }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nombre = (body?.nombre ?? '').trim();
    const direccion = (body?.direccion ?? '').trim();
    const qrCode = (body?.qrCode ?? '').trim();
    const agenteId = Number(body?.agenteId);

    if (!nombre || !direccion || !qrCode || Number.isNaN(agenteId)) {
      return NextResponse.json({ error: 'nombre, direccion, qrCode y agenteId son obligatorios' }, { status: 400 });
    }

    // valida agente existente
    const agente = await prisma.agente.findUnique({ where: { id: agenteId } });
    if (!agente) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });

    // crea lugar
    const lugar = await prisma.lugar.create({
      data: { nombre, direccion, qrCode, agenteId },
      select: {
        id: true, nombre: true, direccion: true, qrCode: true, agenteId: true,
        pctLugar: true, pctCliente: true,
        agente: { select: { id: true, nombre: true, email: true } },
      },
    });

    return NextResponse.json(lugar, { status: 201 });
  } catch (error: any) {
    // P2002 = unique constraint (ej: qrCode duplicado)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'qrCode ya existe' }, { status: 409 });
    }
    console.error('Error al crear lugar:', error);
    return NextResponse.json({ error: error.message ?? 'Error al crear lugar' }, { status: 500 });
  }
}
