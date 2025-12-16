import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const role = (token as any)?.role ?? (token as any)?.rol ?? null;
    if (!token || role !== "AGENTE") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const agenteId = (token as any)?.agenteId ? Number((token as any).agenteId) : null;
    const usuarioId = (token as any)?.id ? Number((token as any).id) : null;

    if (!agenteId) {
      return NextResponse.json(
        { error: "No hay un agente asociado a este usuario" },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) },
      select: { id: true, nombre: true, email: true, rol: true },
    });

    const agente = await prisma.agente.findUnique({
      where: { id: agenteId },
      include: {
        lugares: { orderBy: { creadoEn: "desc" } },
        qrs: true,
        leads: {
          orderBy: { creadoEn: "desc" },
          take: 40,
          include: { lugar: { select: { id: true, nombre: true } } },
        },
        comparativas: {
          orderBy: { fecha: "desc" },
          take: 40,
          include: {
            lugar: { select: { id: true, nombre: true } },
            cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
          },
        },
        contratos: { orderBy: { fechaAlta: "desc" }, take: 40 },
      },
    });

    if (!agente) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    const totalLugares = agente.lugares.length;
    const totalLeads = agente.leads.length;
    const totalComparativas = agente.comparativas.length;

    const ahorroTotal = agente.comparativas.reduce((acc, c) => acc + (c.ahorro || 0), 0);
    const comisionTotal = agente.comparativas.reduce((acc, c) => acc + (c.comision || 0), 0);

    // “Clientes” cerrados: puedes definirlo por contratos, o por leads con estado CERRADO
    const totalContratos = agente.contratos.length;

    return NextResponse.json({
      usuario,
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
        totalLugares,
        totalLeads,
        totalComparativas,
        totalContratos,
        ahorroTotal,
        comisionTotal,
      },
    });
  } catch (error) {
    console.error("[PANEL-AGENTE][GET] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar el panel del agente" },
      { status: 500 }
    );
  }
}
