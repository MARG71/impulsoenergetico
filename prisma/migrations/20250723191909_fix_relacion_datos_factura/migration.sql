/*
  Warnings:

  - You are about to drop the column `alquiler` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `consumoAnual` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `consumoPeriodos` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `cups` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `exceso` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `fechaFin` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `fechaInicio` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `importeFactura` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `impuestoElectricidad` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `iva` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `nombreTarifa` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `otros` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `potencias` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `reactiva` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `territorio` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the `ResultadoComparativa` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `consumoAnualKWh` to the `DatosFactura` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ResultadoComparativa" DROP CONSTRAINT "ResultadoComparativa_comparativaId_fkey";

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "email" TEXT,
ADD COLUMN     "telefono" TEXT;

-- AlterTable
ALTER TABLE "Comparativa" ADD COLUMN     "ahorro" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "comision" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "DatosFactura" DROP COLUMN "alquiler",
DROP COLUMN "consumoAnual",
DROP COLUMN "consumoPeriodos",
DROP COLUMN "cups",
DROP COLUMN "exceso",
DROP COLUMN "fechaFin",
DROP COLUMN "fechaInicio",
DROP COLUMN "importeFactura",
DROP COLUMN "impuestoElectricidad",
DROP COLUMN "iva",
DROP COLUMN "nombreTarifa",
DROP COLUMN "otros",
DROP COLUMN "potencias",
DROP COLUMN "reactiva",
DROP COLUMN "territorio",
ADD COLUMN     "consumoAnualKWh" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "consumoMensual" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "ResultadoComparativa";

-- CreateTable
CREATE TABLE "Contrato" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "servicio" TEXT NOT NULL,
    "compañia" TEXT NOT NULL,
    "tarifa" TEXT NOT NULL,
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comision" DOUBLE PRECISION NOT NULL,
    "agenteId" INTEGER,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QR" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "lugarId" INTEGER NOT NULL,
    "agenteId" INTEGER,

    CONSTRAINT "QR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lugarId" INTEGER,
    "agenteId" INTEGER,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QR_codigo_key" ON "QR"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QR" ADD CONSTRAINT "QR_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QR" ADD CONSTRAINT "QR_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
