/*
  Warnings:

  - The primary key for the `Cliente` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `creadoEn` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Cliente` table. All the data in the column will be lost.
  - The `id` column on the `Cliente` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Comparativa` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ahorro` on the `Comparativa` table. All the data in the column will be lost.
  - You are about to drop the column `comision` on the `Comparativa` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `Comparativa` table. All the data in the column will be lost.
  - You are about to drop the column `qrId` on the `Comparativa` table. All the data in the column will be lost.
  - The `id` column on the `Comparativa` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Agente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Contrato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lugar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QR` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `agenteId` to the `Comparativa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lugarId` to the `Comparativa` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `clienteId` on the `Comparativa` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Comparativa" DROP CONSTRAINT "Comparativa_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "Comparativa" DROP CONSTRAINT "Comparativa_qrId_fkey";

-- DropForeignKey
ALTER TABLE "Contrato" DROP CONSTRAINT "Contrato_agenteId_fkey";

-- DropForeignKey
ALTER TABLE "Contrato" DROP CONSTRAINT "Contrato_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "QR" DROP CONSTRAINT "QR_agenteId_fkey";

-- DropForeignKey
ALTER TABLE "QR" DROP CONSTRAINT "QR_lugarId_fkey";

-- DropIndex
DROP INDEX "Cliente_email_key";

-- AlterTable
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_pkey",
DROP COLUMN "creadoEn",
DROP COLUMN "email",
DROP COLUMN "telefono",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Comparativa" DROP CONSTRAINT "Comparativa_pkey",
DROP COLUMN "ahorro",
DROP COLUMN "comision",
DROP COLUMN "fecha",
DROP COLUMN "qrId",
ADD COLUMN     "agenteId" INTEGER NOT NULL,
ADD COLUMN     "lugarId" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "clienteId",
ADD COLUMN     "clienteId" INTEGER NOT NULL,
ADD CONSTRAINT "Comparativa_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Agente";

-- DropTable
DROP TABLE "Contrato";

-- DropTable
DROP TABLE "Lugar";

-- DropTable
DROP TABLE "QR";

-- CreateTable
CREATE TABLE "DatosFactura" (
    "id" SERIAL NOT NULL,
    "comparativaId" INTEGER NOT NULL,
    "tipoCliente" TEXT NOT NULL,
    "tipoTarifa" TEXT NOT NULL,
    "nombreTarifa" TEXT NOT NULL,
    "cups" TEXT NOT NULL,
    "fechaInicio" TEXT NOT NULL,
    "fechaFin" TEXT NOT NULL,
    "consumoAnual" DOUBLE PRECISION NOT NULL,
    "importeFactura" DOUBLE PRECISION NOT NULL,
    "consumoPeriodos" JSONB NOT NULL,
    "potencias" JSONB NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL,
    "impuestoElectricidad" DOUBLE PRECISION NOT NULL,
    "territorio" TEXT NOT NULL,
    "reactiva" DOUBLE PRECISION NOT NULL,
    "exceso" DOUBLE PRECISION NOT NULL,
    "alquiler" DOUBLE PRECISION NOT NULL,
    "otros" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DatosFactura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoComparativa" (
    "id" SERIAL NOT NULL,
    "comparativaId" INTEGER NOT NULL,
    "compañia" TEXT NOT NULL,
    "tarifa" TEXT NOT NULL,
    "coste" DOUBLE PRECISION NOT NULL,
    "ahorro" DOUBLE PRECISION NOT NULL,
    "ahorroPct" DOUBLE PRECISION NOT NULL,
    "comision" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ResultadoComparativa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatosFactura_comparativaId_key" ON "DatosFactura"("comparativaId");

-- AddForeignKey
ALTER TABLE "Comparativa" ADD CONSTRAINT "Comparativa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosFactura" ADD CONSTRAINT "DatosFactura_comparativaId_fkey" FOREIGN KEY ("comparativaId") REFERENCES "Comparativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoComparativa" ADD CONSTRAINT "ResultadoComparativa_comparativaId_fkey" FOREIGN KEY ("comparativaId") REFERENCES "Comparativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
