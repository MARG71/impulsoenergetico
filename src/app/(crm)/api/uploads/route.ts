// Ruta genérica de subida para el front: /api/upload
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const folder = String(form.get('folder') ?? '').trim(); // opcional: "logos-lugares", "carteles-especiales", etc.

    if (!file) {
      return NextResponse.json({ error: 'Fichero no recibido' }, { status: 400 });
    }

    const orig = file.name || 'upload.bin';
    const ext = orig.includes('.') ? orig.split('.').pop()!.toLowerCase() : 'bin';
    const base = folder ? `${folder.replace(/\/+$/,'')}/` : '';
    const key = `${base}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { url } = await put(key, file, {
      access: 'public',
      addRandomSuffix: false,
      // Si tu proyecto requiere token explícito, descomenta:
      // token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url });
  } catch (e: any) {
    console.error('UPLOAD error', e);
    return NextResponse.json({ error: e?.message ?? 'Error al subir' }, { status: 500 });
  }
}
