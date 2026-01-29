import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireRole } from "@/lib/authz";

function toDecimalOrNull(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return n;
}

export async function GET(req: Request) {
  const auth = await requireRole(["PROPIETARIO"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const seccionId = searchParams.get("seccionId");
  const subSeccionId = searchParams.get("subSeccionId");

  const where: any = {};
  if (seccionId) where.seccionId = Number(seccionId);
  if (subSeccionId) where.subSeccionId = subSeccionId === "null" ? null : Number(subSeccionId);

  const data = await prisma.reglaComisionGlobal.findMany({
    where,
    orderBy: [{ seccionId: "asc" }, { subSeccionId: "asc" }, { nivel: "asc" }],
    include: { seccion: true, subSeccion: true },
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireRole(["PROPIETARIO"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const seccionId = Number(body?.seccionId);
  const subSeccionId = body?.subSeccionId === null || body?.subSeccionId === undefined
    ? null
    : Number(body.subSeccionId);

  const nivel = String(body?.nivel || "");
  const tipo = String(body?.tipo || "");

  if (!seccionId || !nivel || !tipo) {
    return NextResponse.json({ error: "seccionId, nivel y tipo son obligatorios" }, { status: 400 });
  }

  try {
    const created = await prisma.reglaComisionGlobal.create({
      data: {
        seccionId,
        subSeccionId,
        nivel: nivel as any,
        tipo: tipo as any,

        fijoEUR: toDecimalOrNull(body?.fijoEUR) as any,
        porcentaje: toDecimalOrNull(body?.porcentaje) as any,

        minEUR: toDecimalOrNull(body?.minEUR) as any,
        maxEUR: toDecimalOrNull(body?.maxEUR) as any,

        minAgenteEUR: toDecimalOrNull(body?.minAgenteEUR) as any,
        maxAgenteEUR: toDecimalOrNull(body?.maxAgenteEUR) as any,
        minLugarEspecialEUR: toDecimalOrNull(body?.minLugarEspecialEUR) as any,
        maxLugarEspecialEUR: toDecimalOrNull(body?.maxLugarEspecialEUR) as any,

        activa: body?.activa ?? true,
      },
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "No se pudo crear (ya existe esa combinación?)" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireRole(["PROPIETARIO"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const data: any = {};
  if (body.tipo !== undefined) data.tipo = String(body.tipo);
  if (body.nivel !== undefined) data.nivel = String(body.nivel);

  // valores
  if (body.fijoEUR !== undefined) data.fijoEUR = toDecimalOrNull(body.fijoEUR);
  if (body.porcentaje !== undefined) data.porcentaje = toDecimalOrNull(body.porcentaje);
  if (body.minEUR !== undefined) data.minEUR = toDecimalOrNull(body.minEUR);
  if (body.maxEUR !== undefined) data.maxEUR = toDecimalOrNull(body.maxEUR);

  if (body.minAgenteEUR !== undefined) data.minAgenteEUR = toDecimalOrNull(body.minAgenteEUR);
  if (body.maxAgenteEUR !== undefined) data.maxAgenteEUR = toDecimalOrNull(body.maxAgenteEUR);
  if (body.minLugarEspecialEUR !== undefined) data.minLugarEspecialEUR = toDecimalOrNull(body.minLugarEspecialEUR);
  if (body.maxLugarEspecialEUR !== undefined) data.maxLugarEspecialEUR = toDecimalOrNull(body.maxLugarEspecialEUR);

  if (body.activa !== undefined) data.activa = Boolean(body.activa);

  try {
    const updated = await prisma.reglaComisionGlobal.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}
