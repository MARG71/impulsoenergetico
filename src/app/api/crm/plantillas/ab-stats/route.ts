export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function toInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getRole(session: any): Role | undefined {
  return session?.user?.role as Role | undefined;
}

function getAdminId(session: any) {
  const role = getRole(session);
  if (!role) return null;
  if (role === "SUPERADMIN") return null;
  return toInt(session?.user?.adminId ?? session?.user?.id);
}

function rangeStart(rango: string) {
  const now = new Date();
  if (rango === "hoy") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const days = rango === "30d" ? 30 : 7;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 1000) / 10; // 1 decimal
}

/**
 * GET /api/crm/plantillas/ab-stats?etapa=primero&rango=7d&convDays=7
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const role = getRole(session);
    const adminId = getAdminId(session);

    const { searchParams } = new URL(req.url);
    const etapa = String(searchParams.get("etapa") || "").trim().toLowerCase();
    const rango = String(searchParams.get("rango") || "7d").trim();
    const convDays = Math.max(1, Math.min(60, Number(searchParams.get("convDays") || 7)));

    if (!etapa) return NextResponse.json({ error: "etapa requerida" }, { status: 400 });

    const since = rangeStart(rango);
    const convUntil = new Date(since.getTime() + convDays * 24 * 60 * 60 * 1000);

    // tenant filter
    const whereTenant =
      role === "SUPERADMIN"
        ? {}
        : {
            adminId: adminId ?? -1,
          };

    // 1) Envios por variante (en rango)
    const envios = await prisma.plantillaEnvio.findMany({
      where: {
        ...whereTenant,
        etapa,
        creadoEn: { gte: since },
      },
      select: {
        variante: true,
        leadId: true,
        lead: { select: { estado: true, creadoEn: true } },
        creadoEn: true,
      },
      take: 50000,
    });

    // agrupamos por leadId tomando el primer envio (para evitar duplicados)
    type V = "A" | "B";
    const firstByLead = new Map<number, V>();
    const enviosCount: Record<V, number> = { A: 0, B: 0 };
    const leadsSet: Record<V, Set<number>> = { A: new Set(), B: new Set() };

    for (const e of envios) {
      const v = (String(e.variante || "A").toUpperCase() === "B" ? "B" : "A") as V;
      enviosCount[v]++;

      if (!firstByLead.has(e.leadId)) firstByLead.set(e.leadId, v);
      leadsSet[v].add(e.leadId);
    }

    // 2) Conversiones: contamos estado actual del lead (simple y robusto)
    const leadIdsA = Array.from(leadsSet.A);
    const leadIdsB = Array.from(leadsSet.B);

    const [leadsA, leadsB] = await Promise.all([
      prisma.lead.findMany({
        where: { ...whereTenant, id: { in: leadIdsA } },
        select: { id: true, estado: true },
      }),
      prisma.lead.findMany({
        where: { ...whereTenant, id: { in: leadIdsB } },
        select: { id: true, estado: true },
      }),
    ]);

    const stages = ["contactado", "comparativa", "contrato", "cerrado"] as const;
    type Stage = (typeof stages)[number];

    const conversions: Record<V, Record<Stage, number>> = {
      A: { contactado: 0, comparativa: 0, contrato: 0, cerrado: 0 },
      B: { contactado: 0, comparativa: 0, contrato: 0, cerrado: 0 },
    };

    const bump = (v: V, estado?: string | null) => {
      const s = String(estado || "").toLowerCase();
      // regla: si está en una etapa, suma también las anteriores (embudo)
      if (s === "contactado" || s === "comparativa" || s === "contrato" || s === "cerrado") {
        conversions[v].contactado++;
      }
      if (s === "comparativa" || s === "contrato" || s === "cerrado") {
        conversions[v].comparativa++;
      }
      if (s === "contrato" || s === "cerrado") {
        conversions[v].contrato++;
      }
      if (s === "cerrado") {
        conversions[v].cerrado++;
      }
    };

    for (const l of leadsA) bump("A", l.estado);
    for (const l of leadsB) bump("B", l.estado);

    const totals = {
      A: { envios: enviosCount.A, leads: leadIdsA.length },
      B: { envios: enviosCount.B, leads: leadIdsB.length },
    };

    const ratios = {
      A: {
        contactado: pct(conversions.A.contactado, totals.A.leads),
        comparativa: pct(conversions.A.comparativa, totals.A.leads),
        contrato: pct(conversions.A.contrato, totals.A.leads),
        cerrado: pct(conversions.A.cerrado, totals.A.leads),
      },
      B: {
        contactado: pct(conversions.B.contactado, totals.B.leads),
        comparativa: pct(conversions.B.comparativa, totals.B.leads),
        contrato: pct(conversions.B.contrato, totals.B.leads),
        cerrado: pct(conversions.B.cerrado, totals.B.leads),
      },
    };

    return NextResponse.json({
      etapa,
      rango,
      convDays,
      totals,
      conversions,
      ratios,
      meta: {
        since,
        convUntil,
      },
    });
  } catch (e) {
    console.error("ab-stats error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
