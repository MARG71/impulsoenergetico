import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: obtener agente por ID
export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  const agente = await prisma.agente.findUnique({
    where: { id: parseInt(id) },
  });

  if (!agente) {
    return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
  }

  return NextResponse.json(agente);
}

// PUT: actualizar agente (incluye 'telefono')
export async function PUT(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  const body = await request.json();
  const { nombre, email, telefono } = body;

  try {
    const actualizado = await prisma.agente.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        email,
        telefono,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar agente:', error);
    return NextResponse.json({ error: 'Error al actualizar agente' }, { status: 500 });
  }
}
