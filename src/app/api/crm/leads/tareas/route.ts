// src/app/api/crm/leads/tareas/route.ts
// src/app/api/crm/leads/tareas/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionAdminId,
  sessionAgenteId,
  sessionRole,
} from "@/lib/auth-server";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR";

function tenantWhere(session: any) {
  const role = sessionRole(session) as Role;
  const adminId = sessionAdminId(session);
  const agenteId = sessionAgenteId(session);
  const lugarId = Number((session.user as any)?.lugarId ?? null);

  if (role === "SUPERADMIN") return {};
  if (role === "ADMIN") return { adminId };
  if (role === "AGENTE") return { adminId, agenteId };
  if (role === "LUGAR") return { adminId, lugarId };
  return { id: -1 };
}

function toLower(v: any) {
  return String(v ?? "").toLowerCase();
}

function hoursBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60));
}

/**
 * Score 0–100:
 * - estado comparativa/contrato/cerrado suma
 * - acciones: whatsapp/llamada suma
 * - tener próxima acción suma
 * - vencida resta
 * - sin actividad 72h resta
 */
function calcScore(input: {
  estado: string;
  hasWhats: boolean;
  hasCall: boolean;
  hasNext: boolean;
  overdue: boolean;
  lastActAt: Date | null;
}) {
  let score = 20;

  const estado = toLower(input.estado);

  if (estado === "contactado") score += 15;
  if (estado === "comparativa") score += 30;
  if (estado === "contrato") score += 40;
  if (estado === "cerrado") score += 55;
  if (estado === "perdido") score -= 20;

  if (input.hasWhats) score += 10;
  if (input.hasCall) score += 10;
  if (input.hasNext) score += 10;

  if (input.overdue) score -= 20;

  if (input.lastActAt) {
    const h = hoursBetween(new Date(), input.lastActAt);
    if (h >= 72) score -= 15;
    if (h >= 168) score -= 10; // 7 días
  } else {
    score -= 10; // nunca se tocó
  }

  score = Math.max(0, Math.min(100, score));
  return score;
}

function recomendacion(input: {
  estado: string;
  score: number;
  overdue: boolean;
  hasNext: boolean;
  lastActAt: Date | null;
}) {
  const estado = toLower(input.estado);
  const lastHours = input.lastActAt ? hoursBetween(new Date(), input.lastActAt) : 9999;

  if (estado === "perdido") return "No insistir (marcado como perdido).";
  if (input.overdue) return "⚠️ Recuperación urgente: llamar hoy y reprogramar acción.";
  if (!input.hasNext) return "Definir próxima acción (no dejarlo sin siguiente paso).";

  if (estado === "pendiente") return "Enviar WhatsApp inicial + programar llamada en 24h.";
  if (estado === "contactado") return "Programar llamada y pedir factura / datos de consumo.";
  if (estado === "comparativa") return "Cerrar: enviar comparativa y ofrecer llamada de cierre.";
  if (estado === "contrato") return "Empujar firma: confirmar documentación y fecha de alta.";
  if (estado === "cerrado") return "Pedir recomendación / derivaciones.";

  if (lastHours >= 72) return "Reactivar: WhatsApp de seguimiento + llamada corta.";
  if (input.score >= 70) return "Lead caliente: llamar ahora y proponer cierre.";
  return "Seguimiento normal: revisar necesidades y siguiente paso.";
}

