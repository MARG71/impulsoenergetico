// src/app/api/lugares/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

// ✅ Normaliza porcentajes: "15" -> 0.15, "0.15" -> 0.15, "15,5" -> 0.155
function toPct(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  if (Number.isNaN(n)) return null;
  return n > 1 ? n / 100 : n;
}

function toNumberOr0(v: any): number {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function toIntOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildLugarWhere(ctx: any, idNum: number) {
  const where: any = { id: idNum };

  if (ctx.isSuperadmin) {
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;
  } else if (ctx.isAdmin) {
    if (!ctx.tenantAdminId) throw new Error("TENANT_INVALIDO");
    where.adminId = ctx.tenantAdminId;
  } else if (ctx.isAgente) {
    if (!ctx.agenteId) throw new Error("AGENTE_SIN_ID");
    where.agenteId = ctx.agenteId;
  } else {
    throw new Error("NO_PERMITIDO");
  }

  return where;
}

// ✅ Reutilizamos el mismo select en GET y PUT
const agenteSelect = {
  id: true,
  nombre: true,
  email: true,
  telefono: true, // ✅ CLAVE para que salga en el cartel
};

// ───────────────────────────────
// GET /api/lugares/[id]
// ───────────────────────────────
export async function GET(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const ctx = await getTenantContext(req);

  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let where: any;
  try {
    where = buildLugarWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN, ADMIN o AGENTE pueden ver lugares" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Configuración de tenant inválida" },
      { status: 400 }
    );
  }

  const lugar = await prisma.lugar.findFirst({
    where,
    include: {
      agente: { select: agenteSelect },
    },
  });

  if (!lugar) {
    return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });
  }

  // ✅ DEBUG opcional: añade ?debug=1 a la URL para inspeccionar
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  if (debug) {
    // Importante: esto lo verás también en logs de Vercel
    console.log("[lugares/[id]] agente debug:", lugar?.agente);
    return NextResponse.json({
      ok: true,
      lugarId: lugar.id,
      agente: lugar.agente,
      keysAgente: lugar.agente ? Object.keys(lugar.agente as any) : [],
    });
  }

    return NextResponse.json({
      __ROUTE_MARK: "APP_API_LUGARES_ID_V2",
      ...lugar,
    });
  
}

// ───────────────────────────────
// PUT /api/lugares/[id]
// ───────────────────────────────
export async function PUT(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const ctx = await getTenantContext(req);

  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!ctx.isSuperadmin && !ctx.isAdmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN o ADMIN pueden editar lugares" },
      { status: 403 }
    );
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    nombre,
    direccion,
    qrCode,
    agenteId,
    pctCliente,
    pctLugar,
    especial,
    especialLogoUrl,
    especialColor,
    especialMensaje,
    aportacionAcumulada,
    especialCartelUrl,
  } = body || {};

  if (!nombre || !direccion || !qrCode || !agenteId) {
    return NextResponse.json(
      { error: "Nombre, dirección, QR y agente son obligatorios" },
      { status: 400 }
    );
  }

  const agenteIdNum = toIntOrNull(agenteId);
  if (!agenteIdNum) {
    return NextResponse.json({ error: "agenteId inválido" }, { status: 400 });
  }

  let where: any;
  try {
    where = buildLugarWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN o ADMIN pueden editar lugares" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Configuración de tenant inválida" },
      { status: 400 }
    );
  }

  const existente = await prisma.lugar.findFirst({ where });
  if (!existente) {
    return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });
  }

  try {
    const lugar = await prisma.lugar.update({
      where: { id: existente.id },
      data: {
        nombre: String(nombre).trim(),
        direccion: String(direccion).trim(),
        qrCode: String(qrCode).trim(),
        agenteId: agenteIdNum,

        pctCliente: toPct(pctCliente),
        pctLugar: toPct(pctLugar),

        especial: !!especial,
        especialLogoUrl: especialLogoUrl ?? existente.especialLogoUrl,
        especialColor: especialColor ?? existente.especialColor,
        especialMensaje: especialMensaje ?? existente.especialMensaje,

        aportacionAcumulada: toNumberOr0(
          aportacionAcumulada ?? existente.aportacionAcumulada ?? 0
        ),

        especialCartelUrl:
          typeof especialCartelUrl === "string" && especialCartelUrl.trim()
            ? especialCartelUrl.trim()
            : existente.especialCartelUrl,
      },
      include: {
        agente: { select: agenteSelect },
        _count: {
          select: {
            comparativas: true,
            leads: true,
            usuarios: true,
          },
        },
      },
    });

    return NextResponse.json(lugar);
  } catch (e: any) {
    console.error("Error actualizando lugar:", e);
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "El código QR ya está en uso por otro lugar" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar lugar" },
      { status: 500 }
    );
  }
}

// ───────────────────────────────
// DELETE /api/lugares/[id]
// (soft delete: marcar ocultoParaAdmin)
// ───────────────────────────────
export async function DELETE(req: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  const ctx = await getTenantContext(req);

  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!ctx.isSuperadmin && !ctx.isAdmin) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN o ADMIN pueden eliminar lugares" },
      { status: 403 }
    );
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let where: any;
  try {
    where = buildLugarWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return NextResponse.json(
        { error: "Solo SUPERADMIN o ADMIN pueden eliminar lugares" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Configuración de tenant inválida" },
      { status: 400 }
    );
  }

  const existente = await prisma.lugar.findFirst({ where });
  if (!existente) {
    return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });
  }

  try {
    await prisma.lugar.update({
      where: { id: existente.id },
      data: { ocultoParaAdmin: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error eliminando lugar:", e);
    return NextResponse.json(
      { error: "Error al eliminar (ocultar) lugar" },
      { status: 500 }
    );
  }
}
