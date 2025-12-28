// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function toInt(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const role = (token as any).role as Rol | undefined;

    const userId = toInt((token as any).id);
    const agenteId = toInt((token as any).agenteId);
    const lugarId = toInt((token as any).lugarId);
    const tokenAdminId = toInt((token as any).adminId); // para AGENTE/LUGAR/CLIENTE

    // ✅ Tenant target
    // - SUPERADMIN: global o filtrado por query ?adminId=...
    // - ADMIN: siempre tenant = su propio id
    // - AGENTE/LUGAR: siempre tenant = token.adminId (el admin dueño)
    const qAdminId = toInt(req.nextUrl.searchParams.get("adminId"));

    let tenantAdminId: number | null = null;

    if (role === "SUPERADMIN") {
      tenantAdminId = qAdminId; // si null => global
    } else if (role === "ADMIN") {
      tenantAdminId = userId; // el admin es dueño de su tenant
    } else {
      tenantAdminId = tokenAdminId; // agente/lugar pertenecen a un admin
    }

    const take = 200;

    const base = {
      role,
      tenantAdminId, // 👈 para debug visual
      user: {
        id: userId,
        name: (token as any).name ?? null,
        email: (token as any).email ?? null,
        adminId: tokenAdminId,
        agenteId,
        lugarId,
      },
    };

    // ✅ helper: where por tenant (si hay tenantAdminId)
    const byTenant = <T extends object>(where: T) => {
      if (!tenantAdminId) return where; // SUPERADMIN global
      return { ...where, adminId: tenantAdminId } as T & { adminId: number };
    };

    // ======================
    // SUPERADMIN / ADMIN
    // ======================
    if (role === "SUPERADMIN" || role === "ADMIN") {
      const [comparativas, agentes, lugares, leads, ofertas] = await Promise.all([
        prisma.comparativa.findMany({
          where: byTenant({}),
          orderBy: { fecha: "desc" },
          take,
          include: {
            cliente: true,
            agente: { select: { id: true, nombre: true, email: true, telefono: true } },
            lugar: { select: { id: true, nombre: true, direccion: true } },
          },
        }),

        // 🔹 SOLO agentes visibles (no ocultos) para que el dashboard cuente "activos" reales
        prisma.agente.findMany({
          where: byTenant({ ocultoParaAdmin: false }),
          orderBy: { id: "asc" },
          select: { id: true, nombre: true, email: true, telefono: true },
        }),

        prisma.lugar.findMany({
          where: byTenant({}),
          orderBy: { id: "asc" },
          include: { agente: { select: { id: true, nombre: true } } },
        }),

        prisma.lead.findMany({
          where: byTenant({}),
          orderBy: { creadoEn: "desc" },
          take,
          include: {
            agente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true } },
          },
        }),

        prisma.oferta.findMany({
          where: byTenant({}),
          orderBy: { creadaEn: "desc" },
          take: 50,
        }),
      ]);

      return NextResponse.json({ ...base, comparativas, agentes, lugares, leads, ofertas });
    }

    // ======================
    // AGENTE
    // ======================
    if (role === "AGENTE") {
      if (!agenteId) {
        return NextResponse.json(
          { ...base, error: "Este usuario AGENTE no tiene agenteId asociado" },
          { status: 400 }
        );
      }
      if (!tenantAdminId) {
        return NextResponse.json(
          { ...base, error: "Este usuario AGENTE no tiene adminId (tenant) asociado" },
          { status: 400 }
        );
      }

      const [comparativas, lugares, leads, ofertas, agente] = await Promise.all([
        prisma.comparativa.findMany({
          where: byTenant({ agenteId }),
          orderBy: { fecha: "desc" },
          take,
          include: {
            cliente: true,
            agente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true, direccion: true } },
          },
        }),

        prisma.lugar.findMany({
          where: byTenant({ agenteId }),
          orderBy: { id: "asc" },
        }),

        prisma.lead.findMany({
          where: byTenant({ agenteId }),
          orderBy: { creadoEn: "desc" },
          take,
          include: {
            agente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true } },
          },
        }),

        prisma.oferta.findMany({
          where: byTenant({ activa: true }),
          orderBy: { creadaEn: "desc" },
          take: 50,
        }),

        prisma.agente.findUnique({
          where: { id: agenteId },
          select: { id: true, nombre: true, email: true, telefono: true },
        }),
      ]);

      return NextResponse.json({
        ...base,
        comparativas,
        lugares,
        leads,
        ofertas,
        agentes: agente ? [agente] : [],
      });
    }

    // ======================
    // LUGAR
    // ======================
    if (role === "LUGAR") {
      if (!lugarId) {
        return NextResponse.json(
          { ...base, error: "Este usuario LUGAR no tiene lugarId asociado" },
          { status: 400 }
        );
      }
      if (!tenantAdminId) {
        return NextResponse.json(
          { ...base, error: "Este usuario LUGAR no tiene adminId (tenant) asociado" },
          { status: 400 }
        );
      }

      const lugar = await prisma.lugar.findUnique({
        where: { id: lugarId },
        include: {
          agente: { select: { id: true, nombre: true, email: true, telefono: true } },
        },
      });

      const [comparativas, leads, ofertas] = await Promise.all([
        prisma.comparativa.findMany({
          where: byTenant({ lugarId }),
          orderBy: { fecha: "desc" },
          take,
          include: {
            cliente: true,
            agente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true } },
          },
        }),

        prisma.lead.findMany({
          where: byTenant({ lugarId }),
          orderBy: { creadoEn: "desc" },
          take,
          include: {
            agente: { select: { id: true, nombre: true } },
            lugar: { select: { id: true, nombre: true } },
          },
        }),

        prisma.oferta.findMany({
          where: byTenant({ activa: true }),
          orderBy: { creadaEn: "desc" },
          take: 50,
        }),
      ]);

      return NextResponse.json({
        ...base,
        lugar,
        lugares: lugar ? [lugar] : [],
        comparativas,
        leads,
        ofertas,
        agentes: lugar?.agente ? [lugar.agente] : [],
      });
    }

    return NextResponse.json({ ...base, error: "Rol no reconocido" }, { status: 403 });
  } catch (err) {
    console.error("[API][dashboard] error:", err);
    return NextResponse.json({ error: "Error cargando dashboard" }, { status: 500 });
  }
}
