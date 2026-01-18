-- CreateEnum
CREATE TYPE "CanalEnvioDocumento" AS ENUM ('WHATSAPP', 'EMAIL', 'OTRO');

-- CreateTable
CREATE TABLE "LeadDocumento" (
    "id" SERIAL NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "resourceType" TEXT,
    "mime" TEXT,
    "size" INTEGER,
    "creadoPorId" INTEGER,
    "adminId" INTEGER,

    CONSTRAINT "LeadDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadDocumento_leadId_creadoEn_idx" ON "LeadDocumento"("leadId", "creadoEn");

-- CreateIndex
CREATE INDEX "LeadDocumento_adminId_creadoEn_idx" ON "LeadDocumento"("adminId", "creadoEn");

-- AddForeignKey
ALTER TABLE "LeadDocumento" ADD CONSTRAINT "LeadDocumento_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocumento" ADD CONSTRAINT "LeadDocumento_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocumento" ADD CONSTRAINT "LeadDocumento_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
