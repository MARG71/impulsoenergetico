import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;

  if (!token || !role) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // helper: filtro ocultos para ADMIN
  const filtroOcultosAdmin = role === "ADMIN" ? { ocultoParaAdmin: false } : {};

  // SUPERADMIN / ADMIN: dashboard global (con filtro si ADMIN)
  if (role === "SUPERADMIN" || role === "ADMIN") {
    const [leads, comparativas, agentes, lugares] = await Promise.all([
      prisma.lead.findMany({
        orderBy: { creadoEn: "desc" },
        take: 300,
        include: { agente: { select: { id: true, nombre: true } }, lugar: { select: { id: true, nombre: true } } },
      }),
      prisma.comparativa.findMany({
        orderBy: { fecha: "desc" },
        take: 300,
        include: { cliente: { select: { id: true, nombre: true } }, agente: { select: { id: true, nombre: true } }, lugar: { select: { id: true, nombre: true } } },
      }),
      prisma.agente.findMany({ where: filtroOcultosAdmin as any }),
      prisma.lugar.findMany({ where: filtroOcultosAdmin as any }),
    ]);

    return NextResponse.json({
      role,
      data: { leads, comparativas, agentes, lugares },
    });
  }

  // AGENTE: solo lo suyo
  if (role === "AGENTE") {
    const agenteId = (token as any)?.agenteId ? Number((token as any).agenteId) : null;
    if (!agenteId) return NextResponse.json({ error: "Agente no asociado" }, { status: 400 });

    const [leads, comparativas, lugares] = await Promise.all([
      prisma.lead.findMany({
        where: { agenteId },
        orderBy: { creadoEn: "desc" },
        take: 300,
        include: { lugar: { select: { id: true, nombre: true } } },
      }),
      prisma.comparativa.findMany({
        where: { agenteId },
        orderBy: { fecha: "desc" },
        take: 300,
        include: { cliente: { select: { id: true, nombre: true } }, lugar: { select: { id: true, nombre: true } } },
      }),
      prisma.lugar.findMany({ where: { agenteId } }),
    ]);

    return NextResponse.json({
      role,
      data: { leads, comparativas, lugares },
    });
  }

  // LUGAR: solo lo suyo
  if (role === "LUGAR") {
    const lugarId = (token as any)?.lugarId ? Number((token as any).lugarId) : null;
    if (!lugarId) return NextResponse.json({ error: "Lugar no asociado" }, { status: 400 });

    const [leads, comparativas] = await Promise.all([
      prisma.lead.findMany({
        where: { lugarId },
        orderBy: { creadoEn: "desc" },
        take: 300,
      }),
      prisma.comparativa.findMany({
        where: { lugarId },
        orderBy: { fecha: "desc" },
        take: 300,
        include: { cliente: { select: { id: true, nombre: true } } },
      }),
    ]);

    return NextResponse.json({
      role,
      data: { leads, comparativas },
    });
  }

  return NextResponse.json({ error: "Rol no soportado" }, { status: 400 });
}
