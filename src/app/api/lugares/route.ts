// ✅ src/app/api/lugares/route.ts
// ✅ src/app/api/lugares/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { NivelComision } from "@prisma/client";

// Helpers
function toPct(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  if (Number.isNaN(n)) return null;
  // Si viene 15 => 0.15
  return n > 1 ? n / 100 : n;
}

function toIntOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const NIVELES_VALIDOS = ["C1", "C2", "C3", "ESPECIAL"] as const;

function normalizeNivelComision(
  input: any,
  fallback: NivelComision
): NivelComision {
  const v = String(input ?? "").toUpperCase().trim();
  if ((NIVELES_VALIDOS as readonly string[]).includes(v)) {
    return v as NivelComision;
  }
  return fallback;
}

/**
 * GET /api/lugares
 */
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const {
    isSuperadmin,
    isAdmin,
    isAgente,
    isLugar,
    tenantAdminId,
    agenteId,
    lugarId,
  } = ctx;

  const url = req.nextUrl;
  const modo = url.searchParams.get("modo"); // "soloOcultos" | "todos"
  const incluirOcultos = url.searchParams.get("incluirOcultos") === "1";

  const where: any = {};

  // Por defecto NO mostramos ocultos
  if (modo === "soloOcultos") {
    where.ocultoParaAdmin = true;
  } else if (!incluirOcultos) {
    where.ocultoParaAdmin = false;
  }

  if (isSuperadmin) {
    if (tenantAdminId) where.adminId = tenantAdminId;
  } else if (isAdmin) {
    if (!tenantAdminId) {
      return NextResponse.json(
        { error: "Config de tenant inválida para ADMIN (sin tenantAdminId)" },
        { status: 400 }
      );
    }
    where.adminId = tenantAdminId;
  } else if (isAgente) {
    if (!agenteId) {
      return NextResponse.json(
        { error: "Este usuario no tiene agenteId asociado" },
        { status: 400 }
      );
    }
    where.agenteId = agenteId;
    if (tenantAdminId) where.adminId = tenantAdminId;
  } else if (isLugar) {
    if (!lugarId) {
      return NextResponse.json(
        { error: "Este usuario LUGAR no tiene lugarId asociado" },
        { status: 400 }
      );
    }
    where.id = lugarId;
  } else {
    return NextResponse.json(
      { error: "Rol no autorizado para ver lugares" },
      { status: 403 }
    );
  }

  const lugares = await prisma.lugar.findMany({
    where,
    orderBy: { id: "asc" },
    include: {
      agente: {
        select: { id: true, nombre: true, email: true, telefono: true },
      },
    },
  });

  return NextResponse.json(lugares);
}

/**
 * POST /api/lugares
 */
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { isSuperadmin, isAdmin, isAgente, tenantAdminId, userId } = ctx;

  if (!isSuperadmin && !isAdmin && !isAgente) {
    return NextResponse.json(
      { error: "Solo SUPERADMIN, ADMIN o AGENTE pueden crear lugares" },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as any;

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
    adminSeleccionado, // 👈 SUPERADMIN global
    nivelComisionDefault,
  } = body || {};

  if (!nombre || !direccion || !qrCode || !agenteId) {
    return NextResponse.json(
      { error: "Nombre, dirección, QR y agente son obligatorios" },
      { status: 400 }
    );
  }

  // 1) Resolver adminId dueño del lugar (tenant)
  let adminId: number | null = null;

  if (isSuperadmin) {
    if (tenantAdminId) {
      adminId = tenantAdminId;
    } else {
      const adminSelNum = toIntOrNull(adminSeleccionado);
      if (!adminSelNum) {
        return NextResponse.json(
          {
            error:
              "Como SUPERADMIN debes indicar ?adminId=... o seleccionar un ADMIN propietario (adminSeleccionado) para crear el lugar.",
          },
          { status: 400 }
        );
      }
      adminId = adminSelNum;
    }
  } else if (isAdmin) {
    adminId = tenantAdminId ?? toIntOrNull(userId) ?? null;
  } else if (isAgente) {
    adminId = tenantAdminId ?? null;
  }

  if (!adminId) {
    return NextResponse.json(
      { error: "No se ha podido determinar el adminId (tenant) del lugar." },
      { status: 400 }
    );
  }

  // 2) Validar agenteId
  const agenteIdNum = toIntOrNull(agenteId);
  if (!agenteIdNum) {
    return NextResponse.json({ error: "agenteId inválido" }, { status: 400 });
  }

  // 3) Comprobar que el agente existe y pertenece al adminId
  const agente = await prisma.agente.findUnique({
    where: { id: agenteIdNum },
    select: { id: true, adminId: true },
  });

  if (!agente) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 400 });
  }

  if (agente.adminId && agente.adminId !== adminId) {
    return NextResponse.json(
      { error: "El agente seleccionado no pertenece al ADMIN indicado." },
      { status: 400 }
    );
  }

  // 4) Crear lugar
  try {
    const nuevoLugar = await prisma.lugar.create({
      data: {
        nombre: String(nombre).trim(),
        direccion: String(direccion).trim(),
        qrCode: String(qrCode).trim(),
        agenteId: agenteIdNum,

        pctCliente: toPct(pctCliente),
        pctLugar: toPct(pctLugar),

        especial: !!especial,
        especialLogoUrl: especial ? (especialLogoUrl || null) : null,
        especialColor: especial ? (especialColor || null) : null,
        especialMensaje: especial ? (especialMensaje || null) : null,

        aportacionAcumulada: Number.isFinite(Number(aportacionAcumulada))
          ? Number(aportacionAcumulada)
          : 0,

        especialCartelUrl:
          especial && especialCartelUrl ? String(especialCartelUrl) : null,

        // ✅ NIVEL DEFAULT (clave)
        nivelComisionDefault: normalizeNivelComision(
          nivelComisionDefault,
          especial ? NivelComision.ESPECIAL : NivelComision.C1
        ),

        adminId,
      },
      include: {
        agente: { select: { id: true, nombre: true, email: true, telefono: true } },
      },
    });

    return NextResponse.json(nuevoLugar, { status: 201 });
  } catch (e: any) {
    console.error("Error creando lugar:", e);
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "El código QR ya está en uso por otro lugar." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error interno creando lugar" },
      { status: 500 }
    );
  }
}
