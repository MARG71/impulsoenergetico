-- CreateEnum
CREATE TYPE "MarketingTipo" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "marketing_assets" (
    "id" SERIAL NOT NULL,
    "tipo" "MarketingTipo" NOT NULL,
    "url" TEXT NOT NULL,
    "nombre" TEXT,
    "publicId" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lugarId" INTEGER NOT NULL,
    "adminId" INTEGER,
    "agenteId" INTEGER,

    CONSTRAINT "marketing_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketing_assets_lugarId_idx" ON "marketing_assets"("lugarId");

-- CreateIndex
CREATE INDEX "marketing_assets_adminId_idx" ON "marketing_assets"("adminId");

-- CreateIndex
CREATE INDEX "marketing_assets_agenteId_idx" ON "marketing_assets"("agenteId");

-- AddForeignKey
ALTER TABLE "marketing_assets" ADD CONSTRAINT "marketing_assets_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
