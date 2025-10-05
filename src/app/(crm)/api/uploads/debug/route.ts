export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    node: process.version,
    onVercel: !!process.env.VERCEL,
    now: new Date().toISOString(),
  });
}
