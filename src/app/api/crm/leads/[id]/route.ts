// src/app/api/crm/leads/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function tenantWhere(sessionUser: any) {
  const role = sessionUser?.role as Role | undefined;

  if (role === "SUPERADMIN") return {};

  if (role === "ADMIN") return { adminId: Number(sessionUser.id) };

  if (role === "AGENTE")
    return {
      adminId: Number(sessionUser.adminId),
      agenteId: Number(sessionUser.agenteId),
    };

  if (role === "LUGAR")
    return {
      adminId: Number(sessionUser.adminId),
      lugarId: Number(sessionUser.lugarId),
    };

  return { id: -1 };
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
      where: { id, ...tenantWhere(session.user) },
      include: {
        agente: { select: { id: true, nombre: true } },
        lugar: { select: { id: true, nombre: true } },
      },
    });

    if (!lead) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json(lead);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const data: any = {};
    if (typeof body.estado === "string") data.estado = body.estado;
    if (typeof body.notas === "string") data.notas = body.notas;
    if (typeof body.proximaAccion === "string") data.proximaAccion = body.proximaAccion;

    if (body.proximaAccionEn === null) data.proximaAccionEn = null;
    if (typeof body.proximaAccionEn === "string") {
      const d = new Date(body.proximaAccionEn);
      if (!Number.isNaN(d.getTime())) data.proximaAccionEn = d;
    }

    // seguridad: solo actualiza si pertenece al tenant
    const lead = await prisma.lead.findFirst({
      where: { id, ...tenantWhere(session.user) },
      select: { id: true },
    });

    if (!lead) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const updated = await prisma.lead.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
