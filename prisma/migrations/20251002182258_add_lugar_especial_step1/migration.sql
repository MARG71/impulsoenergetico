-- AlterTable
ALTER TABLE "Lugar" ADD COLUMN     "aportacionAcumulada" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "especial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "especialColor" TEXT,
ADD COLUMN     "especialLogoUrl" TEXT,
ADD COLUMN     "especialMensaje" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Oferta" ADD COLUMN     "descripcionCorta" TEXT,
ADD COLUMN     "ofertaTarifaId" INTEGER;

-- CreateIndex
CREATE INDEX "Oferta_ofertaTarifaId_idx" ON "Oferta"("ofertaTarifaId");

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_ofertaTarifaId_fkey" FOREIGN KEY ("ofertaTarifaId") REFERENCES "OfertaTarifa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
