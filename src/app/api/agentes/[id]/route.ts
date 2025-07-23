import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: obtener agente por ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const agente = await prisma.agente.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!agente) {
    return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
  }

  return NextResponse.json(agente);
}

// PUT: actualizar agente (✅ ahora incluye 'telefono')
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { nombre, email, telefono } = body;

  try {
    const actualizado = await prisma.agente.update({
      where: { id: parseInt(params.id) },
      data: {
        nombre,
        email,
        telefono, // ✅ añadimos teléfono
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar agente:', error);
    return NextResponse.json({ error: 'Error al actualizar agente' }, { status: 500 });
  }
}
