/*
  Warnings:

  - You are about to drop the column `consumoMensual` on the `DatosFactura` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `DatosFactura` table. All the data in the column will be lost.
  - The `consumoPeriodos` column on the `DatosFactura` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `potencias` column on the `DatosFactura` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "DatosFactura" DROP COLUMN "consumoMensual",
DROP COLUMN "createdAt",
ADD COLUMN     "importeFactura" DOUBLE PRECISION,
ADD COLUMN     "impuestoElectricidad" DOUBLE PRECISION,
ADD COLUMN     "iva" DOUBLE PRECISION,
ADD COLUMN     "reactiva" DOUBLE PRECISION,
ADD COLUMN     "territorio" TEXT,
ALTER COLUMN "tipoCliente" DROP NOT NULL,
ALTER COLUMN "tipoTarifa" DROP NOT NULL,
ALTER COLUMN "consumoAnualKWh" DROP NOT NULL,
ALTER COLUMN "cups" DROP NOT NULL,
ALTER COLUMN "fechaFin" DROP NOT NULL,
ALTER COLUMN "fechaInicio" DROP NOT NULL,
ALTER COLUMN "nombreTarifa" DROP NOT NULL,
DROP COLUMN "consumoPeriodos",
ADD COLUMN     "consumoPeriodos" JSONB,
DROP COLUMN "potencias",
ADD COLUMN     "potencias" JSONB;
