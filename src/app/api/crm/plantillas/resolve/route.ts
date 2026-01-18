import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Variante = "A" | "B";

function pickVarianteBalanced(countA: number, countB: number): Variante {
  if (countA === countB) return Math.random() < 0.5 ? "A" : "B";
  return countA < countB ? "A" : "B";
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

    // ✅ 1) Buscar plantilla activa por canal+etapa (más reciente por creadaEn)
    const plantilla = await prisma.plantillaMensaje.findFirst({
      where: { canal, etapa, activa: true },
      orderBy: { creadaEn: "desc" }, // <-- este campo sí existe en tu modelo (por el error que has puesto)
    });

    // ✅ 2) Fallback si no hay plantilla creada todavía
    const fallbackBase =
      `Hola {{nombre}}, soy de Impulso Energético. ` +
      `Te contacto por tu solicitud para ahorrar en tus facturas. ¿Te viene bien si lo vemos?`;

    const textoA = plantilla?.textoA || fallbackBase;
    const textoB = plantilla?.textoB || fallbackBase;

    // ✅ 3) Elegir variante A/B balanceando por envíos históricos si hay plantilla
    let variante: Variante = "A";
    const plantillaId: number | null = plantilla?.id ?? null;

    if (plantillaId) {
      const [countA, countB] = await Promise.all([
        prisma.plantillaEnvio.count({
          where: { plantillaId, canal, etapa, variante: "A" },
        }),
        prisma.plantillaEnvio.count({
          where: { plantillaId, canal, etapa, variante: "B" },
        }),
      ]);
      variante = pickVarianteBalanced(countA, countB);
    } else {
      variante = Math.random() < 0.5 ? "A" : "B";
    }

    // ✅ 4) Variables disponibles para {{...}}
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

    const base = variante === "A" ? textoA : textoB;
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
