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
  // SUPERADMIN no filtra por adminId; para el resto necesitamos adminId
  const role = getRole(session);
  if (!role) return null;
  if (role === "SUPERADMIN") return null;
  const adminId = toInt(session?.user?.adminId ?? session?.user?.id);
  return adminId;
}

function normalizeVariante(v: any): "A" | "B" {
  const s = String(v || "A").toUpperCase().trim();
  return s === "B" ? "B" : "A";
}

function normalizeEtapa(v: any) {
  return String(v || "").trim().toLowerCase();
}

function normalizeCanal(v: any) {
  return String(v || "whatsapp").trim().toLowerCase();
}

/**
 * POST /api/crm/plantillas/track
 * body:
 * {
 *   leadId: number,
 *   etapa: string,
 *   variante: "A"|"B",
 *   canal?: "whatsapp",
 *   plantillaId?: number | null
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const role = getRole(session);
    const adminId = getAdminId(session);

    const body = await req.json().catch(() => ({}));
    const leadId = toInt(body?.leadId);
    const plantillaId = toInt(body?.plantillaId);
    const etapa = normalizeEtapa(body?.etapa);
    const canal = normalizeCanal(body?.canal);
    const variante = normalizeVariante(body?.variante);

    if (!leadId) return NextResponse.json({ error: "leadId requerido" }, { status: 400 });
    if (!etapa) return NextResponse.json({ error: "etapa requerida" }, { status: 400 });

    // Verifica acceso al lead (tenant)
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, adminId: true },
    });
    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    // Si no es SUPERADMIN, debe coincidir adminId
    if (role !== "SUPERADMIN") {
      if (!adminId) return NextResponse.json({ error: "Sin adminId en sesión" }, { status: 403 });
      if (toInt(lead.adminId) !== adminId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const created = await prisma.plantillaEnvio.create({
      data: {
        canal,
        etapa,
        variante,
        leadId,
        plantillaId: plantillaId ?? null,
        adminId: role === "SUPERADMIN" ? toInt(lead.adminId) : adminId,
        usuarioId: toInt(session.user.id),
      },
      select: { id: true, creadoEn: true },
    });

    return NextResponse.json({ ok: true, envioId: created.id, creadoEn: created.creadoEn });
  } catch (e) {
    console.error("plantillas track error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
