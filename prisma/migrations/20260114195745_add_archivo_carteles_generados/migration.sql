-- AlterTable
ALTER TABLE "carteles_generados" ADD COLUMN     "archivoBytes" INTEGER,
ADD COLUMN     "archivoFormat" TEXT,
ADD COLUMN     "archivoMime" TEXT,
ADD COLUMN     "archivoPublicId" TEXT,
ADD COLUMN     "archivoResourceType" TEXT,
ADD COLUMN     "archivoUrl" TEXT;
