import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Variante = "A" | "B";

function pickVarianteBalanced(countA: number, countB: number): Variante {
  if (countA === countB) return Math.random() < 0.5 ? "A" : "B";
  return countA < countB ? "A" : "B";
}

function normalizeVariante(v: any): Variante {
  const s = String(v || "").toUpperCase();
  return s === "B" ? "B" : "A";
}

function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return (v ?? "").toString();
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const leadId = Number(body?.leadId);
    const canal = String(body?.canal || "whatsapp").toLowerCase();
    const etapa = String(body?.etapa || "").toLowerCase();

    if (!leadId || !Number.isFinite(leadId)) {
      return NextResponse.json({ error: "leadId inválido" }, { status: 400 });
    }
    if (!etapa) {
      return NextResponse.json({ error: "etapa requerida" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        agente: { select: { nombre: true } },
        lugar: { select: { nombre: true } },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    // ✅ Traemos las plantillas activas para esa etapa/canal (idealmente 1 por variante A y 1 por B)
    const plantillas = await prisma.plantillaMensaje.findMany({
      where: { canal, etapa, activa: true },
      orderBy: { creadaEn: "desc" },
      take: 20,
    });

    // Separamos por variante
    const plantillaA = plantillas.find((p) => normalizeVariante((p as any).variante) === "A") || null;
    const plantillaB = plantillas.find((p) => normalizeVariante((p as any).variante) === "B") || null;

    // ✅ Fallback base si no existe ninguna
    const fallbackBase =
      `Hola {{nombre}}, soy de Impulso Energético. ` +
      `Te contacto por tu solicitud para ahorrar en tus facturas. ¿Te viene bien si lo vemos?`;

    // ✅ Si existe al menos una, balanceamos envíos por variante (si no existe una variante, usamos la disponible)
    let variante: Variante = "A";
    if (plantillaA && plantillaB) {
      const [countA, countB] = await Promise.all([
        prisma.plantillaEnvio.count({
          where: {
            canal,
            etapa,
            variante: "A",
            plantillaId: plantillaA.id,
          },
        }),
        prisma.plantillaEnvio.count({
          where: {
            canal,
            etapa,
            variante: "B",
            plantillaId: plantillaB.id,
          },
        }),
      ]);
      variante = pickVarianteBalanced(countA, countB);
    } else if (plantillaB && !plantillaA) {
      variante = "B";
    } else {
      variante = "A";
    }

    const plantillaElegida = variante === "B" ? (plantillaB || plantillaA) : (plantillaA || plantillaB);
    const plantillaId: number | null = plantillaElegida?.id ?? null;

    const contenido = String((plantillaElegida as any)?.contenido || "").trim();
    const base = contenido || fallbackBase;

    const vars: Record<string, string> = {
      id: String(lead.id),
      nombre: lead.nombre || "",
      telefono: lead.telefono || "",
      email: lead.email || "",
      agente: lead.agente?.nombre || "",
      lugar: lead.lugar?.nombre || "",
      estado: String(lead.estado || ""),
      etapa,
    };

    const texto = renderTemplate(base, vars).trim();

    return NextResponse.json({
      ok: true,
      canal,
      etapa,
      variante,
      plantillaId,
      texto,
      vars,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error en resolve" }, { status: 500 });
  }
}
