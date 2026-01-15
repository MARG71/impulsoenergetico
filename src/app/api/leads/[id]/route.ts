// src/app/api/leads/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function resolveUser(session: any) {
  const rol = (session?.user as any)?.rol ?? (session?.user as any)?.role ?? null;

  const userId = (session?.user as any)?.id ? Number((session.user as any).id) : null;
  const adminId = (session?.user as any)?.adminId ? Number((session.user as any).adminId) : null;
  const agenteId = (session?.user as any)?.agenteId ? Number((session.user as any).agenteId) : null;
  const lugarId = (session?.user as any)?.lugarId ? Number((session.user as any).lugarId) : null;

  const tenantAdminId =
    rol === "SUPERADMIN" ? null : rol === "ADMIN" ? userId : adminId;

  return { rol, userId, adminId, agenteId, lugarId, tenantAdminId };
}

// ✅ GET protegido por tenant/rol
export async function GET(req: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { rol, tenantAdminId, agenteId, lugarId } = resolveUser(session);

    const id = Number(context?.params?.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    }

    const where: any = { id };

    if (rol !== "SUPERADMIN") {
      if (!tenantAdminId) {
        return NextResponse.json({ error: "Tenant no resuelto" }, { status: 400 });
      }
      where.adminId = tenantAdminId;
    }

    if (rol === "AGENTE") where.agenteId = agenteId ?? -1;
    if (rol === "LUGAR") where.lugarId = lugarId ?? -1;

    if (rol === "CLIENTE") {
      return NextResponse.json({ error: "No permitido" }, { status: 403 });
    }

    const lead = await prisma.lead.findFirst({
      where,
      include: { agente: true, lugar: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error GET /api/leads/[id]:", error);
    return NextResponse.json(
      { error: "Error interno al cargar el lead" },
      { status: 500 }
    );
  }
}

// ✅ PATCH protegido por tenant/rol + campos comerciales
export async function PATCH(req: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { rol, tenantAdminId, agenteId } = resolveUser(session);

    // Permitimos SUPERADMIN, ADMIN y AGENTE
    if (rol !== "SUPERADMIN" && rol !== "ADMIN" && rol !== "AGENTE") {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar este lead" },
        { status: 403 }
      );
    }

    const id = Number(context?.params?.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));

    const { estado, notas, proximaAccion, proximaAccionEn } = body as {
      estado?: string;
      notas?: string | null;
      proximaAccion?: string | null;
      proximaAccionEn?: string | null; // ISO
    };

    const dataUpdate: any = {};

    if (estado) dataUpdate.estado = estado;
    if (typeof notas !== "undefined") dataUpdate.notas = notas || null;
    if (typeof proximaAccion !== "undefined")
      dataUpdate.proximaAccion = proximaAccion || null;

    if (typeof proximaAccionEn !== "undefined") {
      dataUpdate.proximaAccionEn = proximaAccionEn ? new Date(proximaAccionEn) : null;
    }

    if (Object.keys(dataUpdate).length === 0) {
      return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 });
    }

    const where: any = { id };

    if (rol !== "SUPERADMIN") {
      if (!tenantAdminId) {
        return NextResponse.json({ error: "Tenant no resuelto" }, { status: 400 });
      }
      where.adminId = tenantAdminId;
    }

    if (rol === "AGENTE") where.agenteId = agenteId ?? -1;

    const updated = await prisma.lead.updateMany({
      where,
      data: dataUpdate,
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "No encontrado o sin permisos" }, { status: 404 });
    }

    const leadActualizado = await prisma.lead.findFirst({
      where: { id },
      include: { agente: true, lugar: true },
    });

    return NextResponse.json(leadActualizado);
  } catch (error) {
    console.error("Error PATCH /api/leads/[id]:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar el lead" },
      { status: 500 }
    );
  }
}
