export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sp = req.nextUrl.searchParams;

  const lugarId = safeNumber(sp.get("lugarId"));
  const tipo = sp.get("tipo");      // A4_QR | ESPECIAL
  const accion = sp.get("accion");  // IMPRIMIR | DESCARGAR_PDF | DESCARGAR_PNG
  const limit = Math.min(safeNumber(sp.get("limit")) ?? 50, 200);

  // ✅ Soporte tenant para SUPERADMIN: /historial-carteles?adminId=1
  const adminIdQuery = safeNumber(sp.get("adminId"));

  const where: any = {};
  if (lugarId) where.lugarId = lugarId;
  if (tipo) where.tipo = tipo;
  if (accion) where.accion = accion;

  // ✅ Si NO es superadmin, solo ve su tenant
  if (!ctx.isSuperadmin) {
    if ((ctx as any).adminId) where.adminId = (ctx as any).adminId;
  } else {
    // ✅ Si es superadmin y viene adminId en la URL, filtramos por ese tenant
    if (adminIdQuery) where.adminId = adminIdQuery;
  }

  // ✅ PRIVACIDAD: solo SUPERADMIN recibe creadoPor
  const include: any = {
    fondo: { select: { id: true, nombre: true, url: true } },
    lugar: { select: { id: true, nombre: true, direccion: true } },
  };

  if (ctx.isSuperadmin) {
    include.creadoPor = { select: { id: true, nombre: true, email: true, rol: true } };
  }

  const data = await prisma.cartelGenerado.findMany({
    where,
    orderBy: { creadoEn: "desc" },
    take: limit,
    include,
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const lugarId = safeNumber(body?.lugarId);
  const fondoId = safeNumber(body?.fondoId);

  const tipo = String(body?.tipo ?? "");
  const accion = String(body?.accion ?? "");

  if (!lugarId) return NextResponse.json({ error: "lugarId inválido" }, { status: 400 });
  if (!["A4_QR", "ESPECIAL"].includes(tipo))
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  if (!["IMPRIMIR", "DESCARGAR_PDF", "DESCARGAR_PNG"].includes(accion))
    return NextResponse.json({ error: "accion inválida" }, { status: 400 });

  const fondoUrlSnap = body?.fondoUrlSnap ? String(body.fondoUrlSnap) : null;
  const qrUrlSnap = body?.qrUrlSnap ? String(body.qrUrlSnap) : null;

  const creadoPorId = (ctx as any).userId ? Number((ctx as any).userId) : null;

  // ✅ AdminId: SUPERADMIN puede forzar tenant vía body.adminId, el resto NO
  const adminIdBody = safeNumber(body?.adminId);
  const adminId = ctx.isSuperadmin
    ? (adminIdBody ?? null)
    : ((ctx as any).adminId ?? null);

  const created = await prisma.cartelGenerado.create({
    data: {
      tipo: tipo as any,
      accion: accion as any,
      lugarId,
      fondoId: fondoId ?? null,
      fondoUrlSnap,
      qrUrlSnap,
      creadoPorId,
      adminId,
    },
  });

  return NextResponse.json({ ok: true, cartel: created }, { status: 201 });
}
