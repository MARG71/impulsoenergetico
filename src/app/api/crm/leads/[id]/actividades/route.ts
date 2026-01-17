import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const leadId = Number(params.id);

  const actividades = await prisma.leadActividad.findMany({
    where: { leadId },
    orderBy: { creadoEn: "desc" },
    include: {
      usuario: { select: { nombre: true } },
    },
  });

  return NextResponse.json(actividades);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const leadId = Number(params.id);
  const body = await req.json();

  const actividad = await prisma.leadActividad.create({
    data: {
      leadId,
      tipo: body.tipo,
      titulo: body.titulo,
      detalle: body.detalle || null,
      usuarioId: (session.user as any).id,
      adminId: (session.user as any).adminId,
    },
  });

  return NextResponse.json(actividad, { status: 201 });
}
