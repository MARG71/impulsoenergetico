/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `LeadDocumento` will be added. If there are existing duplicate values, this will fail.
  - Made the column `publicId` on table `LeadDocumento` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "LeadDocumento" ADD COLUMN     "accesos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryType" TEXT,
ADD COLUMN     "shareExpiraEn" TIMESTAMP(3),
ADD COLUMN     "shareToken" TEXT,
ADD COLUMN     "ultimoAcceso" TIMESTAMP(3),
ALTER COLUMN "url" DROP NOT NULL,
ALTER COLUMN "publicId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LeadDocumento_shareToken_key" ON "LeadDocumento"("shareToken");
