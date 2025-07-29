import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'fondos_carteles' }, (error, result) => {
          if (error || !result) {
            reject(error);
          } else {
            resolve(result as any);
          }
        })
        .end(buffer);
    });

    const fondo = await prisma.fondoCartel.create({
      data: {
        nombre: file.name,
        url: uploadResult.secure_url,
      },
    });

    return NextResponse.json(fondo);
  } catch (error) {
    console.error('Error al subir el fondo a Cloudinary:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
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
    console.error('Error al obtener los fondos:', error);
    return NextResponse.json({ error: 'Error al obtener los fondos' }, { status: 500 });
  }
}
