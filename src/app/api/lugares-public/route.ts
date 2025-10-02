// Ping para verificar que el directorio /api/lugares-public existe en producción
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, hint: 'llegas a /api/lugares-public' });
}
