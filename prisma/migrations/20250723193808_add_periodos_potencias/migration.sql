/*
  Warnings:

  - Added the required column `consumoPeriodos` to the `DatosFactura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `potencias` to the `DatosFactura` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DatosFactura" ADD COLUMN     "consumoPeriodos" TEXT NOT NULL,
ADD COLUMN     "potencias" TEXT NOT NULL;
