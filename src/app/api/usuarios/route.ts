import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  const usuarios = await prisma.usuario.findMany({
    include: {
      agente: true,
      lugar: true,
    },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: Request) {
  const body = await req.json();
  const hashedPassword = await bcrypt.hash(body.password, 10);

  const nuevoUsuario = await prisma.usuario.create({
    data: {
      nombre: body.nombre,
      email: body.email,
      password: hashedPassword,
      rol: body.rol,
      agenteId: body.agenteId || null,
      lugarId: body.lugarId || null,
    },
  });

  return NextResponse.json(nuevoUsuario);
}
