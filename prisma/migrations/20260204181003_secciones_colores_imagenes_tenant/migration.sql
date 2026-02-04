-- AlterTable
ALTER TABLE "ReglaComisionGlobal" ADD COLUMN     "adminId" INTEGER;

-- AlterTable
ALTER TABLE "Seccion" ADD COLUMN     "adminId" INTEGER,
ADD COLUMN     "colorHex" VARCHAR(16),
ADD COLUMN     "imagenBytes" INTEGER,
ADD COLUMN     "imagenMime" TEXT,
ADD COLUMN     "imagenPublicId" TEXT,
ADD COLUMN     "imagenResourceType" TEXT,
ADD COLUMN     "imagenUrl" TEXT;

-- AlterTable
ALTER TABLE "SubSeccion" ADD COLUMN     "adminId" INTEGER,
ADD COLUMN     "colorHex" VARCHAR(16),
ADD COLUMN     "imagenBytes" INTEGER,
ADD COLUMN     "imagenMime" TEXT,
ADD COLUMN     "imagenPublicId" TEXT,
ADD COLUMN     "imagenResourceType" TEXT,
ADD COLUMN     "imagenUrl" TEXT;

-- CreateIndex
CREATE INDEX "ReglaComisionGlobal_adminId_idx" ON "ReglaComisionGlobal"("adminId");

-- CreateIndex
CREATE INDEX "Seccion_adminId_idx" ON "Seccion"("adminId");

-- CreateIndex
CREATE INDEX "SubSeccion_adminId_idx" ON "SubSeccion"("adminId");

-- AddForeignKey
ALTER TABLE "Seccion" ADD CONSTRAINT "Seccion_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubSeccion" ADD CONSTRAINT "SubSeccion_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglaComisionGlobal" ADD CONSTRAINT "ReglaComisionGlobal_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
