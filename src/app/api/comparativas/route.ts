import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Guardar nueva comparativa
export async function POST(request: Request) {
  const body = await request.json();

  const {
    cliente,
    agenteId,
    lugarId,
    datosFactura,
    resultados,
    tipo,      // "luz" | "gas" | "telefonia" (viene de tu comparador)
    ofertaId,  // opcional
  } = body;

  try {
    // Validaciones mínimas
    if (!cliente?.nombre || !agenteId || !lugarId || !datosFactura || !Array.isArray(resultados)) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const email = (cliente.email || "").trim().toLowerCase();
    const telefono = (cliente.telefono || "").trim();

    // 1) Crear o reutilizar cliente (si viene email o teléfono)
    let clienteExistente = null as any;

    if (email || telefono) {
      clienteExistente = await prisma.cliente.findFirst({
        where: {
          OR: [
            email ? { email } : undefined,
            telefono ? { telefono } : undefined,
          ].filter(Boolean) as any,
        },
        orderBy: { id: "desc" },
      });
    }

    const nuevoCliente = clienteExistente
      ? await prisma.cliente.update({
          where: { id: clienteExistente.id },
          data: {
            nombre: cliente.nombre,
            direccion: cliente.direccion || "",
            email: email || clienteExistente.email,
            telefono: telefono || clienteExistente.telefono,
          },
        })
      : await prisma.cliente.create({
          data: {
            nombre: cliente.nombre,
            direccion: cliente.direccion || "",
            email: email || null,
            telefono: telefono || null,
          },
        });

    // 2) Crear comparativa
    const tipoServicio =
      tipo === "gas" ? "gas" : tipo === "telefonia" ? "telefonia" : "luz";

    const nuevaComparativa = await prisma.comparativa.create({
      data: {
        tipoServicio, // en tu DB ya usas 'luz' fijo, ahora será dinámico
        tipoTarifa: datosFactura.tipoTarifa,
        nombreTarifa: datosFactura.nombreTarifa,
        consumoAnual: parseFloat(datosFactura.consumoAnual || "0"),
        importeFactura: parseFloat(datosFactura.importeFactura || "0"),
        clienteId: nuevoCliente.id,
        agenteId: Number(agenteId),
        lugarId: Number(lugarId),
        ofertaId: ofertaId ? Number(ofertaId) : null, // si tu modelo lo tiene
      } as any,
    });

    // 3) Datos factura
    await prisma.datosFactura.create({
      data: {
        tipoCliente: datosFactura.tipoCliente,
        tipoTarifa: datosFactura.tipoTarifa,
        nombreTarifa: datosFactura.nombreTarifa,
        cups: datosFactura.cups || "",
        fechaInicio: datosFactura.fechaInicio || "",
        fechaFin: datosFactura.fechaFin || "",
        consumoPeriodos: datosFactura.consumoPeriodos || {},
        potencias: datosFactura.potencias || {},
        consumoAnualKWh: parseFloat(datosFactura.consumoAnual || "0"),

        iva: parseFloat(datosFactura.iva || "0"),
        impuestoElectricidad: parseFloat(datosFactura.impuestoElectricidad || "0"),
        territorio: datosFactura.territorio || "peninsula",
        reactiva: parseFloat(datosFactura.reactiva || "0"),
        exceso: parseFloat(datosFactura.exceso || "0"),
        alquiler: parseFloat(datosFactura.alquiler || "0"),
        otros: parseFloat(datosFactura.otros || "0"),

        comparativaId: nuevaComparativa.id,
      },
    });

    // 4) Resultados
    await prisma.resultadoComparativa.createMany({
      data: resultados.map((r: any) => ({
        compañia: r.compañia,
        tarifa: r.tarifa,
        coste: Number(r.coste) || 0,
        ahorro: Number(r.ahorro) || 0,
        ahorroPct: Number(r.ahorroPct) || 0,
        comision: Number(r.comision) || 0,
        comparativaId: nuevaComparativa.id,
      })),
    });

    // ✅ 5) AUTO-LINK con Lead (si existe por email/teléfono + agente/lugar)
    // (Si tu modelo Lead NO tiene comparativaId, dime tu schema y lo ajusto)
    try {
      if (email || telefono) {
        const lead = await prisma.lead.findFirst({
          where: {
            agenteId: Number(agenteId),
            lugarId: Number(lugarId),
            OR: [
              email ? { email } : undefined,
              telefono ? { telefono } : undefined,
            ].filter(Boolean) as any,
          },
          orderBy: { id: "desc" },
        });

        if (lead) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              comparativaId: nuevaComparativa.id,
              estado: lead.estado || "comparativa",
              proximaAccion: "Llamar al cliente",
              proximaAccionEn: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2h
            } as any,
          });
        }
      }
    } catch (e) {
      console.warn("No se pudo enlazar lead con comparativa:", e);
      // No rompemos el guardado por esto
    }

    return NextResponse.json(
      { message: "Comparativa guardada", comparativaId: nuevaComparativa.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al guardar la comparativa:", error);
    return NextResponse.json(
      { error: "Error al guardar la comparativa" },
      { status: 500 }
    );
  }
}

// GET: Obtener las comparativas más recientes
export async function GET() {
  try {
    const comparativas = await prisma.comparativa.findMany({
      orderBy: { id: "desc" },
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
    console.error("Error al obtener comparativas:", error);
    return NextResponse.json(
      { error: "Error al obtener comparativas" },
      { status: 500 }
    );
  }
}
