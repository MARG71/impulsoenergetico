import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client'; // 👈 clave para tipar where

// GET /api/agentes?take=6&skip=0&q=texto
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get('take') ?? 6);
    const skip = Number(searchParams.get('skip') ?? 0);
    const q = searchParams.get('q')?.trim() ?? '';

    let where: Prisma.AgenteWhereInput | undefined;

    if (q) {
      const orFilters: Prisma.AgenteWhereInput[] = [
        { nombre:   { contains: q, mode: 'insensitive' as const } },
        { email:    { contains: q, mode: 'insensitive' as const } },
        { telefono: { contains: q, mode: 'insensitive' as const } },
      ];
      where = { OR: orFilters };
    }

    const agentes = await prisma.agente.findMany({
      where,
      orderBy: { id: 'desc' }, // cambia a { creadoEn: 'desc' } si tu modelo lo tiene
      take,
      skip,
      select: { id: true, nombre: true, email: true, telefono: true },
    });

    // Tu Dashboard espera un array plano
    return NextResponse.json(agentes);
  } catch (error: any) {
    console.error('Error al obtener agentes:', error);
    return NextResponse.json({ error: error.message ?? 'Error al obtener agentes' }, { status: 500 });
  }
}

// POST: Crear un nuevo agente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nombre = (body?.nombre ?? '').trim();
    const email = (body?.email ?? '').trim();
    const telefono = (body?.telefono ?? '').trim();

    if (!nombre || !email) {
      return NextResponse.json({ error: 'nombre y email son obligatorios' }, { status: 400 });
    }

    // Evitar duplicados (si email es unique)
    const existente = await prisma.agente.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json({ error: 'Ya existe un agente con ese email' }, { status: 409 });
    }

    const nuevoAgente = await prisma.agente.create({
      data: { nombre, email, telefono },
      select: { id: true, nombre: true, email: true, telefono: true },
    });

    return NextResponse.json(nuevoAgente, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear el agente:', error);
    return NextResponse.json({ error: error.message ?? 'Error al crear el agente' }, { status: 500 });
  }
}
