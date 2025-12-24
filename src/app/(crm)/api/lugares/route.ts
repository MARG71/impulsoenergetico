// src/app/(crm)/api/lugares/route.ts
// src/app/(crm)/api/lugares/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getTenantContext, requireRoles } from "@/lib/tenant";

const toPct = (v: any) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  const p = n > 1 ? n / 100 : n;
  return Math.max(0, Math.min(1, p));
};

const cleanStr = (v: any) => {
  if (v === undefined) return undefined;
  const s = String(v).trim();
  return s === "" ? null : s;
};

// GET /api/lugares
export async function GET(req: Request) {
  try {
    const ctx = await getTenantContext(req as any);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    if (!requireRoles(ctx.role, ["ADMIN", "SUPERADMIN", "AGENTE"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("take") ?? 6);
    const skip = Number(searchParams.get("skip") ?? 0);
    const q = searchParams.get("q")?.trim() ?? "";
    const agenteIdParam = searchParams.get("agenteId");

    const where: Prisma.LugarWhereInput = {};

    // 🔒 tenant
    if (ctx.tenantAdminId) where.adminId = ctx.tenantAdminId;

    // 🔒 si es AGENTE, solo sus lugares
    if (ctx.role === "AGENTE" && ctx.agenteId) {
      where.agenteId = ctx.agenteId;
    }

    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { direccion: { contains: q, mode: "insensitive" } },
        { qrCode: { contains: q, mode: "insensitive" } },
      ];
    }

    if (agenteIdParam && ctx.role !== "AGENTE") {
      const agenteId = Number(agenteIdParam);
      if (!Number.isNaN(agenteId)) where.agenteId = agenteId;
    }

    const lugares = await prisma.lugar.findMany({
      where,
      orderBy: { id: "desc" },
      take,
      skip,
      select: {
        id: true,
        nombre: true,
        direccion: true,
        qrCode: true,
        agenteId: true,
        pctLugar: true,
        pctCliente: true,
        adminId: true,
        agente: { select: { id: true, nombre: true, email: true } },
        especial: true,
        especialLogoUrl: true,
        especialColor: true,
        especialMensaje: true,
        especialCartelUrl: true,
        aportacionAcumulada: true,
      },
    });

    return NextResponse.json(lugares);
  } catch (error: any) {
    console.error("Error al obtener lugares:", error);
    return NextResponse.json({ error: error.message ?? "Error al obtener lugares" }, { status: 500 });
  }
}

// POST /api/lugares
export async function POST(req: Request) {
  try {
    const ctx = await getTenantContext(req as any);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    if (!requireRoles(ctx.role, ["ADMIN", "SUPERADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (ctx.role === "SUPERADMIN" && !ctx.tenantAdminId) {
      return NextResponse.json(
        { error: "SUPERADMIN debe indicar ?adminId=... para crear lugares dentro de un tenant" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const nombre = (body?.nombre ?? "").trim();
    const direccion = (body?.direccion ?? "").trim();
    const qrCode = (body?.qrCode ?? "").trim();
    const agenteId = Number(body?.agenteId);

    const pctCliente = toPct(body?.pctCliente);
    const pctLugar = toPct(body?.pctLugar);

    if (!nombre || !direccion || !qrCode || Number.isNaN(agenteId)) {
      return NextResponse.json(
        { error: "nombre, direccion, qrCode y agenteId son obligatorios" },
        { status: 400 }
      );
    }

    const adminId = ctx.tenantAdminId!;

    // Asegurar que el agente pertenece al tenant
    const agente = await prisma.agente.findFirst({
      where: { id: agenteId, adminId },
      select: { id: true },
    });
    if (!agente) return NextResponse.json({ error: "Agente no encontrado en este tenant" }, { status: 404 });

    const lugar = await prisma.lugar.create({
      data: {
        nombre,
        direccion,
        qrCode,
        agenteId,
        adminId, // ✅ tenant
        pctCliente,
        pctLugar,
        especial: !!body?.especial,
        especialLogoUrl: cleanStr(body?.especialLogoUrl) ?? null,
        especialColor: cleanStr(body?.especialColor) ?? null,
        especialMensaje: cleanStr(body?.especialMensaje) ?? null,
        especialCartelUrl: cleanStr(body?.especialCartelUrl) ?? null,
        aportacionAcumulada: Number(body?.aportacionAcumulada ?? 0),
      },
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
        especialCartelUrl: true,
        aportacionAcumulada: true,
      },
    });

    return NextResponse.json(lugar, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "qrCode ya existe" }, { status: 409 });
    }
    console.error("Error al crear lugar:", error);
    return NextResponse.json({ error: error.message ?? "Error al crear lugar" }, { status: 500 });
  }
}