export async function GET() {
  try {
    const session = await getSessionOrThrow();
    const baseWhere = tenantWhere(session);

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const hace72h = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const include = {
      agente: { select: { id: true, nombre: true } },
      lugar: { select: { id: true, nombre: true } },
    } as const;

    // 1) Traemos listas base
    const [vencidasRaw, hoyRaw, pendientesRaw] = await Promise.all([
      prisma.lead.findMany({
        where: { ...baseWhere, proximaAccionEn: { lt: inicioHoy } },
        orderBy: [{ proximaAccionEn: "asc" }, { creadoEn: "desc" }],
        include,
        take: 500,
      }),

      prisma.lead.findMany({
        where: { ...baseWhere, proximaAccionEn: { gte: inicioHoy, lte: finHoy } },
        orderBy: [{ proximaAccionEn: "asc" }, { creadoEn: "desc" }],
        include,
        take: 500,
      }),

      // Pendientes = con próxima acción futura o sin fecha pero activos
      prisma.lead.findMany({
        where: {
          ...baseWhere,
          OR: [
            { proximaAccionEn: { gt: finHoy } },
            { proximaAccionEn: null },
          ],
        },
        orderBy: [{ creadoEn: "desc" }],
        include,
        take: 800,
      }),
    ]);

    // 2) Calculamos último evento + si hubo whatsapp/llamada por lead (en lote)
    const allLeads = [...vencidasRaw, ...hoyRaw, ...pendientesRaw];
    const leadIds = Array.from(new Set(allLeads.map((l) => l.id)));

    const [lastActs, tiposAgg] = await Promise.all([
      prisma.leadActividad.groupBy({
        by: ["leadId"],
        where: { leadId: { in: leadIds } },
        _max: { creadoEn: true },
      }),
      prisma.leadActividad.groupBy({
        by: ["leadId", "tipo"],
        where: { leadId: { in: leadIds } },
        _count: { _all: true },
      }),
    ]);

    const lastMap = new Map<number, Date>();
    for (const r of lastActs) {
      if (r._max?.creadoEn) lastMap.set(r.leadId as any, r._max.creadoEn as any);
    }

    const tipoMap = new Map<number, Set<string>>();
    for (const r of tiposAgg) {
      const lid = r.leadId as any as number;
      const tipo = toLower((r as any).tipo);
      if (!tipoMap.has(lid)) tipoMap.set(lid, new Set());
      tipoMap.get(lid)!.add(tipo);
    }

    // 3) Enriquecemos leads con score + recomendación
    const enrich = (l: any) => {
      const lastActAt = lastMap.get(l.id) ?? null;
      const tipos = tipoMap.get(l.id) ?? new Set<string>();

      const hasWhats = tipos.has("whatsapp");
      const hasCall = tipos.has("llamada");

      const hasNext = Boolean(l.proximaAccion || l.proximaAccionEn);
      const overdue = l.proximaAccionEn ? new Date(l.proximaAccionEn) < inicioHoy : false;

      const score = calcScore({
        estado: l.estado ?? "pendiente",
        hasWhats,
        hasCall,
        hasNext,
        overdue,
        lastActAt,
      });

      return {
        ...l,
        lastActAt: lastActAt ? lastActAt.toISOString() : null,
        score,
        recomendacion: recomendacion({
          estado: l.estado ?? "pendiente",
          score,
          overdue,
          hasNext,
          lastActAt,
        }),
      };
    };

    const vencidas = vencidasRaw.map(enrich);
    const hoy = hoyRaw.map(enrich);
    const pendientes = pendientesRaw.map(enrich);

    // 4) Alertas
    const vencidas48h = vencidas.filter((l: any) => l.proximaAccionEn && new Date(l.proximaAccionEn) < hace48h);
    const sinActividad = [...pendientes, ...hoy].filter((l: any) => !l.lastActAt || new Date(l.lastActAt) < hace72h);
    const calientes = [...pendientes, ...hoy].filter((l: any) => (l.score ?? 0) >= 70);

    // Ordenamos alertas por prioridad (score desc)
    const byScore = (a: any, b: any) => (b.score ?? 0) - (a.score ?? 0);

    return NextResponse.json({
      vencidas,
      hoy,
      pendientes,
      alertas: {
        vencidas48h: vencidas48h.sort(byScore).slice(0, 20),
        sinActividad: sinActividad.sort(byScore).slice(0, 20),
        calientes: calientes.sort(byScore).slice(0, 20),
      },
    });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("tareas leads error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
