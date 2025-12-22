import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const role = (token as any)?.role ?? null;

    if (!token || role !== "AGENTE") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const agenteId = (token as any)?.agenteId ? Number((token as any).agenteId) : null;
    if (!agenteId) {
      return NextResponse.json(
        { error: "No hay un agente asociado a este usuario" },
        { status: 400 }
      );
    }

    const agente = await prisma.agente.findUnique({
      where: { id: agenteId },
      include: {
        lugares: { orderBy: { creadoEn: "desc" } },
        qrs: true,
        leads: {
          orderBy: { creadoEn: "desc" },
          take: 50,
          include: { lugar: { select: { id: true, nombre: true } } },
        },
        comparativas: {
          orderBy: { fecha: "desc" },
          take: 50,
          include: {
            lugar: { select: { id: true, nombre: true } },
            cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
          },
        },
        contratos: { orderBy: { fechaAlta: "desc" }, take: 50 },
      },
    });

    if (!agente) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    const ahorroTotal = agente.comparativas.reduce((acc, c) => acc + (c.ahorro || 0), 0);
    const comisionTotal = agente.comparativas.reduce((acc, c) => acc + (c.comision || 0), 0);

    return NextResponse.json({
      agente: {
        id: agente.id,
        nombre: agente.nombre,
        email: agente.email,
        telefono: agente.telefono,
        creadoEn: agente.creadoEn,
      },
      lugares: agente.lugares,
      qrs: agente.qrs,
      leads: agente.leads,
      comparativas: agente.comparativas,
      contratos: agente.contratos,
      stats: {
        totalLugares: agente.lugares.length,
        totalLeads: agente.leads.length,
        totalComparativas: agente.comparativas.length,
        totalContratos: agente.contratos.length,
        ahorroTotal,
        comisionTotal,
      },
    });
  } catch (e) {
    console.error("[PANEL-AGENTE][GET]", e);
    return NextResponse.json({ error: "Error cargando panel agente" }, { status: 500 });
  }
}
