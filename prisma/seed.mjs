// prisma/seed.mjs
import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ⚠️ Pon aquí TU email real de superadmin
  const email = "superimpulsoenergetico@gmail.com";

  // ⚠️ OJO: pon aquí la contraseña SOLO en local.
  // En producción mejor leerla de process.env.SUPERADMIN_PASSWORD
  const plainPassword = "Superadmin2025*";

  const hash = await bcrypt.hash(plainPassword, 12);

  const user = await prisma.usuario.upsert({
    where: { email },
    update: {
      rol: "SUPERADMIN",
      password: hash,
      nombre: "SUPERADMIN IMPULSO",
      adminId: null,
      agenteId: null,
      lugarId: null,
    },
    create: {
      email,
      nombre: "SUPERADMIN IMPULSO",
      password: hash,
      rol: "SUPERADMIN",
      adminId: null,
      agenteId: null,
      lugarId: null,
    },
  });

  console.log("✅ SUPERADMIN listo:", { id: user.id, email: user.email, rol: user.rol });
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
