// src/app/(crm)/api/lugares/[id]/detalle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function toId(v: string) {
  const id = Number(v);
  if (Number.isNaN(id)) throw new Error("ID inválido");
  return id;
}

export async function GET(req: NextRequest, ctx: any) {
  try {
    const id = toId(ctx.params.id);

    const t = await getTenantContext(req);
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

    const { isSuperadmin, isAdmin, isAgente, isLugar, tenantAdminId, agenteId, lugarId } = t;
    if (!(isSuperadmin || isAdmin || isAgente || isLugar)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (isLugar && lugarId !== id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const lugar = await prisma.lugar.findFirst({
      where: tenantAdminId ? { id, adminId: tenantAdminId } : { id },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        qrCode: true,
        agenteId: true,
        adminId: true,
        pctCliente: true,
        pctLugar: true,
        agente: { select: { id: true, nombre: true, email: true, telefono: true, pctAgente: true } },
        usuarios: { select: { id: true, nombre: true, email: true, rol: true } },
        leads: {
          include: { agente: { select: { id: true, nombre: true } }, lugar: { select: { id: true, nombre: true } } },
          orderBy: { creadoEn: "desc" },
        },
        comparativas: {
          include: {
            cliente: { select: { id: true, nombre: true } },
            agente: { select: { id: true, nombre: true } },
          },
          orderBy: { id: "desc" },
        },
      },
    });

    if (!lugar) return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });

    if (isAgente && agenteId && lugar.agenteId !== agenteId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.json(lugar);
  } catch (error: any) {
    const msg = error?.message ?? "Error al obtener detalle del lugar";
    const status = msg.includes("ID inválido") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
