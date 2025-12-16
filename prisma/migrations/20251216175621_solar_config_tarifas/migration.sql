-- CreateEnum
CREATE TYPE "ModoSolarTarifa" AS ENUM ('MISMA_TARIFA', 'TARIFA_SOLAR_ESPECIAL');

-- CreateTable
CREATE TABLE "OfertaTarifaSolarConfig" (
    "id" SERIAL NOT NULL,
    "ofertaTarifaBaseId" INTEGER NOT NULL,
    "modo" "ModoSolarTarifa" NOT NULL DEFAULT 'MISMA_TARIFA',
    "ofertaTarifaSolarId" INTEGER,
    "excedenteTarifaId" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfertaTarifaSolarConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfertaTarifaSolarConfig_modo_activa_idx" ON "OfertaTarifaSolarConfig"("modo", "activa");

-- CreateIndex
CREATE INDEX "OfertaTarifaSolarConfig_excedenteTarifaId_idx" ON "OfertaTarifaSolarConfig"("excedenteTarifaId");

-- CreateIndex
CREATE UNIQUE INDEX "OfertaTarifaSolarConfig_ofertaTarifaBaseId_key" ON "OfertaTarifaSolarConfig"("ofertaTarifaBaseId");

-- AddForeignKey
ALTER TABLE "OfertaTarifaSolarConfig" ADD CONSTRAINT "OfertaTarifaSolarConfig_ofertaTarifaBaseId_fkey" FOREIGN KEY ("ofertaTarifaBaseId") REFERENCES "OfertaTarifa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaTarifaSolarConfig" ADD CONSTRAINT "OfertaTarifaSolarConfig_ofertaTarifaSolarId_fkey" FOREIGN KEY ("ofertaTarifaSolarId") REFERENCES "OfertaTarifa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaTarifaSolarConfig" ADD CONSTRAINT "OfertaTarifaSolarConfig_excedenteTarifaId_fkey" FOREIGN KEY ("excedenteTarifaId") REFERENCES "SolarExcedenteTarifa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
