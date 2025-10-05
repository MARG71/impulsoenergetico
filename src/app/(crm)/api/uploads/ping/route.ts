export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function GET() {
  try {
    const options: any = { access: 'public', addRandomSuffix: false, contentType: 'text/plain' };
    if (process.env.BLOB_READ_WRITE_TOKEN) options.token = process.env.BLOB_READ_WRITE_TOKEN;

    const key = `tests/ping-${Date.now()}.txt`;
    const { url } = await put(key, `ok ${new Date().toISOString()}\n`, options);
    return NextResponse.json({ ok: true, url, key });
  } catch (e: any) {
    console.error('PING error /api/uploads/ping:', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
