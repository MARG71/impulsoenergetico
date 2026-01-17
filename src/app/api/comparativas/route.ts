import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// POST: Guardar nueva comparativa (pública desde el comparador)
export async function POST(request: Request) {
  const body = await request.json();
  const { cliente, agenteId, lugarId, datosFactura, resultados, tipo } = body;

  try {
    // ✅ Validaciones mínimas
    if (
      !cliente?.nombre ||
      !agenteId ||
      !lugarId ||
      !datosFactura ||
      !Array.isArray(resultados)
    ) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const agenteIdNum = Number(agenteId);
    const lugarIdNum = Number(lugarId);

    const email = String(cliente.email || "")
      .trim()
      .toLowerCase();
    const telefono = String(cliente.telefono || "").trim();

    // ✅ Resolver adminId (TENANT) desde Lugar (más fiable)
    const lugar = await prisma.lugar.findUnique({
      where: { id: lugarIdNum },
      select: { id: true, adminId: true },
    });

    if (!lugar) {
      return NextResponse.json({ error: "Lugar no válido" }, { status: 400 });
    }

    const adminId = lugar.adminId ?? null;

    // ✅ Tipo servicio
    const tipoServicio =
      tipo === "gas" ? "gas" : tipo === "telefonia" ? "telefonia" : "luz";

    // ✅ Crear o reutilizar cliente (solo si viene email; email es @unique)
    let clienteDb: { id: number; telefono: string | null; email: string | null } | null =
      null;

    if (email) {
      clienteDb = await prisma.cliente.findUnique({
        where: { email },
        select: { id: true, telefono: true, email: true },
      });
    }

    const nuevoCliente = clienteDb
      ? await prisma.cliente.update({
          where: { id: clienteDb.id },
          data: {
            nombre: String(cliente.nombre),
            direccion: String(cliente.direccion || ""),
            telefono: telefono || clienteDb.telefono,
            adminId,
          },
        })
      : await prisma.cliente.create({
          data: {
            nombre: String(cliente.nombre),
            direccion: String(cliente.direccion || ""),
            email: email || null, // Cliente.email es String?
            telefono: telefono || null, // Cliente.telefono es String?
            adminId,
          },
        });

    // ✅ Crear comparativa (con adminId)
    const nuevaComparativa = await prisma.comparativa.create({
      data: {
        clienteId: nuevoCliente.id,
        tipoServicio,
        tipoTarifa: String(datosFactura.tipoTarifa || ""),
        nombreTarifa: String(datosFactura.nombreTarifa || ""),
        consumoAnual: Number(datosFactura.consumoAnual || 0),
        importeFactura: Number(datosFactura.importeFactura || 0),
        agenteId: agenteIdNum,
        lugarId: lugarIdNum,
        adminId,
      },
    });

    // ✅ DatosFactura (en tu schema consumoPeriodos/potencias son String?)
    await prisma.datosFactura.create({
      data: {
        tipoCliente: datosFactura.tipoCliente || null,
        tipoTarifa: datosFactura.tipoTarifa || null,
        nombreTarifa: datosFactura.nombreTarifa || null,
        cups: datosFactura.cups || null,
        fechaInicio: datosFactura.fechaInicio || null,
        fechaFin: datosFactura.fechaFin || null,

        // 👇 stringify porque en schema son String?
        consumoPeriodos: JSON.stringify(datosFactura.consumoPeriodos || {}),
        potencias: JSON.stringify(datosFactura.potencias || {}),

        consumoAnualKWh: Number(datosFactura.consumoAnual || 0),
        importeFactura: Number(datosFactura.importeFactura || 0),

        iva: Number(datosFactura.iva || 0),
        impuestoElectricidad: Number(datosFactura.impuestoElectricidad || 0),
        territorio: datosFactura.territorio || null,
        reactiva: Number(datosFactura.reactiva || 0),
        exceso: Number(datosFactura.exceso || 0),
        alquiler: Number(datosFactura.alquiler || 0),
        otros: Number(datosFactura.otros || 0),

        comparativaId: nuevaComparativa.id,
      },
    });

    // ✅ Guardar resultados (schema: compañia, tarifa, precioAnual, ahorroEstimado)
    await prisma.resultadoComparativa.createMany({
      data: resultados.map((r: any) => ({
        comparativaId: nuevaComparativa.id,
        compañia: String(r?.compañia ?? r?.compania ?? r?.compañia ?? ""),
        tarifa: String(r?.tarifa ?? ""),
        precioAnual: Number(r?.coste) || 0,
        ahorroEstimado: Number(r?.ahorro) || 0,
      })),
    });

    // ✅ Guardar resumen (ahorro + comision) desde el "mejor" resultado
    const mejor = resultados?.[0];
    await prisma.comparativa.update({
      where: { id: nuevaComparativa.id },
      data: {
        ahorro: Number(mejor?.ahorro) || 0,
        comision: Number(mejor?.comision) || 0,
      },
    });

    // ✅ Auto-crear/actualizar Lead
    // Nota: en tu schema Lead.email y Lead.telefono son String (obligatorios)
    try {
      const leadEmail = email || "";
      const leadTel = telefono || "";

      // Construimos OR SIN undefined (esto quita las líneas rojas)
      const orLead: Prisma.LeadWhereInput[] = [];
      if (leadEmail) orLead.push({ email: leadEmail });
      if (leadTel) orLead.push({ telefono: leadTel });

      if (orLead.length > 0) {
        const leadExistente = await prisma.lead.findFirst({
          where: {
            adminId,
            agenteId: agenteIdNum,
            lugarId: lugarIdNum,
            OR: orLead,
          },
          orderBy: { id: "desc" },
        });

        if (leadExistente) {
          await prisma.lead.update({
            where: { id: leadExistente.id },
            data: {
              nombre: String(cliente.nombre || leadExistente.nombre),
              email: leadEmail || leadExistente.email,
              telefono: leadTel || leadExistente.telefono,
              estado: "comparativa",
              comparativaId: nuevaComparativa.id,
              proximaAccion: leadExistente.proximaAccion || "Llamar al cliente",
              proximaAccionEn:
                leadExistente.proximaAccionEn ||
                new Date(Date.now() + 2 * 60 * 60 * 1000),
              adminId,
            },
          });
        } else {
          await prisma.lead.create({
            data: {
              nombre: String(cliente.nombre || "Sin nombre"),
              email: leadEmail, // obligatorio
              telefono: leadTel, // obligatorio
              estado: "comparativa",
              agenteId: agenteIdNum,
              lugarId: lugarIdNum,
              comparativaId: nuevaComparativa.id,
              proximaAccion: "Llamar al cliente",
              proximaAccionEn: new Date(Date.now() + 2 * 60 * 60 * 1000),
              adminId,
            },
          });
        }
      }
    } catch (e) {
      console.warn("No se pudo crear/actualizar el lead automático:", e);
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

// GET (público) — ojo: para CRM haremos endpoints protegidos por rol
export async function GET() {
  try {
    const comparativas = await prisma.comparativa.findMany({
      orderBy: { id: "desc" },
      include: {
        cliente: true,
        agente: true,
        lugar: true,
        datosFactura: true,
        resultados: true,
      },
      take: 200,
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
