// src/app/api/lugares/[id]/route.ts
// src/app/api/lugares/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { NivelComision } from "@prisma/client";

// Normaliza porcentajes: "15" -> 0.15, "0.15" -> 0.15, "15,5" -> 0.155
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
  return Number.isFinite(n) && n > 0 ? n : null;
}

function noStoreJson(data: any, init?: { status?: number }) {
  const res = NextResponse.json(data, { status: init?.status ?? 200 });
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
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

const agenteSelect = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
};

const NIVELES_VALIDOS = ["C1", "C2", "C3", "ESPECIAL"] as const;

function normalizeNivelComision(
  input: any,
  fallback: NivelComision
): NivelComision {
  const v = String(input ?? "").toUpperCase().trim();
  if ((NIVELES_VALIDOS as readonly string[]).includes(v)) return v as NivelComision;
  return fallback;
}

// ✅ Next 15: NO tipar el 2º argumento como { params: ... } (da error en build)
function getIdFromContext(context: any): string | null {
  const id = context?.params?.id;
  return typeof id === "string" && id.trim() ? id : null;
}

// GET /api/lugares/[id]
export async function GET(req: NextRequest, context: any) {
  const idStr = getIdFromContext(context);
  const ctx = await getTenantContext(req);

  if (!ctx.ok) return noStoreJson({ error: "No autorizado" }, { status: 401 });

  const idNum = Number(idStr);
  if (!idStr || !Number.isFinite(idNum))
    return noStoreJson({ error: "ID inválido" }, { status: 400 });

  let where: any;
  try {
    where = buildLugarWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return noStoreJson(
        { error: "Solo SUPERADMIN, ADMIN o AGENTE pueden ver lugares" },
        { status: 403 }
      );
    }
    return noStoreJson(
      { error: "Configuración de tenant inválida" },
      { status: 400 }
    );
  }

  const lugar = await prisma.lugar.findFirst({
    where,
    include: { agente: { select: agenteSelect } },
  });

  if (!lugar)
    return noStoreJson({ error: "Lugar no encontrado" }, { status: 404 });

  return noStoreJson(lugar);
}

// PUT /api/lugares/[id]
export async function PUT(req: NextRequest, context: any) {
  const idStr = getIdFromContext(context);
  const ctx = await getTenantContext(req);

  if (!ctx.ok) return noStoreJson({ error: "No autorizado" }, { status: 401 });

  if (!ctx.isSuperadmin && !ctx.isAdmin) {
    return noStoreJson(
      { error: "Solo SUPERADMIN o ADMIN pueden editar lugares" },
      { status: 403 }
    );
  }

  const idNum = Number(idStr);
  if (!idStr || !Number.isFinite(idNum))
    return noStoreJson({ error: "ID inválido" }, { status: 400 });

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
    nivelComisionDefault,
  } = body || {};

  if (!nombre || !direccion || !qrCode || !agenteId) {
    return noStoreJson(
      { error: "Nombre, dirección, QR y agente son obligatorios" },
      { status: 400 }
    );
  }

  const agenteIdNum = toIntOrNull(agenteId);
  if (!agenteIdNum)
    return noStoreJson({ error: "agenteId inválido" }, { status: 400 });

  let where: any;
  try {
    where = buildLugarWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return noStoreJson(
        { error: "Solo SUPERADMIN o ADMIN pueden editar lugares" },
        { status: 403 }
      );
    }
    return noStoreJson(
      { error: "Configuración de tenant inválida" },
      { status: 400 }
    );
  }

  const existente = await prisma.lugar.findFirst({ where });
  if (!existente)
    return noStoreJson({ error: "Lugar no encontrado" }, { status: 404 });

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

        // ✅ NIVEL DEFAULT (guardado real)
        nivelComisionDefault: normalizeNivelComision(
          nivelComisionDefault,
          (existente.nivelComisionDefault ?? NivelComision.C1) as NivelComision
        ),

        // ✅ ESPECIAL + CAMPOS (si lo desactivas, limpiamos)
        especial: !!especial,
        especialLogoUrl: especial ? (especialLogoUrl ?? existente.especialLogoUrl) : null,
        especialColor: especial ? (especialColor ?? existente.especialColor) : null,
        especialMensaje: especial ? (especialMensaje ?? existente.especialMensaje) : null,

        aportacionAcumulada: toNumberOr0(
          aportacionAcumulada ?? existente.aportacionAcumulada ?? 0
        ),

        especialCartelUrl:
          especial && typeof especialCartelUrl === "string" && especialCartelUrl.trim()
            ? especialCartelUrl.trim()
            : especial
              ? existente.especialCartelUrl
              : null,
      },
      include: {
        agente: { select: agenteSelect },
        _count: { select: { comparativas: true, leads: true, usuarios: true } },
      },
    });

    // ✅ Propagar a usuarios rol LUGAR vinculados al lugar
    await prisma.usuario.updateMany({
      where: { rol: "LUGAR", lugarId: lugar.id },
      data: { nivelComisionDefault: lugar.nivelComisionDefault },
    });

    return noStoreJson(lugar);
  } catch (e: any) {
    console.error("Error actualizando lugar:", e);
    if (e?.code === "P2002") {
      return noStoreJson(
        { error: "El código QR ya está en uso por otro lugar" },
        { status: 400 }
      );
    }
    return noStoreJson({ error: "Error al actualizar lugar" }, { status: 500 });
  }
}

// DELETE /api/lugares/[id]
export async function DELETE(req: NextRequest, context: any) {
  const idStr = getIdFromContext(context);
  const ctx = await getTenantContext(req);

  if (!ctx.ok) return noStoreJson({ error: "No autorizado" }, { status: 401 });

  if (!ctx.isSuperadmin && !ctx.isAdmin) {
    return noStoreJson(
      { error: "Solo SUPERADMIN o ADMIN pueden eliminar lugares" },
      { status: 403 }
    );
  }

  const idNum = Number(idStr);
  if (!idStr || !Number.isFinite(idNum))
    return noStoreJson({ error: "ID inválido" }, { status: 400 });

  let where: any;
  try {
    where = buildLugarWhere(ctx, idNum);
  } catch (e: any) {
    if (e.message === "NO_PERMITIDO") {
      return noStoreJson(
        { error: "Solo SUPERADMIN o ADMIN pueden eliminar lugares" },
        { status: 403 }
      );
    }
    return noStoreJson(
      { error: "Configuración de tenant inválida" },
      { status: 400 }
    );
  }

  const existente = await prisma.lugar.findFirst({ where });
  if (!existente)
    return noStoreJson({ error: "Lugar no encontrado" }, { status: 404 });

  try {
    await prisma.lugar.update({
      where: { id: existente.id },
      data: { ocultoParaAdmin: true },
    });

    return noStoreJson({ ok: true });
  } catch (e) {
    console.error("Error eliminando lugar:", e);
    return noStoreJson(
      { error: "Error al eliminar (ocultar) lugar" },
      { status: 500 }
    );
  }
}
