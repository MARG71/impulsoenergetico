// src/app/(crm)/api/comisiones/defaults/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// Convierte "15" -> 0.15 y "0,15" -> 0.15
function toFrac(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(',', '.'));
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n;
}

async function ensureAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || (token as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const guard = await ensureAdmin(req);
  if (guard) return guard;

  // Único registro con id=1
  const existing = await prisma.globalComisionDefaults.findUnique({ where: { id: 1 } });

  if (existing) {
    return NextResponse.json({
      ...existing,
      defaultPctCliente: Number(existing.defaultPctCliente),
      defaultPctLugar: Number(existing.defaultPctLugar),
      defaultPctAgente: Number(existing.defaultPctAgente),
    });
  }

  const created = await prisma.globalComisionDefaults.create({
    data: { id: 1, defaultPctCliente: 0, defaultPctLugar: 0, defaultPctAgente: 0 },
  });

  return NextResponse.json({
    ...created,
    defaultPctCliente: Number(created.defaultPctCliente),
    defaultPctLugar: Number(created.defaultPctLugar),
    defaultPctAgente: Number(created.defaultPctAgente),
  });
}

export async function PUT(req: NextRequest) {
  const guard = await ensureAdmin(req);
  if (guard) return guard;

  try {
    const body = await req.json();

    const pctCliente = toFrac(body.defaultPctCliente);
    const pctLugar   = toFrac(body.defaultPctLugar);
    const pctAgente  = toFrac(body.defaultPctAgente);

    if (
      pctCliente === undefined ||
      pctLugar   === undefined ||
      pctAgente  === undefined
    ) {
      return NextResponse.json({ error: 'Valores inválidos (usa 0..1 o 0..100%)' }, { status: 400 });
    }

    if (pctCliente < 0 || pctCliente > 1) {
      return NextResponse.json({ error: 'pctCliente debe estar entre 0 y 1' }, { status: 400 });
    }
    if (pctLugar < 0 || pctLugar > 1) {
      return NextResponse.json({ error: 'pctLugar debe estar entre 0 y 1' }, { status: 400 });
    }
    if (pctAgente < 0 || pctAgente > 1) {
      return NextResponse.json({ error: 'pctAgente debe estar entre 0 y 1' }, { status: 400 });
    }
    // Lugar + Agente se aplican sobre el remanente
    if (pctLugar + pctAgente > 1) {
      return NextResponse.json({ error: 'pctLugar + pctAgente no puede exceder 1 (100% del remanente)' }, { status: 400 });
    }

    const saved = await prisma.globalComisionDefaults.upsert({
      where: { id: 1 },
      update: {
        defaultPctCliente: pctCliente,
        defaultPctLugar: pctLugar,
        defaultPctAgente: pctAgente,
      },
      create: {
        id: 1,
        defaultPctCliente: pctCliente,
        defaultPctLugar: pctLugar,
        defaultPctAgente: pctAgente,
      },
    });

    return NextResponse.json({
      ...saved,
      defaultPctCliente: Number(saved.defaultPctCliente),
      defaultPctLugar: Number(saved.defaultPctLugar),
      defaultPctAgente: Number(saved.defaultPctAgente),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
