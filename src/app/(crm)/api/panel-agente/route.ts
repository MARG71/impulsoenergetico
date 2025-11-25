// src/app/(crm)/api/panel-agente/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.role) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const rol = (session.user as any).role;
    if (rol !== "AGENTE") {
      return NextResponse.json(
        { error: "Solo los agentes pueden ver este panel" },
        { status: 403 }
      );
    }

    const agenteId = Number((session.user as any).agenteId);
    if (!agenteId) {
      return NextResponse.json(
        { error: "No hay un agente asociado a este usuario" },
        { status: 400 }
      );
    }

    // Datos completos del agente
    const agente = await prisma.agente.findUnique({
      where: { id: agenteId },
      include: {
        lugares: {
          orderBy: { creadoEn: "desc" },
        },
        leads: {
          orderBy: { creadoEn: "desc" },
          take: 50,
          include: {
            lugar: true,
          },
        },
        comparativas: {
          orderBy: { fecha: "desc" },
          take: 50,
          include: {
            cliente: true,
            lugar: true,
          },
        },
      },
    });

    if (!agente) {
      return NextResponse.json(
        { error: "Agente no encontrado" },
        { status: 404 }
      );
    }

    // Estadísticas rápidas
    const totalComparativas = await prisma.comparativa.count({
      where: { agenteId },
    });

    const agg = await prisma.comparativa.aggregate({
      where: { agenteId },
      _sum: {
        ahorro: true,
        comision: true,
      },
    });

    const stats = {
      totalComparativas,
      ahorroTotal: agg._sum.ahorro || 0,
      comisionTotal: agg._sum.comision || 0,
      totalLeads: agente.leads.length,
      totalLugares: agente.lugares.length,
    };

    return NextResponse.json({ agente, stats });
  } catch (error) {
    console.error("Error en panel-agente:", error);
    return NextResponse.json(
      { error: "Error interno en el panel del agente" },
      { status: 500 }
    );
  }
}
