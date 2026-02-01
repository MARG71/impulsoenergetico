/* scripts/backfill-leads-adminId.js */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("▶ Backfill Lead.adminId (desde Lugar/Agente) ...");

  // 1) Leads sin adminId
  const leads = await prisma.lead.findMany({
    where: { adminId: null },
    select: { id: true, lugarId: true, agenteId: true },
    orderBy: { id: "asc" },
  });

  console.log(`Encontrados ${leads.length} leads sin adminId`);

  let updated = 0;
  let skipped = 0;

  for (const l of leads) {
    let adminId = null;

    // Prioridad: Lugar -> adminId
    if (l.lugarId) {
      const lugar = await prisma.lugar.findUnique({
        where: { id: l.lugarId },
        select: { adminId: true },
      });
      if (lugar?.adminId) adminId = lugar.adminId;
    }

    // Si no hay lugar/adminId, probar Agente -> adminId
    if (!adminId && l.agenteId) {
      const agente = await prisma.agente.findUnique({
        where: { id: l.agenteId },
        select: { adminId: true },
      });
      if (agente?.adminId) adminId = agente.adminId;
    }

    if (!adminId) {
      skipped++;
      continue;
    }

    await prisma.lead.update({
      where: { id: l.id },
      data: { adminId },
    });

    updated++;
    if (updated % 25 === 0) console.log(`  ...actualizados ${updated}`);
  }

  console.log(`✅ Terminado. actualizados=${updated} | saltados=${skipped}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
