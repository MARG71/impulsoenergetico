import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { Prisma } from "@prisma/client";

function toDec(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return new Prisma.Decimal(n);
}

export async function GET() {
  // Roles con acceso a ver (filtraremos por rol)
  const auth = await requireRole(["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (auth.session?.user as any)?.role as string | undefined;
  const agenteId = (auth.session?.user as any)?.agenteId as number | undefined;
  const lugarId = (auth.session?.user as any)?.lugarId as number | undefined;

  // Base query
  const where: any = {};

  // 🔒 filtrado seguro por rol (si no tienes agenteId/lugarId en sesión, devolvemos vacío)
  if (role === "AGENTE") {
    if (!agenteId) return NextResponse.json([]);
    where.agenteId = agenteId;
  }
  if (role === "LUGAR") {
    if (!lugarId) return NextResponse.json([]);
    where.lugarId = lugarId;
  }

  const items = await prisma.contratacion.findMany({
    where,
    orderBy: { creadaEn: "desc" },
    include: {
      seccion: true,
      subSeccion: true,
      lead: true,
      cliente: true,
      agente: true,
      lugar: true,
      documentos: { orderBy: { creadoEn: "desc" } },
    },
    take: 200,
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN", "AGENTE"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (auth.session?.user as any)?.role as string | undefined;
  const agenteIdSession = (auth.session?.user as any)?.agenteId as number | undefined;

  const body = await req.json();

  const seccionId = Number(body?.seccionId);
  const subSeccionId = body?.subSeccionId ? Number(body.subSeccionId) : null;

  if (!seccionId) return NextResponse.json({ error: "seccionId requerido" }, { status: 400 });

  const payload: any = {
    estado: body?.estado ?? "BORRADOR",
    nivel: body?.nivel ?? "C1",
    seccionId,
    subSeccionId,
    leadId: body?.leadId ? Number(body.leadId) : null,
    clienteId: body?.clienteId ? Number(body.clienteId) : null,
    lugarId: body?.lugarId ? Number(body.lugarId) : null,
    notas: body?.notas ?? null,
    baseImponible: toDec(body?.baseImponible),
    totalFactura: toDec(body?.totalFactura),
  };

  // Si crea un AGENTE, forzamos su agenteId
  if (role === "AGENTE") {
    if (!agenteIdSession) return NextResponse.json({ error: "Agente sin agenteId" }, { status: 400 });
    payload.agenteId = agenteIdSession;
  } else {
    payload.agenteId = body?.agenteId ? Number(body.agenteId) : null;
  }

  const created = await prisma.contratacion.create({
    data: payload,
  });

  return NextResponse.json(created);
}

// PATCH: editar / cambiar estado. Al CONFIRMAR => crea/vincula Cliente desde Lead
export async function PATCH(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN", "AGENTE"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (auth.session?.user as any)?.role as string | undefined;
  const agenteIdSession = (auth.session?.user as any)?.agenteId as number | undefined;

  const body = await req.json();
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const existing = await prisma.contratacion.findUnique({
    where: { id },
    include: { lead: true },
  });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  // 🔒 AGENTE solo puede tocar las suyas
  if (role === "AGENTE") {
    if (!agenteIdSession || existing.agenteId !== agenteIdSession) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // AGENTE no puede CONFIRMAR/CANCELAR (solo admin/superadmin)
    if (body?.estado === "CONFIRMADA" || body?.estado === "CANCELADA") {
      return NextResponse.json({ error: "Solo admin puede confirmar/cancelar" }, { status: 403 });
    }
  }

  const nextEstado = body?.estado as string | undefined;

  // update normal
  const updated = await prisma.contratacion.update({
    where: { id },
    data: {
      estado: nextEstado ?? undefined,
      nivel: body?.nivel ?? undefined,
      notas: body?.notas ?? undefined,
      baseImponible: body?.baseImponible !== undefined ? toDec(body.baseImponible) : undefined,
      totalFactura: body?.totalFactura !== undefined ? toDec(body.totalFactura) : undefined,
      seccionId: body?.seccionId ? Number(body.seccionId) : undefined,
      subSeccionId: body?.subSeccionId === null ? null : (body?.subSeccionId ? Number(body.subSeccionId) : undefined),
      leadId: body?.leadId === null ? null : (body?.leadId ? Number(body.leadId) : undefined),
      lugarId: body?.lugarId === null ? null : (body?.lugarId ? Number(body.lugarId) : undefined),
      agenteId:
        role === "AGENTE"
          ? existing.agenteId
          : body?.agenteId === null
            ? null
            : (body?.agenteId ? Number(body.agenteId) : undefined),
    },
  });

  // ✅ Si admin/superadmin confirma: upsert cliente desde Lead y vincular
  if ((role === "ADMIN" || role === "SUPERADMIN") && nextEstado === "CONFIRMADA") {
    const lead = existing.leadId
      ? await prisma.lead.findUnique({ where: { id: existing.leadId } })
      : null;

    // Si no hay lead, confirmamos igual pero sin cliente
    if (!lead) {
      const final = await prisma.contratacion.update({
        where: { id },
        data: { confirmadaEn: new Date() },
      });
      return NextResponse.json(final);
    }

    const email = (lead as any).email?.trim() || null;
    const telefono = (lead as any).telefono?.trim() || null;
    const nombre = (lead as any).nombre?.trim() || "Cliente";

    // estrategia: buscar por email, si no por teléfono
    let cliente = null as any;

    if (email) cliente = await prisma.cliente.findFirst({ where: { email } });
    if (!cliente && telefono) cliente = await prisma.cliente.findFirst({ where: { telefono } });

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: { nombre, email, telefono },
      });
    } else {
      // actualiza nombre si estaba vacío
      if (!cliente.nombre || cliente.nombre === "Cliente") {
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: { nombre },
        });
      }
    }

    const final = await prisma.contratacion.update({
      where: { id },
      data: {
        clienteId: cliente.id,
        confirmadaEn: new Date(),
      },
    });

    return NextResponse.json(final);
  }

  return NextResponse.json(updated);
}
