import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const role = (token as any).role as Rol | undefined;
    const agenteId = (token as any).agenteId ? Number((token as any).agenteId) : null;
    const lugarId = (token as any).lugarId ? Number((token as any).lugarId) : null;

    const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
    const take = 200;

    const base = {
      role,
      user: {
        id: (token as any).id ?? null,
        name: (token as any).name ?? null,
        email: (token as any).email ?? null,
        agenteId,
        lugarId,
      },
    };

    // ✅ ADMIN / SUPERADMIN: ve todo
    if (isAdmin) {
      const [comparativas, agentes, lugares, leads, ofertas] = await Promise.all([
        prisma.comparativa.findMany({
          orderBy: { fecha: "desc" },
          take,
          include: {
            cliente: true,
            agente: { select: { id: true, nombre: true, email: true, telefono: true } },
            lugar: { select: { id: true, nombre: true, direccion: true } },
          },
        }),
        prisma.agente.findMany({
          orderBy: { id: "asc" },
          select: { id: true, nombre: true, email: true, telefono: true },
        }),
        prisma.lugar.findMany({
          orderBy: { id: "asc" },
          include: { agente: { select: { id: true, nombre: true } } },
        }),
        prisma.lead.findMany({
          orderBy: { creadoEn: "desc" },
          take,
          include: {
            agente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true } },
          },
        }),
        prisma.oferta.findMany({
          orderBy: { creadaEn: "desc" },
          take: 50,
        }),
      ]);

      return NextResponse.json({ ...base, comparativas, agentes, lugares, leads, ofertas });
    }

    // ✅ AGENTE: SOLO lo suyo
    if (role === "AGENTE") {
      if (!agenteId) {
        return NextResponse.json(
          { ...base, error: "Este usuario AGENTE no tiene agenteId asociado" },
          { status: 400 }
        );
      }

      const [comparativas, lugares, leads, ofertas, agente] = await Promise.all([
        prisma.comparativa.findMany({
          where: { agenteId },
          orderBy: { fecha: "desc" },
          take,
          include: {
            cliente: true,
            agente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true, direccion: true } },
          },
        }),
        prisma.lugar.findMany({
          where: { agenteId },
          orderBy: { id: "asc" },
        }),
        prisma.lead.findMany({
          where: { agenteId },
          orderBy: { creadoEn: "desc" },
          take,
          include: {
            agente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true } },
          },
        }),
        prisma.oferta.findMany({
          where: { activa: true },
          orderBy: { creadaEn: "desc" },
          take: 50,
        }),
        prisma.agente.findUnique({
          where: { id: agenteId },
          select: { id: true, nombre: true, email: true, telefono: true },
        }),
      ]);

      return NextResponse.json({
        ...base,
        comparativas,
        lugares,
        leads,
        ofertas,
        agentes: agente ? [agente] : [],
      });
    }

    // ✅ LUGAR: SOLO lo suyo (y su agente)
    if (role === "LUGAR") {
      if (!lugarId) {
        return NextResponse.json(
          { ...base, error: "Este usuario LUGAR no tiene lugarId asociado" },
          { status: 400 }
        );
      }

      const lugar = await prisma.lugar.findUnique({
        where: { id: lugarId },
        include: {
          agente: { select: { id: true, nombre: true, email: true, telefono: true } },
        },
      });

      const [comparativas, leads, ofertas] = await Promise.all([
        prisma.comparativa.findMany({
          where: { lugarId },
          orderBy: { fecha: "desc" },
          take,
          include: {
            cliente: true,
            agente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true } },
          },
        }),
        prisma.lead.findMany({
          where: { lugarId },
          orderBy: { creadoEn: "desc" },
          take,
          include: {
            agente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true } },
          },
        }),
        prisma.oferta.findMany({
          where: { activa: true },
          orderBy: { creadaEn: "desc" },
          take: 50,
        }),
      ]);

      return NextResponse.json({
        ...base,
        lugar,
        lugares: lugar ? [lugar] : [],
        comparativas,
        leads,
        ofertas,
        agentes: lugar?.agente ? [lugar.agente] : [],
      });
    }

    return NextResponse.json({ ...base, error: "Rol no reconocido" }, { status: 403 });
  } catch (err) {
    console.error("[API][dashboard] error:", err);
    return NextResponse.json({ error: "Error cargando dashboard" }, { status: 500 });
  }
}
