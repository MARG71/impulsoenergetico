export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole } from "@/lib/auth-server";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

function parseId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toPct(v: any) {
  // acepta "80", 80, "80,5"
  const s = String(v ?? "").replace(",", ".").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const session = await getSessionOrThrow();
  const role = String(sessionRole(session) ?? "").toUpperCase();
  if (role !== "SUPERADMIN") return jsonError("No autorizado", 403);

  const { searchParams } = new URL(req.url);
  const seccionId = parseId(searchParams.get("seccionId"));
  const subSeccionId = parseId(searchParams.get("subSeccionId"));

  if (!seccionId) return jsonError("seccionId requerido", 400);

  const rows = await prisma.configNivelComision.findMany({
    where: {
      adminId: null,
      seccionId,
      subSeccionId: subSeccionId ?? null,
      activa: true,
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ ok: true, rows });
}

export async function PUT(req: Request) {
  const session = await getSessionOrThrow();
  const role = String(sessionRole(session) ?? "").toUpperCase();
  if (role !== "SUPERADMIN") return jsonError("No autorizado", 403);

  const body = await req.json().catch(() => ({}));
  const seccionId = parseId(body?.seccionId);
  const subSeccionId = parseId(body?.subSeccionId);

  if (!seccionId) return jsonError("seccionId requerido", 400);

  const c1 = toPct(body?.C1);
  const c2 = toPct(body?.C2);
  const c3 = toPct(body?.C3);
  const esp = toPct(body?.ESPECIAL);

  if ([c1, c2, c3, esp].some((x) => x === null)) {
    return jsonError("Porcentajes inválidos (C1/C2/C3/ESPECIAL)", 400);
  }

  const upserts = [
    { nivel: "C1", pct: c1! },
    { nivel: "C2", pct: c2! },
    { nivel: "C3", pct: c3! },
    { nivel: "ESPECIAL", pct: esp! },
  ];

  await prisma.$transaction(async (tx) => {
    for (const it of upserts) {
      const existing = await tx.configNivelComision.findFirst({
        where: {
          adminId: null,
          seccionId,
          subSeccionId: subSeccionId ?? null,
          nivel: it.nivel as any,
        },
      });

      if (existing) {
        await tx.configNivelComision.update({
          where: { id: existing.id },
          data: { pctSobreBase: it.pct as any, activa: true },
        });
      } else {
        await tx.configNivelComision.create({
          data: {
            adminId: null,
            seccionId,
            subSeccionId: subSeccionId ?? null,
            nivel: it.nivel as any,
            pctSobreBase: it.pct as any,
            activa: true,
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
