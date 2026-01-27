import { prisma } from "../src/lib/prisma";

async function main() {
  const id = Number(process.argv[2]);
  if (!id) throw new Error("Uso: pnpm tsx scripts/delete-lead-doc.ts <docId>");

  const doc = await prisma.leadDocumento.findUnique({ where: { id } });
  if (!doc) {
    console.log("No existe LeadDocumento con id", id);
    return;
  }

  await prisma.leadDocumento.delete({ where: { id } });
  console.log("✅ Borrado LeadDocumento id =", id, "nombre =", doc.nombre);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
