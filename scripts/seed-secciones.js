import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertSeccion({ nombre, slug }) {
  const existing = await prisma.seccion.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing) {
    await prisma.seccion.update({
      where: { slug },
      data: { nombre, activa: true },
    });
    console.log(`↻ Sección actualizada: ${slug}`);
    return;
  }

  await prisma.seccion.create({
    data: { nombre, slug, activa: true },
  });
  console.log(`✅ Sección creada: ${slug}`);
}

async function main() {
  await upsertSeccion({ nombre: "Luz", slug: "luz" });
  await upsertSeccion({ nombre: "Gas", slug: "gas" });
  await upsertSeccion({ nombre: "Telefonía", slug: "telefonia" });

  console.log("🎯 Secciones OK");
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
