import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Crear un nuevo agente
export async function POST(request: Request) {
  const body = await request.json();

  try {
    const nuevoAgente = await prisma.agente.create({
      data: {
        nombre: body.nombre,
        email: body.email,
        telefono: body.telefono, // ✅ Incluido
      },
    });

    return NextResponse.json(nuevoAgente, { status: 201 });
  } catch (error) {
    console.error('Error al crear el agente:', error);
    return NextResponse.json({ error: 'Error al crear el agente' }, { status: 500 });
  }
}

// GET: Obtener todos los agentes
export async function GET() {
  try {
    const agentes = await prisma.agente.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true, // ✅ Incluido
      },
    });
    return NextResponse.json(agentes);
  } catch (error) {
    console.error('Error al obtener agentes:', error);
    return NextResponse.json({ error: 'Error al obtener agentes' }, { status: 500 });
  }
}
