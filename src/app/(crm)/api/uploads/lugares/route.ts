// src/app/(crm)/api/uploads/lugares/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Fichero no recibido' }, { status: 400 });
    }

    const orig = file.name || 'logo.png';
    const ext = orig.includes('.') ? orig.split('.').pop()!.toLowerCase() : 'png';
    const key = `lugares/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Sube a Vercel Blob (público)
    const { url } = await put(key, file, {
      access: 'public',
      addRandomSuffix: false,
      // Si tu proyecto requiere token explícito, descomenta:
      // token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error al subir' }, { status: 500 });
  }
}
