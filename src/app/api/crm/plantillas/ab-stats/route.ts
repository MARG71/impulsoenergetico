// src/app/api/crm/plantillas/ab-stats/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionAdminId, sessionRole } from "@/lib/auth-server";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function parseRango(rango: string | null) {
  const now = new Date();

  if (rango === "hoy") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (rango === "30d") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // default 7d
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

function toInt(x: string | null, fallback: number) {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// 🔐 WHERE multi-tenant para LEADS (A/B se mide por envíos de plantilla a leads)
function leadTenantWhere(sessionUser: any) {
  const role = (sessionUser?.role as Role | undefined) ?? "CLIENTE";

  if (role === "SUPERADMIN") return {};

  if (role === "ADMIN") {
    // en tu sistema: adminId suele ser el id del usuario admin o session.adminId
    // aquí usamos sessionAdminId(session) más abajo para estar alineados
    return {};
  }

  if (role === "AGENTE") {
    return {
      adminId: Number(sessionUser.adminId),
      agenteId: Number(sessionUser.agenteId),
    };
  }

  if (role === "LUGAR") {
    return {
      adminId: Number(sessionUser.adminId),
      lugarId: Number(sessionUser.lugarId),
    };
  }

  return { id: -1 };
}

function normVariante(v: unknown): "A" | "B" {
  const s = String(v || "A").toUpperCase();
  return s === "B" ? "B" : "A";
}

type StatsOut = {
  etapa: string;
  rango: string;
  convDays: number;
  totals: { A: { envios: number; leads: number }; B: { envios: number; leads: number } };
  conversions: {
    A: { contactado: number; comparativa: number; contrato: number; cerrado: number };
    B: { contactado: number; comparativa: number; contrato: number; cerrado: number };
  };
  ratios: {
    A: { contactado: number; comparativa: number; contrato: number; cerrado: number };
    B: { contactado: number; comparativa: number; contrato: number; cerrado: number };
  };
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);
    const user: any = session.user;

    const url = new URL(req.url);
    const etapa = String(url.searchParams.get("etapa") || "primero");
    const rango = url.searchParams.get("rango") || "7d";
    const convDays = toInt(url.searchParams.get("convDays"), 7);

    const from = parseRango(rango);
    const until = new Date(Date.now() + convDays * 24 * 60 * 60 * 1000);

    // 1) Buscar envíos de plantillas por etapa en rango
    // Suponemos que registras envíos como LeadActividad con tipo "plantilla"
    // y guardas en detalle algo como: "etapa=primero variante=A" o campos propios.
    // Como aún no me pasaste el modelo exacto, lo hacemos robusto:
    // - tipo contiene "plantilla"
    // - titulo contiene "Plantilla"
    // - detalle incluye etapa y variante si están.
    //
    // ✅ Si en tu implementación ya guardas:
    // LeadActividad.tipo = "plantilla"
    // LeadActividad.titulo = "Plantilla WhatsApp"
    // LeadActividad.detalle = JSON string con {etapa, variante}
    // esto te vale igual.

    // WHERE multi-tenant
    const tenantLeadWhereBase = leadTenantWhere(user);

    // Ajuste adminId real para ADMIN:
    // si es ADMIN, filtramos por tenantAdminId
    const tenantFilter =
      role === "SUPERADMIN"
        ? {}
        : role === "ADMIN"
        ? { adminId: tenantAdminId ?? -1 }
        : { adminId: Number(user?.adminId ?? tenantAdminId ?? -1) };

    // Query: actividades de plantilla en el rango de envíos
    const actividades = await prisma.leadActividad.findMany({
      where: {
        ...tenantFilter,
        creadoEn: { gte: from },
        tipo: { contains: "plantilla" }, // robusto
        // filtramos por etapa buscando texto en detalle o título
        OR: [
          { titulo: { contains: etapa } },
          { detalle: { contains: `"etapa":"${etapa}"` } },
          { detalle: { contains: `etapa=${etapa}` } },
          { detalle: { contains: `ETAPA:${etapa}` } },
        ],
      },
      select: {
        id: true,
        leadId: true,
        creadoEn: true,
        detalle: true,
        titulo: true,
        adminId: true,
      },
      take: 5000,
      orderBy: { creadoEn: "desc" },
    });

    // 2) Separar envíos por variante
    const envioIdsByVar: Record<"A" | "B", number[]> = { A: [], B: [] };
    const leadIdsByVar: Record<"A" | "B", Set<number>> = { A: new Set(), B: new Set() };

    for (const a of actividades) {
      const raw = `${a.titulo ?? ""} ${a.detalle ?? ""}`;
      const variante =
        raw.includes('"variante":"B"') || raw.includes("variante=B") || raw.includes("VARIANTE:B")
          ? "B"
          : raw.includes('"variante":"A"') || raw.includes("variante=A") || raw.includes("VARIANTE:A")
          ? "A"
          : "A"; // default

      envioIdsByVar[variante].push(a.id);
      if (typeof a.leadId === "number") leadIdsByVar[variante].add(a.leadId);
    }

    // 3) Para conversiones: ver estado del lead dentro de la ventana convDays
    // Simplificación: miramos el lead actual, y si fue creado antes del "until".
    // Mejor: mirar cambios de estado en LeadActividad, pero esto ya sirve para empezar A/B real.
    const allLeadIds = Array.from(new Set([...leadIdsByVar.A, ...leadIdsByVar.B]));
    const leads = allLeadIds.length
      ? await prisma.lead.findMany({
          where: {
            id: { in: allLeadIds },
            ...tenantFilter,
            // Ventana de “medición”
            creadoEn: { lte: until },
          },
          select: { id: true, estado: true, creadoEn: true },
        })
      : [];

    const estadoByLead = new Map<number, string>(leads.map((l) => [l.id, String(l.estado || "pendiente").toLowerCase()]));

    const initConv = () => ({ contactado: 0, comparativa: 0, contrato: 0, cerrado: 0 });

    const conversions: StatsOut["conversions"] = { A: initConv(), B: initConv() };

    const countIf = (variante: "A" | "B", leadId: number) => {
      const st = estadoByLead.get(leadId) || "pendiente";
      if (st === "contactado") conversions[variante].contactado += 1;
      if (st === "comparativa") conversions[variante].comparativa += 1;
      if (st === "contrato") conversions[variante].contrato += 1;
      if (st === "cerrado") conversions[variante].cerrado += 1;

      // También contamos “arrastre”:
      // si está en contrato, también pasó por contactado/comparativa
      // (si quieres eso, dímelo y lo ajustamos)
    };

    for (const id of leadIdsByVar.A) countIf("A", id);
    for (const id of leadIdsByVar.B) countIf("B", id);

    const totals = {
      A: { envios: envioIdsByVar.A.length, leads: leadIdsByVar.A.size },
      B: { envios: envioIdsByVar.B.length, leads: leadIdsByVar.B.size },
    };

    const ratio = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

    const ratios: StatsOut["ratios"] = {
      A: {
        contactado: ratio(conversions.A.contactado, totals.A.leads),
        comparativa: ratio(conversions.A.comparativa, totals.A.leads),
        contrato: ratio(conversions.A.contrato, totals.A.leads),
        cerrado: ratio(conversions.A.cerrado, totals.A.leads),
      },
      B: {
        contactado: ratio(conversions.B.contactado, totals.B.leads),
        comparativa: ratio(conversions.B.comparativa, totals.B.leads),
        contrato: ratio(conversions.B.contrato, totals.B.leads),
        cerrado: ratio(conversions.B.cerrado, totals.B.leads),
      },
    };

    const out: StatsOut = {
      etapa,
      rango,
      convDays,
      totals,
      conversions,
      ratios,
    };

    return NextResponse.json(out);
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("ab-stats error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
