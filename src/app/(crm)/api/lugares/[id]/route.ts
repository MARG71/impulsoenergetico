import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Normaliza % a [0..1] aceptando 0-1 o 0-100
const toPct = (v: any) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  const p = n > 1 ? n / 100 : n;
  return Math.max(0, Math.min(1, p));
};

function toId(v: string) {
  const id = Number(v);
  if (Number.isNaN(id)) throw new Error('ID inválido');
  return id;
}

const toBool = (v: any) => {
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'si', 'sí'].includes(s)) return true;
    if (['false', '0', 'no'].includes(s)) return false;
  }
  return undefined;
};

const toInt = (v: any) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  return Math.max(0, Math.floor(n));
};

// Normaliza strings: undefined -> undefined (no tocar), '' -> null, resto -> "texto"
const cleanStr = (v: any) => {
  if (v === undefined) return undefined;
  const s = String(v).trim();
  return s === '' ? null : s;
};

// -------- GET /api/lugares/:id --------
export async function GET(_req: Request, context: any) {
  try {
    const id = toId(context.params.id);
    const lugar = await prisma.lugar.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        qrCode: true,
        agenteId: true,
        pctLugar: true,
        pctCliente: true,
        agente: { select: { id: true, nombre: true, email: true } },

        // ---- ESPECIALES ----
        especial: true,
        especialLogoUrl: true,
        especialColor: true,
        especialMensaje: true,
        aportacionAcumulada: true,
        especialCartelUrl: true,

        updatedAt: true,
      },
    });
    if (!lugar) return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });

    const out = {
      ...lugar,
      logo: lugar.especialLogoUrl ?? null,
      color: lugar.especialColor ?? null,
      mensajeCorto: lugar.especialMensaje ?? null,
    };
    return NextResponse.json(out);
  } catch (error: any) {
    const msg = error?.message ?? 'Error al obtener lugar';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// -------- PUT /api/lugares/:id --------
export async function PUT(req: Request, context: any) {
  try {
    const id = toId(context.params.id);
    const body = await req.json();

    const data: any = {};

    // Campos base
    if (body?.nombre !== undefined) data.nombre = String(body.nombre).trim();
    if (body?.direccion !== undefined) data.direccion = String(body.direccion).trim();
    if (body?.qrCode !== undefined) data.qrCode = String(body.qrCode).trim();

    if (body?.agenteId !== undefined) {
      const agenteId = Number(body.agenteId);
      if (Number.isNaN(agenteId)) {
        return NextResponse.json({ error: 'agenteId inválido' }, { status: 400 });
      }
      const agente = await prisma.agente.findUnique({ where: { id: agenteId } });
      if (!agente) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
      data.agenteId = agenteId;
    }

    if (body?.pctCliente !== undefined) data.pctCliente = toPct(body.pctCliente);
    if (body?.pctLugar !== undefined) data.pctLugar = toPct(body.pctLugar);

    // ---- ESPECIALES ----
    const especial = toBool(body?.especial);
    if (especial !== undefined) data.especial = especial;

    if (body?.especialLogoUrl !== undefined) data.especialLogoUrl = cleanStr(body.especialLogoUrl);
    if (body?.especialColor !== undefined) data.especialColor = cleanStr(body.especialColor);
    if (body?.especialMensaje !== undefined) data.especialMensaje = cleanStr(body.especialMensaje);

    const aport = toInt(body?.aportacionAcumulada);
    if (aport !== undefined) data.aportacionAcumulada = aport;

    // ** NUEVO: cartel especial **
    if (body?.especialCartelUrl !== undefined) {
      data.especialCartelUrl = cleanStr(body.especialCartelUrl); // '' -> null
    }

    const updated = await prisma.lugar.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        direccion: true,
        qrCode: true,
        agenteId: true,
        pctLugar: true,
        pctCliente: true,
        agente: { select: { id: true, nombre: true, email: true } },

        especial: true,
        especialLogoUrl: true,
        especialColor: true,
        especialMensaje: true,
        aportacionAcumulada: true,
        especialCartelUrl: true,

        updatedAt: true,
      },
    });

    const out = {
      ...updated,
      logo: updated.especialLogoUrl ?? null,
      color: updated.especialColor ?? null,
      mensajeCorto: updated.especialMensaje ?? null,
    };
    return NextResponse.json(out);
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    if (error?.code === 'P2002') return NextResponse.json({ error: 'qrCode ya existe' }, { status: 409 });
    const msg = error?.message ?? 'Error al actualizar lugar';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// -------- DELETE --------
export async function DELETE(_req: Request, context: any) {
  try {
    const id = toId(context.params.id);
    await prisma.lugar.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    const msg = error?.message ?? 'Error al eliminar lugar';
    const status = msg.includes('ID inválido') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
