-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'CLIENTE';

-- AlterTable
ALTER TABLE "Agente" ADD COLUMN     "adminId" INTEGER,
ADD COLUMN     "ocultoParaAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "adminId" INTEGER,
ADD COLUMN     "ocultoParaAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Comparativa" ADD COLUMN     "adminId" INTEGER;

-- AlterTable
ALTER TABLE "Contrato" ADD COLUMN     "adminId" INTEGER;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "adminId" INTEGER;

-- AlterTable
ALTER TABLE "Lugar" ADD COLUMN     "adminId" INTEGER,
ADD COLUMN     "ocultoParaAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Oferta" ADD COLUMN     "adminId" INTEGER;

-- AlterTable
ALTER TABLE "ProductoGanadero" ADD COLUMN     "adminId" INTEGER;

-- AlterTable
ALTER TABLE "QR" ADD COLUMN     "adminId" INTEGER;

-- AlterTable
ALTER TABLE "SolicitudContrato" ADD COLUMN     "adminId" INTEGER;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "adminId" INTEGER;

-- CreateIndex
CREATE INDEX "Agente_adminId_idx" ON "Agente"("adminId");

-- CreateIndex
CREATE INDEX "Cliente_adminId_idx" ON "Cliente"("adminId");

-- CreateIndex
CREATE INDEX "Comparativa_adminId_idx" ON "Comparativa"("adminId");

-- CreateIndex
CREATE INDEX "Contrato_adminId_idx" ON "Contrato"("adminId");

-- CreateIndex
CREATE INDEX "Lead_adminId_idx" ON "Lead"("adminId");

-- CreateIndex
CREATE INDEX "Lugar_adminId_idx" ON "Lugar"("adminId");

-- CreateIndex
CREATE INDEX "Oferta_adminId_idx" ON "Oferta"("adminId");

-- CreateIndex
CREATE INDEX "ProductoGanadero_adminId_idx" ON "ProductoGanadero"("adminId");

-- CreateIndex
CREATE INDEX "QR_adminId_idx" ON "QR"("adminId");

-- CreateIndex
CREATE INDEX "SolicitudContrato_adminId_idx" ON "SolicitudContrato"("adminId");

-- CreateIndex
CREATE INDEX "Usuario_adminId_idx" ON "Usuario"("adminId");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparativa" ADD CONSTRAINT "Comparativa_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agente" ADD CONSTRAINT "Agente_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lugar" ADD CONSTRAINT "Lugar_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QR" ADD CONSTRAINT "QR_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoGanadero" ADD CONSTRAINT "ProductoGanadero_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudContrato" ADD CONSTRAINT "SolicitudContrato_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
