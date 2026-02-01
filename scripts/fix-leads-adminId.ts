import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_ID = 23;

async function main() {
  console.log("▶ Forzando Lead.adminId = ", ADMIN_ID, "donde adminId IS NULL...");

  const before = await prisma.lead.count({ where: { adminId: null } });
  console.log("Leads sin adminId (antes):", before);

  const res = await prisma.lead.updateMany({
    where: { adminId: null },
    data: { adminId: ADMIN_ID },
  });

  console.log("Actualizados:", res.count);

  const after = await prisma.lead.count({ where: { adminId: null } });
  console.log("Leads sin adminId (después):", after);

  console.log("✅ OK");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
