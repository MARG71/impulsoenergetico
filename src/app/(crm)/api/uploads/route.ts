// /api/uploads  (subida por formulario)
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const folder = String(form.get('folder') ?? '').trim();

    if (!file) {
      return NextResponse.json({ error: 'Fichero no recibido' }, { status: 400 });
    }

    const maxMB = 25;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxMB) {
      return NextResponse.json(
        { error: `Archivo demasiado grande (${sizeMB.toFixed(1)} MB). Máximo ${maxMB} MB.` },
        { status: 413 }
      );
    }

    const orig = file.name || 'upload.bin';
    const ext = orig.includes('.') ? orig.split('.').pop()!.toLowerCase() : 'bin';
    const base = folder ? `${folder.replace(/\/+$/,'')}/` : '';
    const key = `${base}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const contentType = (file as any).type || 'application/octet-stream';
    const data = await file.arrayBuffer();

    const options: any = {
      access: 'public',
      addRandomSuffix: false,
      contentType,
    };
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      options.token = process.env.BLOB_READ_WRITE_TOKEN;
    }

    const { url } = await put(key, data, options);
    return NextResponse.json({ url, key, size: file.size, contentType });
  } catch (e: any) {
    console.error('UPLOAD error /api/uploads:', e?.message || e, e?.stack || '');
    return NextResponse.json({ error: e?.message ?? 'Error al subir a Blob' }, { status: 500 });
  }
}
