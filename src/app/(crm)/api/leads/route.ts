// src/app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Obtener todos los leads
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        lugar: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
        agente: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error al obtener leads:', error);
    return NextResponse.json({ error: 'Error al obtener leads' }, { status: 500 });
  }
}

// Crear un nuevo lead
// Crear un nuevo lead
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, email, telefono, lugarId, agenteId } = body;

    if (!nombre || !email || !telefono || !lugarId || !agenteId) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const nuevoLead = await prisma.lead.create({
      data: {
        nombre,
        email,
        telefono,
        lugarId,
        agenteId,
      },
    });

    return NextResponse.json(nuevoLead);
  } catch (error) {
    console.error('Error al crear lead:', error);
    return NextResponse.json({ error: 'Error al crear lead' }, { status: 500 });
  }
}
