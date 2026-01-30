// src/app/api/crm/clientes/route.ts
// src/app/api/crm/clientes/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function jsonError(status: number, message: string, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant.ok) return jsonError(tenant.status, tenant.error);

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  // 🔒 Multi-tenant: si tenantAdminId es null (SUPERADMIN global), no filtramos por adminId
  const where: any = {};
  if (tenant.tenantAdminId != null) where.adminId = tenant.tenantAdminId;

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { telefono: { contains: q, mode: "insensitive" } },
    ];
  }

  try {
    const items = await prisma.cliente.findMany({
      where,
      orderBy: { id: "desc" }, // ✅ robusto (no depende de creadoEn/createdAt)
      take: 200,
      include: {
        contrataciones: {
          orderBy: { id: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("GET /api/crm/clientes error:", e);
    return jsonError(500, "Error cargando clientes");
  }
}
