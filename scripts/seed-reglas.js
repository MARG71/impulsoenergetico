import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertRegla({
  seccionId,
  subSeccionId,
  nivel,
  tipo,
  porcentaje,
  fijoEUR,
  activa = true,
}) {
  const existing = await prisma.reglaComisionGlobal.findFirst({
    where: {
      seccionId,
      subSeccionId,
      nivel,
    },
    select: { id: true },
  });

  const data = {
    seccionId,
    subSeccionId,
    nivel,
    tipo,
    activa,
  };

  if (porcentaje !== undefined) data.porcentaje = porcentaje;
  if (fijoEUR !== undefined) data.fijoEUR = fijoEUR;

  if (existing) {
    await prisma.reglaComisionGlobal.update({
      where: { id: existing.id },
      data,
    });
    return;
  }

  await prisma.reglaComisionGlobal.create({ data });
}

async function main() {
  const slugs = ["luz", "gas", "telefonia"];

  for (const slug of slugs) {
    const seccion = await prisma.seccion.findFirst({
      where: { slug },
    });

    if (!seccion) {
      console.log(`⚠️ No existe sección slug='${slug}'`);
      continue;
    }

    await upsertRegla({
      seccionId: seccion.id,
      subSeccionId: null,
      nivel: "C1",
      tipo: "PORC_BASE",
      porcentaje: 10,
    });

    await upsertRegla({
      seccionId: seccion.id,
      subSeccionId: null,
      nivel: "C2",
      tipo: "PORC_BASE",
      porcentaje: 12,
    });

    await upsertRegla({
      seccionId: seccion.id,
      subSeccionId: null,
      nivel: "C3",
      tipo: "PORC_BASE",
      porcentaje: 15,
    });

    await upsertRegla({
      seccionId: seccion.id,
      subSeccionId: null,
      nivel: "ESPECIAL",
      tipo: "PORC_BASE",
      porcentaje: 20,
    });

    console.log(`✅ Reglas creadas para ${slug}`);
  }

  console.log("🎯 Seed terminado correctamente");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
