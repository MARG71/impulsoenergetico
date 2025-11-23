// src/app/api/zona-lugar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // 👉 Solo usuarios logueados con rol LUGAR
    if (!token || token.role !== "LUGAR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lugarId = token.lugarId as number | null | undefined;
    const usuarioId = token.id as number | null | undefined;

    if (!lugarId) {
      return NextResponse.json(
        { error: "No hay un lugar asociado a este usuario" },
        { status: 400 }
      );
    }

    // 🔹 Cargamos usuario + lugar + agente + comparativas + leads
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
      },
    });

    const lugar = await prisma.lugar.findUnique({
      where: { id: lugarId },
      include: {
        agente: {
          select: { id: true, nombre: true, email: true, telefono: true },
        },
        comparativas: {
          orderBy: { fecha: "desc" },
          take: 20,
        },
        leads: {
          orderBy: { creadoEn: "desc" },
          take: 20,
          include: {
            agente: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
    });

    if (!lugar) {
      return NextResponse.json(
        { error: "Lugar no encontrado" },
        { status: 404 }
      );
    }

    // 🔢 Pequeñas estadísticas
    const totalComparativas = lugar.comparativas.length;
    const ahorroTotal = lugar.comparativas.reduce(
      (acc, c) => acc + (c.ahorro || 0),
      0
    );
    const comisionTotal = lugar.comparativas.reduce(
      (acc, c) => acc + (c.comision || 0),
      0
    );

    return NextResponse.json({
      usuario,
      lugar: {
        id: lugar.id,
        nombre: lugar.nombre,
        direccion: lugar.direccion,
        creadoEn: lugar.creadoEn,
      },
      agente: lugar.agente,
      comparativas: lugar.comparativas,
      leads: lugar.leads,
      stats: {
        totalComparativas,
        ahorroTotal,
        comisionTotal,
      },
    });
  } catch (error) {
    console.error("[ZONA-LUGAR][GET] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar la zona del lugar" },
      { status: 500 }
    );
  }
}
