import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdirSync, existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name}`;
    const folderPath = path.join(process.cwd(), 'public', 'fondos');

    // Crear carpeta si no existe
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, fileName);
    await writeFile(filePath, buffer);

    const fondo = await prisma.fondoCartel.create({
      data: {
        nombre: file.name,
        url: `/fondos/${fileName}`,
      },
    });

    return NextResponse.json(fondo);
  } catch (error) {
    console.error('Error subiendo fondo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const fondos = await prisma.fondoCartel.findMany({
      orderBy: { creadoEn: 'desc' },
    });

    const urls = fondos.map((f) => f.url); // solo devolvemos los enlaces

    return NextResponse.json(urls);
  } catch (error) {
    console.error('Error obteniendo fondos:', error);
    return NextResponse.json({ error: 'Error al obtener los fondos' }, { status: 500 });
  }
}

