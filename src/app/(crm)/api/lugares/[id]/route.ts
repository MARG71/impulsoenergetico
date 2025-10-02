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

        // NUEVOS CAMPOS (landing especial)
        especial: true,
        especialLogoUrl: true,
        especialColor: true,
        especialMensaje: true,
        aportacionAcumulada: true,

        updatedAt: true,
      },
    });
    if (!lugar) return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });

    // Alias para la landing
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
// Body soportado (todos opcionales):
// {
//   nombre?, direccion?, qrCode?, agenteId?,
//   pctCliente?, pctLugar?,
//   especial?, logo?/especialLogoUrl?, color?/especialColor?,
//   mensajeCorto?/especialMensaje?, aportacionAcumulada?
// }
export async function PUT(req: Request, context: any) {
  try {
    const id = toId(context.params.id);
    const body = await req.json();

    const data: any = {};

    // Campos existentes
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

    // --- NUEVOS CAMPOS ESPECIALES ---
    const especial = toBool(body?.especial);
    if (especial !== undefined) data.especial = especial;

    // Acepta tanto 'logo' como 'especialLogoUrl'
    if (body?.logo !== undefined) data.especialLogoUrl = String(body.logo).trim();
    if (body?.especialLogoUrl !== undefined) data.especialLogoUrl = String(body.especialLogoUrl).trim();

    // 'color' o 'especialColor'
    if (body?.color !== undefined) data.especialColor = String(body.color).trim();
    if (body?.especialColor !== undefined) data.especialColor = String(body.especialColor).trim();

    // 'mensajeCorto' o 'especialMensaje'
    if (body?.mensajeCorto !== undefined) data.especialMensaje = String(body.mensajeCorto).trim();
    if (body?.especialMensaje !== undefined) data.especialMensaje = String(body.especialMensaje).trim();

    // aportación (entero en euros)
    const aport = toInt(body?.aportacionAcumulada);
    if (aport !== undefined) data.aportacionAcumulada = aport;

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

        updatedAt: true,
      },
    });

    // Alias también en respuesta
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

// -------- DELETE /api/lugares/:id --------
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
