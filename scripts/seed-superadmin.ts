import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Faltan SUPERADMIN_EMAIL o SUPERADMIN_PASSWORD en .env");
  }

  const existe = await prisma.usuario.findUnique({ where: { email } });

  if (existe) {
    // Si existe, lo actualizamos a SUPERADMIN y actualizamos password
    const hash = await bcrypt.hash(password, 10);
    await prisma.usuario.update({
      where: { email },
      data: {
        rol: Rol.SUPERADMIN,
        password: hash,
        adminId: null,
        agenteId: null,
        lugarId: null,
      },
    });

    console.log("✅ SUPERADMIN actualizado:", email);
    return;
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.usuario.create({
    data: {
      nombre: "SUPERADMIN",
      email,
      password: hash,
      rol: Rol.SUPERADMIN,
      adminId: null,
      agenteId: null,
      lugarId: null,
    },
  });

  console.log("✅ SUPERADMIN creado:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
