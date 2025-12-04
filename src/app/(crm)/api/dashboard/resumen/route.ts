import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma'; // ⚠️ Ajusta la ruta si usas otra

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rol = (session.user as any).rol || (session.user as any).role;
  const usuarioId = (session.user as any).id;

  // Si es AGENTE, filtramos por agenteId en leads/comparativas.
  const filtroAgente: any =
    rol === 'AGENTE'
      ? { agenteId: usuarioId }
      : {}; // ADMIN ve todo

  try {
    // 🧮 1) KPIs principales
    const [
      leadsNuevos,
      comparativasEnCurso,
      ofertasEnviadas,
      pendientesRespuesta,
      cierresGanados,
    ] = await Promise.all([
      prisma.lead.count({
        where: {
          ...filtroAgente,
          // ⚠️ Campo ejemplo: estadoPipeline
          estadoPipeline: 'nuevo',
        },
      }),
      prisma.comparativa.count({
        where: {
          ...filtroAgente,
          // ⚠️ Ajusta los estados de tu lógica real
          estadoPipeline: { in: ['comparativa_iniciada', 'comparativa_completada'] },
        },
      }),
      prisma.lead.count({
        where: {
          ...filtroAgente,
          estadoPipeline: 'oferta_enviada',
        },
      }),
      prisma.lead.count({
        where: {
          ...filtroAgente,
          estadoPipeline: 'pendiente_respuesta',
        },
      }),
      prisma.lead.count({
        where: {
          ...filtroAgente,
          estadoPipeline: 'cerrado_ganado',
        },
      }),
    ]);

    // 🧱 2) Mini pipeline: contadores por estado
    const estados = [
      'nuevo',
      'registro_completado',
      'comparativa_iniciada',
      'comparativa_completada',
      'oferta_enviada',
      'pendiente_respuesta',
      'cerrado_ganado',
      'cerrado_perdido',
    ] as const;

    const pipelinePorEstado: Record<string, number> = {};
    for (const estado of estados) {
      const count = await prisma.lead.count({
        where: {
          ...filtroAgente,
          estadoPipeline: estado,
        },
      });
      pipelinePorEstado[estado] = count;
    }

    // 🗂️ 3) Actividad reciente
    const ultimosLeads = await prisma.lead.findMany({
      where: { ...filtroAgente },
      orderBy: {
        // ⚠️ Ajusta por el campo de fecha real: createdAt, creadoEn, etc.
        creadoEn: 'desc',
      },
      take: 5,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        creadoEn: true, // ⚠️ Ajusta
        estadoPipeline: true,
        // Si tienes relación con agente/lugar:
        agente: {
          select: { nombre: true },
        },
        lugar: {
          select: { nombre: true },
        },
      },
    });

    const ultimasComparativas = await prisma.comparativa.findMany({
      where: { ...filtroAgente },
      orderBy: {
        // ⚠️ Ajusta nombre del campo de fecha
        creadoEn: 'desc',
      },
      take: 5,
      select: {
        id: true,
        tipoServicio: true, // luz, gas, telefonia, seguros...
        // ⚠️ Ajusta nombres de campos cliente
        nombreCliente: true,
        creadoEn: true,
        estadoPipeline: true,
      },
    });

    return NextResponse.json({
      kpis: {
        leadsNuevos,
        comparativasEnCurso,
        ofertasEnviadas,
        pendientesRespuesta,
        cierresGanados,
      },
      pipeline: pipelinePorEstado,
      ultimosLeads,
      ultimasComparativas,
      rol,
    });
  } catch (error) {
    console.error('Error en /api/dashboard/resumen', error);
    return NextResponse.json(
      { error: 'Error interno en el dashboard' },
      { status: 500 },
    );
  }
}
