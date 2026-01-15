-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "comparativaId" INTEGER,
ADD COLUMN     "contratoId" INTEGER,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "proximaAccion" TEXT,
ADD COLUMN     "proximaAccionEn" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Lead_estado_creadoEn_idx" ON "Lead"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "Lead_proximaAccionEn_idx" ON "Lead"("proximaAccionEn");
