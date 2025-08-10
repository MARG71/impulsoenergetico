import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/agentes?take=6&skip=0&q=texto&activos=1
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get('take') ?? 6);
    const skip = Number(searchParams.get('skip') ?? 0);
    const q = searchParams.get('q')?.trim() ?? '';
    const activos = searchParams.get('activos');

    const where: any = { AND: [] as any[] };

    if (q) {
      where.AND.push({
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { telefono: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (activos !== null) {
      const bool = ['1', 'true', 'yes', 'on'].includes(String(activos).toLowerCase());
      where.AND.push({ activo: bool });
    }

    const agentes = await prisma.agente.findMany({
      where: where.AND.length ? where : undefined,
      orderBy: { id: 'desc' }, // cambia a { creadoEn: 'desc' } si tienes ese campo
      take,
      skip,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        activo: true,
      },
    });

    // Para no romper tu Dashboard actual, devolvemos SOLO el array
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
    const activo = body?.activo !== undefined ? Boolean(body.activo) : true;

    if (!nombre || !email) {
      return NextResponse.json({ error: 'nombre y email son obligatorios' }, { status: 400 });
    }

    // Evitar duplicados por email (asume unique en Prisma)
    const existente = await prisma.agente.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json({ error: 'Ya existe un agente con ese email' }, { status: 409 });
    }

    const nuevoAgente = await prisma.agente.create({
      data: { nombre, email, telefono, activo },
      select: { id: true, nombre: true, email: true, telefono: true, activo: true },
    });

    return NextResponse.json(nuevoAgente, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear el agente:', error);
    return NextResponse.json({ error: error.message ?? 'Error al crear el agente' }, { status: 500 });
  }
}
