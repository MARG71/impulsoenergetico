import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { MarketingTipo, Prisma } from "@prisma/client";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function getRole(session: Session | null): Rol | null {
  const role = (session?.user as { role?: Rol } | undefined)?.role;
  return role ?? null;
}

function isValidUrlOrPath(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/")
  );
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No auth" }, { status: 401 });

    const role = getRole(session);

    const { searchParams } = new URL(req.url);
    const lugarId = Number(searchParams.get("lugarId"));
    const adminIdParam = searchParams.get("adminId");
    const adminId = adminIdParam ? Number(adminIdParam) : null;

    if (!Number.isFinite(lugarId) || lugarId <= 0) {
      return NextResponse.json({ error: "lugarId requerido" }, { status: 400 });
    }

    const where: Prisma.MarketingAssetWhereInput = { lugarId };

    // SUPERADMIN puede consultar "en modo tenant" por adminId
    if (role === "SUPERADMIN" && adminId && Number.isFinite(adminId)) {
      where.adminId = adminId;
    }

    const assets = await prisma.marketingAsset.findMany({
      where,
      orderBy: { creadaEn: "desc" },
    });

    return NextResponse.json({ assets });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No auth" }, { status: 401 });

    const role = getRole(session);
    const canManage = role === "ADMIN" || role === "SUPERADMIN";
    if (!canManage) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const body = (await req.json()) as {
      lugarId?: number | string;
      tipo?: MarketingTipo | string;
      url?: string;
      nombre?: string | null;

      // cloudinary opcional
      publicId?: string | null;
      resourceType?: string | null;
      mime?: string | null;
      size?: number | null;

      // tenant opcional
      adminId?: number | string | null;
      agenteId?: number | string | null;
    };

    const lugarId = Number(body?.lugarId);
    const url = String(body?.url ?? "");
    const tipoStr = String(body?.tipo ?? "");

    if (!Number.isFinite(lugarId) || lugarId <= 0 || !url || !tipoStr) {
      return NextResponse.json({ error: "Faltan campos (lugarId, tipo, url)" }, { status: 400 });
    }

    if (!isValidUrlOrPath(url)) {
      return NextResponse.json(
        { error: "URL inválida (http/https o /...)" },
        { status: 400 }
      );
    }

    // Validar tipo
    const tipo = Object.values(MarketingTipo).includes(tipoStr as MarketingTipo)
      ? (tipoStr as MarketingTipo)
      : null;

    if (!tipo) {
      return NextResponse.json(
        { error: `tipo inválido. Usa: ${Object.values(MarketingTipo).join(", ")}` },
        { status: 400 }
      );
    }

    const data: Prisma.MarketingAssetUncheckedCreateInput = {
    lugarId,
    tipo,
    url,
    nombre: body?.nombre ? String(body.nombre) : null,

    publicId: body?.publicId ? String(body.publicId) : null,
    resourceType: body?.resourceType ? String(body.resourceType) : null,
    mime: body?.mime ? String(body.mime) : null,
    size: typeof body?.size === "number" ? body.size : null,
    };


    // SUPERADMIN puede asignar adminId/agenteId explícitos
    if (role === "SUPERADMIN") {
      const adminId = body?.adminId != null ? Number(body.adminId) : null;
      if (adminId && Number.isFinite(adminId)) {
        (data as any).adminId = adminId; // prisma createInput no tiene adminId directo por ser scalar con map; lo permite igual
      }

      const agenteId = body?.agenteId != null ? Number(body.agenteId) : null;
      if (agenteId && Number.isFinite(agenteId)) {
        (data as any).agenteId = agenteId;
      }
    }

    const created = await prisma.marketingAsset.create({ data });
    return NextResponse.json({ ok: true, created });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
