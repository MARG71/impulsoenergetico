-- CreateTable
CREATE TABLE "PlantillaEnvio" (
    "id" SERIAL NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canal" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "variante" TEXT NOT NULL,
    "leadId" INTEGER NOT NULL,
    "plantillaId" INTEGER,
    "adminId" INTEGER,
    "usuarioId" INTEGER,

    CONSTRAINT "PlantillaEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlantillaEnvio_adminId_creadoEn_idx" ON "PlantillaEnvio"("adminId", "creadoEn");

-- CreateIndex
CREATE INDEX "PlantillaEnvio_leadId_creadoEn_idx" ON "PlantillaEnvio"("leadId", "creadoEn");

-- CreateIndex
CREATE INDEX "PlantillaEnvio_etapa_variante_creadoEn_idx" ON "PlantillaEnvio"("etapa", "variante", "creadoEn");

-- AddForeignKey
ALTER TABLE "PlantillaEnvio" ADD CONSTRAINT "PlantillaEnvio_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaEnvio" ADD CONSTRAINT "PlantillaEnvio_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "PlantillaMensaje"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaEnvio" ADD CONSTRAINT "PlantillaEnvio_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaEnvio" ADD CONSTRAINT "PlantillaEnvio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
