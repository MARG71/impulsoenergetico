// src/app/(crm)/api/lugares/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getTenantContext } from "@/lib/tenant";

export const runtime = "nodejs";

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

function tenantWhere(tenantAdminId: number | null) {
  return tenantAdminId ? { adminId: tenantAdminId } : {};
}

// GET /api/lugares?take=6&skip=0&q=...&agenteId=...&adminId=... (adminId solo superadmin)
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { isSuperadmin, isAdmin, isAgente, isLugar, tenantAdminId, agenteId, lugarId } = ctx;

    // ✅ Permitimos leer a roles del CRM
    if (!(isSuperadmin || isAdmin || isAgente || isLugar)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const take = Number(searchParams.get("take") ?? 50);
    const skip = Number(searchParams.get("skip") ?? 0);
    const q = searchParams.get("q")?.trim() ?? "";
    const agenteIdParam = searchParams.get("agenteId");

    const where: Prisma.LugarWhereInput = {
      ...tenantWhere(tenantAdminId),
    };

    // ✅ Si es AGENTE: solo sus lugares
    if (isAgente) {
      if (!agenteId) return NextResponse.json({ error: "AGENTE sin agenteId asociado" }, { status: 400 });
      where.agenteId = agenteId;
    }

    // ✅ Si es LUGAR: solo su lugar
    if (isLugar) {
      if (!lugarId) return NextResponse.json({ error: "LUGAR sin lugarId asociado" }, { status: 400 });
      where.id = lugarId;
    }

    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { direccion: { contains: q, mode: "insensitive" } },
        { qrCode: { contains: q, mode: "insensitive" } },
      ];
    }

    // Filtro agenteIdParam: solo si NO es LUGAR (porque LUGAR ya está fijado)
    if (!isLugar && agenteIdParam) {
      const aId = Number(agenteIdParam);
      if (!Number.isNaN(aId)) where.agenteId = aId;
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

    return NextResponse.json(lugares);
  } catch (error: any) {
    console.error("[API][lugares][GET]", error);
    return NextResponse.json({ error: error.message ?? "Error al obtener lugares" }, { status: 500 });
  }
}

// POST /api/lugares (ADMIN o SUPERADMIN en modo tenant)
export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { isAdmin, isSuperadmin, tenantAdminId, userId } = ctx;

    if (!(isAdmin || isSuperadmin)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // SUPERADMIN debe crear dentro de un tenant concreto
    if (isSuperadmin && !tenantAdminId) {
      return NextResponse.json(
        { error: "SUPERADMIN debe indicar ?adminId=... para crear lugares dentro de un tenant" },
        { status: 400 }
      );
    }

    const targetAdminId = isAdmin ? userId! : tenantAdminId!;

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

    // ✅ Agente debe existir y ser del mismo tenant
    const agente = await prisma.agente.findFirst({
      where: { id: agenteId, adminId: targetAdminId },
      select: { id: true },
    });
    if (!agente) return NextResponse.json({ error: "Agente no encontrado o no pertenece a tu admin" }, { status: 404 });

    const lugar = await prisma.lugar.create({
      data: {
        nombre,
        direccion,
        qrCode,
        agenteId,
        adminId: targetAdminId, // ✅ TENANT
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
    console.error("[API][lugares][POST]", error);
    return NextResponse.json({ error: error.message ?? "Error al crear lugar" }, { status: 500 });
  }
}
