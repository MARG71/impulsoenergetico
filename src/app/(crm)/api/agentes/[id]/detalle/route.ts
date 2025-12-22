// src/app/(crm)/api/agentes/[id]/detalle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(req: NextRequest, ctx: any) {
  const fromParams = ctx?.params?.id;
  const fromUrl = new URL(req.url).pathname.split("/").filter(Boolean).pop();
  const id = Number(fromParams ?? fromUrl);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const t = await getTenantContext(req);
  if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

  const { isSuperadmin, isAdmin, isAgente, tenantAdminId, agenteId } = t;
  if (!(isSuperadmin || isAdmin || isAgente)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (isAgente && agenteId !== id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const agente = await prisma.agente.findFirst({
      where: tenantAdminId ? { id, adminId: tenantAdminId } : { id },
      include: {
        usuarios: true,
        lugares: {
          select: { id: true, nombre: true, direccion: true, pctCliente: true, pctLugar: true },
        },
        comparativas: {
          include: {
            cliente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true } },
          },
          orderBy: { id: "desc" },
        },
        leads: {
          include: { lugar: { select: { id: true, nombre: true, direccion: true } } },
          orderBy: { creadoEn: "desc" },
        },
      },
    });

    if (!agente) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

    const comparativasConLugar = agente.comparativas.map((comp) => ({
      ...comp,
      nombreLugar: comp.lugar?.nombre ?? null,
      nombreCliente: comp.cliente?.nombre ?? null,
    }));

    return NextResponse.json({ ...agente, comparativas: comparativasConLugar });
  } catch (error: any) {
    console.error("[API][agentes][detalle]", error);
    return NextResponse.json({ error: "Error al obtener detalle del agente" }, { status: 500 });
  }
}
