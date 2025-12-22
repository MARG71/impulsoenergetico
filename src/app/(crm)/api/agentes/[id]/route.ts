import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const toId = (v: string) => {
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error("ID inválido");
  return n;
};

const normPct = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n;
};

function tenantWhere(tenantAdminId: number | null) {
  return tenantAdminId ? { adminId: tenantAdminId } : {};
}

// GET /api/agentes/:id
export async function GET(req: NextRequest, ctx: any) {
  try {
    const id = toId(ctx.params.id);

    const t = await getTenantContext(req);
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

    const { isSuperadmin, isAdmin, isAgente, tenantAdminId, agenteId } = t;
    if (!(isSuperadmin || isAdmin || isAgente)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Si es AGENTE, solo puede acceder a su propio id
    if (isAgente && agenteId !== id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const agente = await prisma.agente.findFirst({
      where: { id, ...tenantWhere(tenantAdminId) },
      select: { id: true, nombre: true, email: true, telefono: true, pctAgente: true, adminId: true },
    });

    if (!agente) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    return NextResponse.json(agente);
  } catch (e: any) {
    const msg = e?.message ?? "Error";
    return NextResponse.json({ error: msg }, { status: msg.includes("ID inválido") ? 400 : 500 });
  }
}

// PUT /api/agentes/:id
export async function PUT(req: NextRequest, ctx: any) {
  try {
    const id = toId(ctx.params.id);

    const t = await getTenantContext(req);
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

    const { isSuperadmin, isAdmin, tenantAdminId } = t;
    if (!(isSuperadmin || isAdmin)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que pertenece al tenant
    const existe = await prisma.agente.findFirst({
      where: { id, ...tenantWhere(tenantAdminId) },
      select: { id: true },
    });
    if (!existe) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

    const b = await req.json();
    const data: any = {};

    if (b?.nombre !== undefined) data.nombre = String(b.nombre).trim();
    if (b?.email !== undefined) data.email = String(b.email).trim().toLowerCase();
    if (b?.telefono !== undefined) data.telefono = String(b.telefono).trim();
    if (b?.pctAgente !== undefined) {
      const p = normPct(b.pctAgente);
      if (p === undefined) return NextResponse.json({ error: "pctAgente inválido" }, { status: 400 });
      data.pctAgente = p;
    }

    const up = await prisma.agente.update({
      where: { id },
      data,
      select: { id: true, nombre: true, email: true, telefono: true, pctAgente: true, adminId: true },
    });

    return NextResponse.json(up);
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Email ya en uso" }, { status: 409 });
    const msg = e?.message ?? "Error";
    return NextResponse.json({ error: msg }, { status: msg.includes("ID inválido") ? 400 : 500 });
  }
}

// DELETE /api/agentes/:id
export async function DELETE(req: NextRequest, ctx: any) {
  try {
    const id = toId(ctx.params.id);

    const t = await getTenantContext(req);
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });

    const { isSuperadmin, isAdmin, tenantAdminId } = t;
    if (!(isSuperadmin || isAdmin)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const existe = await prisma.agente.findFirst({
      where: { id, ...tenantWhere(tenantAdminId) },
      select: { id: true },
    });
    if (!existe) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

    await prisma.agente.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "Error";
    return NextResponse.json({ error: msg }, { status: msg.includes("ID inválido") ? 400 : 500 });
  }
}
