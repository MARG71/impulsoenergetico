import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // 👈 CLAVE para que Prisma vaya en producción

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo"); // 'LUZ'|'GAS'|'TELEFONIA'
    const subtipo = searchParams.get("subtipo"); // '2.0TD'|'3.0TD'|'6.1TD'
    const activa = searchParams.get("activa"); // 'true'|'false'|null

    const where: any = {};
    if (tipo) where.tipo = tipo as any;
    if (subtipo) where.subtipo = subtipo;
    if (activa === "true") where.activa = true;
    if (activa === "false") where.activa = false;

    const items = await prisma.ofertaTarifa.findMany({
      where,
      include: {
        tramos: {
          where: { activo: true },
          orderBy: { consumoDesdeKWh: "asc" },
        },
      },
      orderBy: { creadaEn: "desc" },
    });

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("GET /api/ofertas-tarifas error:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = await prisma.ofertaTarifa.create({
      data: {
        tipo: body.tipo, // 'LUZ' | 'GAS' | 'TELEFONIA'
        subtipo: body.subtipo, // '2.0TD' | '3.0TD' | '6.1TD'
        compania: body.compania,
        anexoPrecio: body.anexoPrecio,
        nombre: body.nombre,
        descripcion: body.descripcion,
        activa: body.activa ?? true,
        destacada: body.destacada ?? false,
        precioKwhP1: body.precioKwhP1,
        precioKwhP2: body.precicioKwhP2,
        precioKwhP3: body.precioKwhP3,
        precioKwhP4: body.precioKwhP4,
        precioKwhP5: body.precioKwhP5,
        precioKwhP6: body.precioKwhP6,
        comisionKwhAdminBase: body.comisionKwhAdminBase,
        payload: body.payload ?? null,
      },
    });
    return NextResponse.json({ item });
  } catch (err: any) {
    console.error("POST /api/ofertas-tarifas error:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id") || 0);
    if (!id) {
      return NextResponse.json(
        { error: "id requerido" },
        { status: 400 }
      );
    }
    await prisma.ofertaTarifa.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/ofertas-tarifas error:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}
