import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const runtime = "nodejs";

const toPct = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  const p = n > 1 ? n / 100 : n;
  return Math.max(0, Math.min(1, p));
};

function toId(v: string) {
  const id = Number(v);
  if (Number.isNaN(id)) throw new Error("ID inválido");
  return id;
}

const toBool = (v: any) => {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes", "si", "sí"].includes(s)) return true;
    if (["false", "0", "no"].includes(s)) return false;
  }
  return undefined;
};

const toInt = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  return Math.max(0, Math.floor(n));
};

const cleanStr = (v: any) => {
  if (v === undefined) return undefined;
  const s = String(v).trim();
  return s === "" ? null : s;
};

function tenantWhere(tenantAdminId: number | null) {
  return tenantAdminId ? { adminId: tenantAdminId } : {};
}

// GET /api/lugares/:id
export async function GET(req: NextRequest, context: any) {
  try {
    const id = toId(context.params.id);

    const ctx = await getTenantContext(req);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { isSuperadmin, isAdmin, isAgente, isLugar, tenantAdminId, agenteId, lugarId } = ctx;
    if (!(isSuperadmin || isAdmin || isAgente || isLugar)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Si es LUGAR: solo puede leer su propio lugar
    if (isLugar && lugarId !== id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const lugar = await prisma.lugar.findFirst({
      where: { id, ...tenantWhere(tenantAdminId) },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        qrCode: true,
        agenteId: true,
        adminId: true,
        pctLugar: true,
        pctCliente: true,
        agente: { select: { id: true, nombre: true, email: true } },
        especial: true,
        especialLogoUrl: true,
        especialColor: true,
        especialMensaje: true,
        aportacionAcumulada: true,
        especialCartelUrl: true,
        updatedAt: true,
      },
    });

    if (!lugar) return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });

    // Si es AGENTE: asegurar que el lugar es suyo
    if (isAgente && agenteId && lugar.agenteId !== agenteId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({
      ...lugar,
      logo: lugar.especialLogoUrl ?? null,
      color: lugar.especialColor ?? null,
      mensajeCorto: lugar.especialMensaje ?? null,
    });
  } catch (error: any) {
    const msg = error?.message ?? "Error al obtener lugar";
    const status = msg.includes("ID inválido") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// PUT /api/lugares/:id (ADMIN o SUPERADMIN; AGENTE solo si el lugar es suyo; LUGAR no)
export async function PUT(req: NextRequest, context: any) {
  try {
    const id = toId(context.params.id);

    const ctx = await getTenantContext(req);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { isSuperadmin, isAdmin, isAgente, tenantAdminId, agenteId } = ctx;

    // Permitimos: SUPERADMIN/ADMIN siempre. AGENTE solo si el lugar es suyo.
    if (!(isSuperadmin || isAdmin || isAgente)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const previo = await prisma.lugar.findFirst({
      where: { id, ...tenantWhere(tenantAdminId) },
      select: { id: true, agenteId: true, adminId: true },
    });
    if (!previo) return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });

    if (isAgente && agenteId && previo.agenteId !== agenteId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const data: any = {};

    if (body?.nombre !== undefined) data.nombre = String(body.nombre).trim();
    if (body?.direccion !== undefined) data.direccion = String(body.direccion).trim();
    if (body?.qrCode !== undefined) data.qrCode = String(body.qrCode).trim();

    // Cambiar agenteId: solo ADMIN/SUPERADMIN (y debe ser del mismo tenant)
    if ((isAdmin || isSuperadmin) && body?.agenteId !== undefined) {
      const newAgenteId = Number(body.agenteId);
      if (Number.isNaN(newAgenteId)) return NextResponse.json({ error: "agenteId inválido" }, { status: 400 });

      const agenteOk = await prisma.agente.findFirst({
        where: tenantAdminId ? { id: newAgenteId, adminId: tenantAdminId } : { id: newAgenteId },
        select: { id: true },
      });
      if (!agenteOk) return NextResponse.json({ error: "Agente no encontrado o no pertenece a tu admin" }, { status: 404 });

      data.agenteId = newAgenteId;
    }

    if (body?.pctCliente !== undefined) data.pctCliente = toPct(body.pctCliente);
    if (body?.pctLugar !== undefined) data.pctLugar = toPct(body.pctLugar);

    const especial = toBool(body?.especial);
    if (especial !== undefined) data.especial = especial;

    if (body?.especialLogoUrl !== undefined) data.especialLogoUrl = cleanStr(body.especialLogoUrl);
    if (body?.especialColor !== undefined) data.especialColor = cleanStr(body.especialColor);
    if (body?.especialMensaje !== undefined) data.especialMensaje = cleanStr(body.especialMensaje);

    const aport = toInt(body?.aportacionAcumulada);
    if (aport !== undefined) data.aportacionAcumulada = aport;

    if (body?.especialCartelUrl !== undefined) {
      data.especialCartelUrl =
        body.especialCartelUrl === null ? null : cleanStr(body.especialCartelUrl);
    }

    const updated = await prisma.lugar.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        direccion: true,
        qrCode: true,
        agenteId: true,
        adminId: true,
        pctLugar: true,
        pctCliente: true,
        agente: { select: { id: true, nombre: true, email: true } },
        especial: true,
        especialLogoUrl: true,
        especialColor: true,
        especialMensaje: true,
        aportacionAcumulada: true,
        especialCartelUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ...updated,
      logo: updated.especialLogoUrl ?? null,
      color: updated.especialColor ?? null,
      mensajeCorto: updated.especialMensaje ?? null,
    });
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });
    if (error?.code === "P2002") return NextResponse.json({ error: "qrCode ya existe" }, { status: 409 });
    const msg = error?.message ?? "Error al actualizar lugar";
    const status = msg.includes("ID inválido") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// DELETE /api/lugares/:id (solo ADMIN/SUPERADMIN)
export async function DELETE(req: NextRequest, context: any) {
  try {
    const id = toId(context.params.id);

    const ctx = await getTenantContext(req);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { isSuperadmin, isAdmin, tenantAdminId } = ctx;
    if (!(isSuperadmin || isAdmin)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const existe = await prisma.lugar.findFirst({
      where: { id, ...tenantWhere(tenantAdminId) },
      select: { id: true },
    });
    if (!existe) return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });

    await prisma.lugar.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const msg = error?.message ?? "Error al eliminar lugar";
    const status = msg.includes("ID inválido") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
