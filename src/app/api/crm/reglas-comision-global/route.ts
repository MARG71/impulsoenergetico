export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const seccionId = Number(url.searchParams.get("seccionId") ?? 0);
  const subSeccionId = url.searchParams.get("subSeccionId");
  const nivel = url.searchParams.get("nivel");

  const ctx = await getTenantContext((req as any));
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const where: any = {};
  if (seccionId) where.seccionId = seccionId;
  if (subSeccionId != null && subSeccionId !== "") where.subSeccionId = Number(subSeccionId);
  if (nivel) where.nivel = nivel;

  const reglas = await prisma.reglaComisionGlobal.findMany({
    where,
    orderBy: [{ seccionId: "asc" }, { subSeccionId: "asc" }, { nivel: "asc" }],
    include: { seccion: true, subSeccion: true },
  });

  return NextResponse.json({ reglas });
}

export async function POST(req: Request) {
  const ctx = await getTenantContext((req as any));
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  if (!ctx.isSuperadmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => ({}));

  const seccionId = Number(body?.seccionId);
  const subSeccionId = body?.subSeccionId != null ? Number(body.subSeccionId) : null;
  const nivel = String(body?.nivel ?? "");
  const tipo = String(body?.tipo ?? "");

  if (!seccionId) return NextResponse.json({ error: "Falta seccionId" }, { status: 400 });
  if (!nivel) return NextResponse.json({ error: "Falta nivel" }, { status: 400 });
  if (!tipo) return NextResponse.json({ error: "Falta tipo" }, { status: 400 });

  const created = await prisma.reglaComisionGlobal.create({
    data: {
      seccionId,
      subSeccionId,
      nivel: nivel as any,
      tipo: tipo as any,

      fijoEUR: body?.fijoEUR ?? null,
      porcentaje: body?.porcentaje ?? null,

      minEUR: body?.minEUR ?? null,
      maxEUR: body?.maxEUR ?? null,

      minAgenteEUR: body?.minAgenteEUR ?? null,
      maxAgenteEUR: body?.maxAgenteEUR ?? null,
      minLugarEspecialEUR: body?.minLugarEspecialEUR ?? null,
      maxLugarEspecialEUR: body?.maxLugarEspecialEUR ?? null,

      activa: body?.activa ?? true,
    },
  });

  return NextResponse.json({ ok: true, regla: created });
}

export async function PATCH(req: Request) {
  const ctx = await getTenantContext((req as any));
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  if (!ctx.isSuperadmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const data: any = {};
  const fields = [
    "seccionId","subSeccionId","nivel","tipo",
    "fijoEUR","porcentaje","minEUR","maxEUR",
    "minAgenteEUR","maxAgenteEUR","minLugarEspecialEUR","maxLugarEspecialEUR",
    "activa",
  ] as const;

  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  const updated = await prisma.reglaComisionGlobal.update({ where: { id }, data });
  return NextResponse.json({ ok: true, regla: updated });
}
