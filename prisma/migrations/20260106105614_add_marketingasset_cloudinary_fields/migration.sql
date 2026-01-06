-- AlterEnum
ALTER TYPE "MarketingTipo" ADD VALUE 'PDF';

-- AlterTable
ALTER TABLE "marketing_assets" ADD COLUMN     "mime" TEXT,
ADD COLUMN     "resourceType" TEXT,
ADD COLUMN     "size" INTEGER;
