export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionAdminId, sessionAgenteId, sessionRole } from "@/lib/auth-server";

function parseId(id: unknown) {
  const n = Number(id);
  return !n || Number.isNaN(n) ? null : n;
}

async function assertLeadAccess(leadId: number) {
  const session = await getSessionOrThrow();
  const role = sessionRole(session);
  const tenantAdminId = sessionAdminId(session);
  const agenteId = sessionAgenteId(session);
  const lugarId = Number((session.user as any)?.lugarId ?? null);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, adminId: true, agenteId: true, lugarId: true },
  });

  if (!lead) return { session, lead: null as any, role, tenantAdminId };

  if (role !== "SUPERADMIN") {
    if ((lead.adminId ?? null) !== tenantAdminId) throw new Error("FORBIDDEN");
    if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) throw new Error("FORBIDDEN");
    if (role === "LUGAR" && lugarId && lead.lugarId !== lugarId) throw new Error("FORBIDDEN");
  }

  return { session, lead, role, tenantAdminId };
}

export async function GET(_req: Request, ctx: any) {
  try {
    const leadId = parseId(ctx?.params?.id);
    if (!leadId) return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });

    const { lead } = await assertLeadAccess(leadId);
    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    const items = await prisma.leadDocumento.findMany({
      where: { leadId },
      orderBy: { creadoEn: "desc" },
      take: 200,
      include: { creadoPor: { select: { id: true, nombre: true, rol: true } } },
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    console.error("GET documentos lead error:", e);
    return NextResponse.json({ error: "Error obteniendo documentos" }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: any) {
  try {
    const leadId = parseId(ctx?.params?.id);
    if (!leadId) return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });

    const { session, lead, tenantAdminId } = await assertLeadAccess(leadId);
    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    const usuarioId = Number((session.user as any)?.id ?? null);

    const body = await req.json().catch(() => ({}));

    // ✅ nombre obligatorio
    const nombre = String(body?.nombre || "").trim();

    // ✅ publicId obligatorio (en tu schema es String NO opcional)
    const publicId = String(body?.publicId || "").trim();

    // url es opcional en tu schema
    const url = String(body?.url || "").trim();

    // opcionales
    const resourceType = body?.resourceType ? String(body.resourceType).trim() : null;
    const deliveryType = body?.deliveryType ? String(body.deliveryType).trim() : null;
    const mime = body?.mime ? String(body.mime).trim() : null;
    const size = body?.size != null && body?.size !== "" ? Number(body.size) : null;

    if (!nombre) {
      return NextResponse.json({ error: "nombre es requerido" }, { status: 400 });
    }

    // ✅ aquí está la clave: si no viene publicId, no creamos (porque Prisma lo exige)
    if (!publicId) {
      return NextResponse.json(
        { error: "publicId es requerido (LeadDocumento.publicId es obligatorio en schema.prisma)" },
        { status: 400 }
      );
    }

    const created = await prisma.leadDocumento.create({
      data: {
        leadId,
        nombre,
        url: url || null,        // ✅ opcional
        publicId,                // ✅ obligatorio (string siempre)
        resourceType,            // ✅ opcional
        deliveryType,            // ✅ opcional
        mime,                    // ✅ opcional
        size,                    // ✅ opcional
        creadoPorId: usuarioId || null,
        adminId: lead.adminId ?? tenantAdminId ?? null,
      },
      include: { creadoPor: { select: { id: true, nombre: true, rol: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    console.error("POST documentos lead error:", e);
    return NextResponse.json({ error: "Error creando documento" }, { status: 500 });
  }
}
