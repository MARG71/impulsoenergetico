//src/app/api/crm/comisiones/importar-excel/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole } from "@/lib/auth-server";
import * as XLSX from "xlsx";

const CONSUMO_HASTA_MAX = 999999999;

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeKey(k: string) {
  return String(k ?? "")
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[().]/g, "")
    .replace(/€/g, "eur");
}

function parseEuro(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;

  const s = String(v)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.\-]/g, "");

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseRangeNums(text: any) {
  const s = String(text ?? "")
    .replace(/\u00a0/g, " ")
    .trim();

  const nums = s
    .split(/≤|>=|<=|<|>|=|\s+/g)
    .map((x) =>
      Number(
        x
          .replace(/\./g, "")
          .replace(",", ".")
          .replace(/[^0-9.\-]/g, "")
      )
    )
    .filter(Number.isFinite);

  if (nums.length >= 2) return { min: nums[0], max: nums[1] };
  if (nums.length === 1) return { min: nums[0], max: null };

  return { min: null, max: null };
}

async function ensureDefaultConfig(seccionId: number) {
  const existing = await prisma.configNivelComision.findFirst({
    where: { adminId: null, seccionId },
  });

  if (existing) return;

  await prisma.configNivelComision.createMany({
    data: [
      { seccionId, nivel: "C1", pctSobreBase: 80 },
      { seccionId, nivel: "C2", pctSobreBase: 90 },
      { seccionId, nivel: "C3", pctSobreBase: 100 },
      { seccionId, nivel: "ESPECIAL", pctSobreBase: 110 },
    ] as any,
  });
}

async function getPctForNivel(seccionId: number) {
  const rows = await prisma.configNivelComision.findMany({
    where: { seccionId, adminId: null },
  });

  const find = (nivel: string) =>
    Number(rows.find((r: any) => r.nivel === nivel)?.pctSobreBase ?? 0);

  return {
    C1: find("C1"),
    C2: find("C2"),
    C3: find("C3"),
    ESPECIAL: find("ESPECIAL"),
  };
}

export async function POST(req: Request) {

  const session = await getSessionOrThrow();
  const role = String(sessionRole(session) ?? "");

  if (role !== "SUPERADMIN")
    return jsonError("No autorizado", 403);

  const form = await req.formData();
  const file = form.get("file") as File;

  const seccionNombre = String(form.get("seccion") ?? "LUZ").toUpperCase();

  const buffer = Buffer.from(await file.arrayBuffer());

  const wb = XLSX.read(buffer);

  const sheet = wb.Sheets[wb.SheetNames[0]];

  const raw = XLSX.utils.sheet_to_json(sheet, { defval: null });

  const rows = raw.map((r: any) => {
    const out: any = {};
    for (const k in r) out[normalizeKey(k)] = r[k];
    return out;
  });

  const seccion = await prisma.seccion.upsert({

    where: { slug: slugify(seccionNombre) },

    update: {},

    create: {
      nombre: seccionNombre,
      slug: slugify(seccionNombre),
    },

  });

  await ensureDefaultConfig(seccion.id);

  let createdRules = 0;

  for (const r of rows) {

    const compania = String(r.compania ?? r.compañia ?? "");

    const tarifa = String(r.tarifa ?? "");

    const nombre = String(r.nombre ?? "");

    const comisionBaseEUR = parseEuro(r.comision);

    const consumo = parseRangeNums(r.consumo);

    const consumoDesde = consumo.min ?? 0;

    const consumoHasta =
      consumo.max ?? CONSUMO_HASTA_MAX;

    const anexoPrecio =
      String(r.validez ?? "");

    const ofertaTarifa = await prisma.ofertaTarifa.upsert({

      where: {
        tipo_subtipo_compania_nombre_anexoPrecio: {
          tipo: "LUZ",
          subtipo: tarifa,
          compania,
          nombre,
          anexoPrecio,
        },
      },

      update: {},

      create: {
        tipo: "LUZ",
        subtipo: tarifa,
        compania,
        nombre,
        anexoPrecio,
      },

    });

    await prisma.ofertaTarifaTramo.upsert({

      where: {
        ofertaTarifaId_consumoDesdeKWh_consumoHastaKWh: {
          ofertaTarifaId: ofertaTarifa.id,
          consumoDesdeKWh: consumoDesde,
          consumoHastaKWh: consumoHasta,
        },
      },

      update: {
        comisionFijaAdmin: comisionBaseEUR,
      },

      create: {
        ofertaTarifaId: ofertaTarifa.id,
        consumoDesdeKWh: consumoDesde,
        consumoHastaKWh: consumoHasta,
        comisionFijaAdmin: comisionBaseEUR,
      },

    });

    const tramoNombre =
      consumoHasta === CONSUMO_HASTA_MAX
        ? `${consumoDesde}-∞`
        : `${consumoDesde}-${consumoHasta}`;

    const sub = await prisma.subSeccion.upsert({

      where: {
        seccionId_slug: {
          seccionId: seccion.id,
          slug: slugify(
            compania + tarifa + tramoNombre
          ),
        },
      },

      update: {},

      create: {
        seccionId: seccion.id,
        nombre: tramoNombre,
        slug: slugify(
          compania + tarifa + tramoNombre
        ),
      },

    });

    if (comisionBaseEUR) {

      const pct = await getPctForNivel(seccion.id);

      for (const nivel of [
        "C1",
        "C2",
        "C3",
        "ESPECIAL",
      ]) {

        const fijo =
          comisionBaseEUR *
          (pct[nivel as keyof typeof pct] /
            100);

        await prisma.reglaComisionGlobal.create({

          data: {

            seccionId: seccion.id,

            subSeccionId: sub.id,

            nivel: nivel as any,

            tipo: "FIJA",

            fijoEUR: fijo,

          },

        });

        createdRules++;

      }

    }

  }

  return NextResponse.json({

    ok: true,

    createdRules,

  });

}
