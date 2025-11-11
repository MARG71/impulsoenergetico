/*
  Warnings:

  - You are about to drop the column `ref` on the `OfertaTarifa` table. All the data in the column will be lost.
  - You are about to drop the column `ultimaActualizacion` on the `OfertaTarifa` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('RESIDENCIAL', 'PYME');

-- AlterTable
ALTER TABLE "OfertaTarifa" DROP COLUMN "ref",
DROP COLUMN "ultimaActualizacion",
ADD COLUMN     "referencia" TEXT,
ADD COLUMN     "tipoCliente" "TipoCliente";
