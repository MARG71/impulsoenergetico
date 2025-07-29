import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'fondos' }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(buffer);
    });

    const fondo = await prisma.fondoCartel.create({
      data: {
        nombre: file.name,
        url: uploadResponse.secure_url,
      },
    });

    return NextResponse.json(fondo);
  } catch (error) {
    console.error('❌ Error al subir a Cloudinary:', error);
    return NextResponse.json({ error: 'Error interno al subir el fondo' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const fondos = await prisma.fondoCartel.findMany({
      orderBy: { creadoEn: 'desc' },
    });

    const urls = fondos.map((f) => f.url);

    return NextResponse.json(urls);
  } catch (error) {
    console.error('❌ Error obteniendo fondos:', error);
    return NextResponse.json({ error: 'Error al obtener los fondos' }, { status: 500 });
  }
}
