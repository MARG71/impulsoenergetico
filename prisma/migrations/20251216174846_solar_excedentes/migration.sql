-- CreateEnum
CREATE TYPE "TipoCompensacionExcedente" AS ENUM ('COMPENSACION', 'BATERIA_VIRTUAL', 'OTRO');

-- CreateEnum
CREATE TYPE "LimiteCompensacionExcedente" AS ENUM ('ENERGIA', 'TOTAL');

-- AlterTable
ALTER TABLE "Comparativa" ADD COLUMN     "excedenteAnualKwh" DOUBLE PRECISION,
ADD COLUMN     "excedentePrecioKwhSnap" DECIMAL(10,6),
ADD COLUMN     "excedenteTarifaId" INTEGER,
ADD COLUMN     "excedenteTipoSnap" TEXT,
ADD COLUMN     "tieneSolar" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SolarExcedenteTarifa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "compania" TEXT,
    "tipo" "TipoCompensacionExcedente" NOT NULL DEFAULT 'COMPENSACION',
    "limite" "LimiteCompensacionExcedente" NOT NULL DEFAULT 'ENERGIA',
    "precioKwh" DECIMAL(10,6),
    "payload" JSONB,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolarExcedenteTarifa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolarExcedenteTarifa_activa_tipo_idx" ON "SolarExcedenteTarifa"("activa", "tipo");

-- CreateIndex
CREATE INDEX "SolarExcedenteTarifa_compania_idx" ON "SolarExcedenteTarifa"("compania");

-- CreateIndex
CREATE INDEX "Comparativa_tieneSolar_idx" ON "Comparativa"("tieneSolar");

-- CreateIndex
CREATE INDEX "Comparativa_excedenteTarifaId_idx" ON "Comparativa"("excedenteTarifaId");

-- AddForeignKey
ALTER TABLE "Comparativa" ADD CONSTRAINT "Comparativa_excedenteTarifaId_fkey" FOREIGN KEY ("excedenteTarifaId") REFERENCES "SolarExcedenteTarifa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
