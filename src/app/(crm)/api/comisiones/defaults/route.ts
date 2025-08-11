// src/app/(crm)/api/comisiones/defaults/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper: normaliza porcentajes escritos como "15" (15%) o "0.15" (15%)
function toFrac(v: unknown) {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(',', '.'));
  if (Number.isNaN(n)) return undefined;
  // si el usuario mete 15 asumimos 15%
  return n > 1 ? n / 100 : n;
}

export async function GET() {
  // Devuelve el registro único; si no existe, lo crea con 0
  const existing = await prisma.globalComisionDefaults.findFirst();
  if (existing) {
    return NextResponse.json({
      ...existing,
      // Prisma Decimal -> number
      defaultPctCliente: Number(existing.defaultPctCliente),
      defaultPctLugar: Number(existing.defaultPctLugar),
      defaultPctAgente: Number(existing.defaultPctAgente),
    });
  }

  const created = await prisma.globalComisionDefaults.create({
    data: {
      defaultPctCliente: 0,
      defaultPctLugar: 0,
      defaultPctAgente: 0,
    },
  });

  return NextResponse.json({
    ...created,
    defaultPctCliente: Number(created.defaultPctCliente),
    defaultPctLugar: Number(created.defaultPctLugar),
    defaultPctAgente: Number(created.defaultPctAgente),
  });
}

export async function PUT(req: Request) {
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
      return NextResponse.json({ error: 'Valores inválidos' }, { status: 400 });
    }

    // Validaciones básicas
    if (pctCliente < 0 || pctCliente > 1) {
      return NextResponse.json({ error: 'pctCliente debe estar entre 0 y 1' }, { status: 400 });
    }
    if (pctLugar < 0 || pctLugar > 1) {
      return NextResponse.json({ error: 'pctLugar debe estar entre 0 y 1' }, { status: 400 });
    }
    if (pctAgente < 0 || pctAgente > 1) {
      return NextResponse.json({ error: 'pctAgente debe estar entre 0 y 1' }, { status: 400 });
    }

    // Recuerda: Cliente va sobre POOL; Lugar+Agente sobre REMANENTE → su suma debe ≤ 1
    if (pctLugar + pctAgente > 1) {
      return NextResponse.json({ error: 'pctLugar + pctAgente no puede exceder 1 (100% del remanente)' }, { status: 400 });
    }

    // upsert del único registro
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
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
