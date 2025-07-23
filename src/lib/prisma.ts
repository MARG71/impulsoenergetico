import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'], // Puedes quitar esto si no quieres ver las queries
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
