import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/comparativas/[id]
export async function GET(req: Request, ctx: any) {
  const id = ctx?.params?.id;

  const comparativaId = Number(id);

  if (!comparativaId) {
    return NextResponse.json({ error: "ID no válido" }, { status: 400 });
  }

  try {
    const comparativa = await prisma.comparativa.findUnique({
      where: { id: comparativaId },
      include: {
        cliente: true,
        agente: true,
        lugar: true,
        datosFactura: true,
        resultados: true,
      },
    });

    if (!comparativa) {
      return NextResponse.json(
        { error: "Comparativa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(comparativa);
  } catch (error) {
    console.error("Error al obtener comparativa:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
