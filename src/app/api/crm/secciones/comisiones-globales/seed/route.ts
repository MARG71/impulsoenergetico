import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

const NIVELES = ["C1", "C2", "C3", "ESPECIAL"] as const;

export async function POST(req: Request) {
  const auth = await requireRole(["SUPERADMIN"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const seccionId = Number(body?.seccionId);
  const rawSub = body?.subSeccionId;

  const subSeccionId =
    rawSub === null || rawSub === undefined || rawSub === "null" || rawSub === ""
      ? null
      : Number(rawSub);

  if (!seccionId) {
    return NextResponse.json({ error: "seccionId requerido" }, { status: 400 });
  }

  const data = NIVELES.map((nivel) => ({
    seccionId,
    subSeccionId,
    nivel: nivel as any,
    tipo: "PORC_BASE" as any, // default
    activa: true,
    fijoEUR: null,
    porcentaje: null,
    minEUR: null,
    maxEUR: null,
    minAgenteEUR: null,
    maxAgenteEUR: null,
    minLugarEspecialEUR: null,
    maxLugarEspecialEUR: null,
  }));

  // createMany + skipDuplicates evita el error por @@unique([seccionId, subSeccionId, nivel])
  const created = await prisma.reglaComisionGlobal.createMany({
    data,
    skipDuplicates: true,
  });

  return NextResponse.json({
    ok: true,
    inserted: created.count,
  });
}
