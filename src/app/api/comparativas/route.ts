import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Guardar nueva comparativa
export async function POST(request: Request) {
  const body = await request.json();
  const { cliente, agenteId, lugarId, datosFactura, resultados } = body;

  try {
    // 1. Crear cliente
    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre: cliente.nombre,
        direccion: cliente.direccion,
      },
    });

    // 2. Crear comparativa
    const nuevaComparativa = await prisma.comparativa.create({
      data: {
        tipoServicio: 'luz',
        tipoTarifa: datosFactura.tipoTarifa,
        nombreTarifa: datosFactura.nombreTarifa,
        consumoAnual: parseFloat(datosFactura.consumoAnual),
        importeFactura: parseFloat(datosFactura.importeFactura),
        clienteId: nuevoCliente.id,
        agenteId,
        lugarId,
      },
    });

    // 3. Crear datos de la factura
    await prisma.datosFactura.create({
      data: {
        tipoCliente: datosFactura.tipoCliente,
        tipoTarifa: datosFactura.tipoTarifa,
        nombreTarifa: datosFactura.nombreTarifa,
        cups: datosFactura.cups || '',
        fechaInicio: datosFactura.fechaInicio || '',
        fechaFin: datosFactura.fechaFin || '',
        consumoPeriodos: datosFactura.consumoPeriodos,
        potencias: datosFactura.potencias,
        consumoAnualKWh: parseFloat(datosFactura.consumoAnual),

        importeFactura: parseFloat(datosFactura.importeFactura),
        iva: parseFloat(datosFactura.iva),
        impuestoElectricidad: parseFloat(datosFactura.impuestoElectricidad),
        territorio: datosFactura.territorio,
        reactiva: parseFloat(datosFactura.reactiva || '0'),
        exceso: parseFloat(datosFactura.exceso || '0'),
        alquiler: parseFloat(datosFactura.alquiler || '0'),
        otros: parseFloat(datosFactura.otros || '0'),
        comparativaId: nuevaComparativa.id,
      },
    });

    // 4. Crear resultados de la comparativa
    await prisma.resultadoComparativa.createMany({
      data: resultados.map((r: any) => ({
        compañia: r.compañia,
        tarifa: r.tarifa,
        coste: r.coste,
        ahorro: r.ahorro,
        ahorroPct: r.ahorroPct,
        comision: r.comision,
        comparativaId: nuevaComparativa.id,
      })),
    });

    return NextResponse.json({ message: 'Comparativa guardada' }, { status: 201 });

  } catch (error) {
    console.error('Error al guardar la comparativa:', error);
    return NextResponse.json({ error: 'Error al guardar la comparativa' }, { status: 500 });
  }
}

// GET: Obtener las comparativas más recientes
export async function GET() {
  try {
    const comparativas = await prisma.comparativa.findMany({
      orderBy: { id: 'desc' },
      include: {
        cliente: true,
        datosFactura: true,
        resultados: true,
        agente: true,
        lugar: true,
      },
    });

    return NextResponse.json(comparativas);
  } catch (error) {
    console.error('Error al obtener comparativas:', error);
    return NextResponse.json({ error: 'Error al obtener comparativas' }, { status: 500 });
  }
}

