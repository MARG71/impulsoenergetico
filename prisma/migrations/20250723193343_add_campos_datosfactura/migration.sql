/*
  Warnings:

  - Added the required column `cups` to the `DatosFactura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fechaFin` to the `DatosFactura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fechaInicio` to the `DatosFactura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombreTarifa` to the `DatosFactura` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DatosFactura" ADD COLUMN     "cups" TEXT NOT NULL,
ADD COLUMN     "fechaFin" TEXT NOT NULL,
ADD COLUMN     "fechaInicio" TEXT NOT NULL,
ADD COLUMN     "nombreTarifa" TEXT NOT NULL;
