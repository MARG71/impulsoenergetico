import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";  // 👈 AQUÍ EL CAMBIO


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lugarIdParam = searchParams.get("lugarId");

    if (!lugarIdParam) {
      return NextResponse.json(
        { error: "Falta lugarId" },
        { status: 400 }
      );
    }

    const lugarId = Number(lugarIdParam);
    if (Number.isNaN(lugarId)) {
      return NextResponse.json(
        { error: "lugarId no válido" },
        { status: 400 }
      );
    }

    // 1) Leemos el lugar
    const lugar = await prisma.lugar.findUnique({
      where: { id: lugarId },
      select: { pctCliente: true },
    });

    // 2) Defaults globales
    const defaults = await prisma.globalComisionDefaults.findUnique({
      where: { id: 1 },
      select: { defaultPctCliente: true },
    });

    // pctCliente efectivo: primero lugar, si no hay → default, si no hay → 0
    const pct =
      (lugar?.pctCliente ?? defaults?.defaultPctCliente ?? 0) as any;

    const pctNumero = typeof pct === "number" ? pct : Number(pct);

    return NextResponse.json({
      pctCliente: pctNumero, // valor 0..1 (ej: 0.15 = 15%)
    });
  } catch (error) {
    console.error("Error en /api/comisiones/pct-cliente:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
