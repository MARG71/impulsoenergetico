export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionRole,
  sessionAdminId,
} from "@/lib/auth-server";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

function parseId(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Intenta obtener un seccionId válido:
 * - Si el lead ya tiene seccionId, usarlo.
 * - Si no, buscar una sección "Luz" o la primera disponible.
 * (Esto evita romper si Contratacion exige seccionId obligatorio)
 */
async function resolveSeccionIdFallback(): Promise<number | null> {
  // Ajusta el orden / nombres si en tu BD se llaman distinto
  const byName = await prisma.seccion.findFirst({
    where: { nombre: { in: ["Luz", "luz", "Energía", "energia"] } as any },
    select: { id: true },
  });

  if (byName?.id) return byName.id;

  const first = await prisma.seccion.findFirst({
    select: { id: true },
    orderBy: { id: "asc" },
  });

  return first?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const adminId = sessionAdminId(session);

    // Roles permitidos (ajusta si quieres permitir AGENTE)
    if (!["ADMIN", "SUPERADMIN"].includes(String(role))) {
      return jsonError("No autorizado", 403);
    }

    const body = await req.json().catch(() => null);
    if (!body) return jsonError("Body JSON inválido", 400);

    const leadId = parseId(body.leadId);
    if (!leadId) return jsonError("leadId requerido", 400);

    // 1) Traer lead (y datos para cliente)
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        lugar: true as any,
        agente: true as any,
      },
    });

    if (!lead) return jsonError("Lead no encontrado", 404);

    // Multi-tenant: si tu lead tiene adminId, valida que coincide
    // (Lo dejo suave con any para no romper si no existe)
    if ((lead as any).adminId && (lead as any).adminId !== adminId) {
      return jsonError("No autorizado para este lead", 403);
    }

    // 2) Resolver seccionId (obligatorio en Contratacion en tu caso)
    let seccionId: number | null = parseId((lead as any).seccionId);
    if (!seccionId) seccionId = await resolveSeccionIdFallback();
    if (!seccionId) {
      return jsonError(
        "No se pudo resolver seccionId. Crea al menos 1 Sección en BD.",
        400
      );
    }

    // 3) Crear contratación en BORRADOR
    const contratacion = await prisma.contratacion.create({
      data: {
        // multi-tenant si tu modelo lo usa
        ...(adminId ? ({ adminId } as any) : {}),

        leadId: lead.id,
        seccionId,

        estado: "BORRADOR" as any,

        // Enlazados si existen en tu modelo
        ...(lead.agenteId ? ({ agenteId: lead.agenteId } as any) : {}),
        ...(lead.lugarId ? ({ lugarId: lead.lugarId } as any) : {}),

        // Puedes copiar más campos si tu modelo los tiene:
        // tarifa, compania, cups, potencia, etc.
      } as any,
    });

    return NextResponse.json({ ok: true, contratacion }, { status: 201 });
  } catch (e: any) {
    // IMPORTANTÍSIMO: devolver JSON, no HTML
    return jsonError("Error interno creando contratación", 500, {
      message: String(e?.message ?? e),
    });
  }
}
