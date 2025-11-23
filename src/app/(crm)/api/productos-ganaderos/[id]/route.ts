// src/app/(crm)/api/productos-ganaderos/[id]/route.ts
// src/app/(crm)/api/productos-ganaderos/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

// 🔹 Actualizar producto ganadero (solo ADMIN)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Forzamos tipo any para que TS no se queje en build
    const session = (await getServerSession(authOptions)) as any;

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const id = params.id;

    const body = await req.json();
    const {
      nombre,
      descripcion,
      categoria,
      precioCoste,
      margen,
      precioPVP,
      descuento,
      precioFinal,
      imagenUrl,
      activo,
    } = body;

    const producto = await prisma.productoGanadero.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        categoria,
        precioCoste,
        margen,
        precioPVP,
        descuento,
        precioFinal,
        imagenUrl,
        activo,
      },
    });

    return NextResponse.json({ ok: true, producto });
  } catch (error) {
    console.error("[PATCH /api/productos-ganaderos/[id]]", error);
    return NextResponse.json(
      { error: "Error al actualizar el producto" },
      { status: 500 }
    );
  }
}

// 🔹 Borrar producto ganadero (solo ADMIN)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const id = params.id;

    await prisma.productoGanadero.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/productos-ganaderos/[id]]", error);
    return NextResponse.json(
      { error: "Error al eliminar el producto" },
      { status: 500 }
    );
  }
}
