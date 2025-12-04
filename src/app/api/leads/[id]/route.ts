// src/app/api/leads/[id]/route.ts
// src/app/api/leads/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

// Obtener un lead concreto (para la ficha /leads/[id])
export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const id = Number(context.params.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "ID de lead no válido" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        agente: true,
        lugar: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error GET /api/leads/[id]:", error);
    return NextResponse.json(
      { error: "Error interno al cargar el lead" },
      { status: 500 }
    );
  }
}

// Actualizar estado (y en el futuro más cosas)
export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const rol =
      (session.user as any).rol ?? (session.user as any).role ?? null;

    // Permitimos ADMIN y AGENTE cambiar el estado
    if (rol !== "ADMIN" && rol !== "AGENTE") {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar este lead" },
        { status: 403 }
      );
    }

    const id = Number(context.params.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "ID de lead no válido" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const { estado } = body as { estado?: string };

    const dataUpdate: any = {};

    if (estado) {
      dataUpdate.estado = estado;
    }

    if (Object.keys(dataUpdate).length === 0) {
      return NextResponse.json(
        { error: "No hay datos para actualizar" },
        { status: 400 }
      );
    }

    const leadActualizado = await prisma.lead.update({
      where: { id },
      data: dataUpdate,
      include: {
        agente: true,
        lugar: true,
      },
    });

    return NextResponse.json(leadActualizado);
  } catch (error) {
    console.error("Error PATCH /api/leads/[id]:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar el lead" },
      { status: 500 }
    );
  }
}
