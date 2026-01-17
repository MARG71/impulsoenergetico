import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const idStr = req.nextUrl.pathname.split("/").slice(-2)[0]; // .../leads/[id]/actividades
    const leadId = Number(idStr);

    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    }

    const actividades = await prisma.leadActividad.findMany({
      where: { leadId },
      orderBy: { creadoEn: "desc" },
      take: 200,
    });

    return NextResponse.json({ items: actividades });
  } catch (e) {
    console.error("GET actividades lead error:", e);
    return NextResponse.json({ error: "Error obteniendo actividades" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const idStr = req.nextUrl.pathname.split("/").slice(-2)[0]; // .../leads/[id]/actividades
    const leadId = Number(idStr);

    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const tipo = String(body?.tipo || "nota");
    const titulo = String(body?.titulo || "Actividad");
    const detalle = body?.detalle ? String(body.detalle) : null;

    // Intentamos resolver adminId desde el Lead (para trazabilidad multi-tenant)
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, adminId: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    const created = await prisma.leadActividad.create({
      data: {
        leadId,
        tipo,
        titulo,
        detalle,
        adminId: lead.adminId ?? null,
        // usuarioId: aquí lo añadimos en el siguiente paso cuando lo leamos de sesión
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("POST actividades lead error:", e);
    return NextResponse.json({ error: "Error creando actividad" }, { status: 500 });
  }
}
