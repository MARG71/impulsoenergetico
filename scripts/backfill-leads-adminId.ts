// scripts/backfill-leads-adminId.ts
import { prisma } from "../src/lib/prisma";

async function main() {
  const leads = await prisma.lead.findMany({
    where: { adminId: null },
    select: { id: true, lugarId: true, agenteId: true },
  });

  console.log("Leads sin adminId:", leads.length);

  const sinResolver: Array<{ id: number; lugarId: number | null; agenteId: number | null }> = [];

  for (const lead of leads) {
    let adminId: number | null = null;

    if (lead.lugarId) {
      const lugar = await prisma.lugar.findUnique({
        where: { id: lead.lugarId },
        select: { adminId: true },
      });
      adminId = lugar?.adminId ?? null;
    }

    if (!adminId && lead.agenteId) {
      const agente = await prisma.agente.findUnique({
        where: { id: lead.agenteId },
        select: { adminId: true },
      });
      adminId = agente?.adminId ?? null;
    }

    if (!adminId) {
      sinResolver.push({ id: lead.id, lugarId: lead.lugarId ?? null, agenteId: lead.agenteId ?? null });
      continue;
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: { adminId },
    });
  }

  console.log("Sin resolver:", sinResolver.length);
  if (sinResolver.length) console.table(sinResolver);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
