// src/app/(crm)/api/panel-agente/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // En tu proyecto a veces se usa `rol` y otras `role` → leemos ambos
    const rol =
      (session.user as any).rol ?? (session.user as any).role ?? null;

    if (!rol) {
      return NextResponse.json(
        { error: "No se ha encontrado el rol del usuario" },
        { status: 401 }
      );
    }

    // ✅ Permitimos AGENTE y ADMIN
    if (rol !== "AGENTE" && rol !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Solo usuarios con rol AGENTE o ADMIN pueden ver este panel",
        },
        { status: 403 }
      );
    }

    // ─────────────────────────────────────────────
    // CASO 1: ROL AGENTE → panel individual (lo que ya tenías)
    // ─────────────────────────────────────────────
    if (rol === "AGENTE") {
      const agenteId = Number((session.user as any).agenteId);

      if (!agenteId) {
        return NextResponse.json(
          { error: "No hay un agente asociado a este usuario" },
          { status: 400 }
        );
      }

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
    }

    // ─────────────────────────────────────────────
    // CASO 2: ROL ADMIN → resumen global de agentes
    // ─────────────────────────────────────────────

    // Cargamos todos los agentes con sus datos principales
    const agentes = await prisma.agente.findMany({
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

    if (!agentes || agentes.length === 0) {
      return NextResponse.json(
        { error: "No hay agentes registrados todavía" },
        { status: 404 }
      );
    }

    // Unimos todo en un "agente virtual" de resumen global
    const lugaresGlobal = agentes.flatMap((a) => a.lugares);
    const leadsGlobal = agentes.flatMap((a) => a.leads);
    const comparativasGlobal = agentes.flatMap((a) => a.comparativas);

    const agenteGlobal = {
      id: 0,
      nombre: "Resumen global de agentes",
      email: "admin@impulsoenergetico.es",
      telefono: null as string | null,
      lugares: lugaresGlobal,
      leads: leadsGlobal,
      comparativas: comparativasGlobal,
    };

    const totalComparativas = await prisma.comparativa.count();
    const aggGlobal = await prisma.comparativa.aggregate({
      _sum: {
        ahorro: true,
        comision: true,
      },
    });

    const stats = {
      totalComparativas,
      ahorroTotal: aggGlobal._sum.ahorro || 0,
      comisionTotal: aggGlobal._sum.comision || 0,
      totalLeads: leadsGlobal.length,
      totalLugares: lugaresGlobal.length,
    };

    return NextResponse.json({ agente: agenteGlobal, stats });
  } catch (error) {
    console.error("Error en panel-agente:", error);
    return NextResponse.json(
      { error: "Error interno en el panel del agente" },
      { status: 500 }
    );
  }
}
