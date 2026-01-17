-- CreateTable
CREATE TABLE "LeadActividad" (
    "id" SERIAL NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "detalle" TEXT,
    "leadId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "adminId" INTEGER,

    CONSTRAINT "LeadActividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadActividad_leadId_creadoEn_idx" ON "LeadActividad"("leadId", "creadoEn");

-- CreateIndex
CREATE INDEX "LeadActividad_adminId_idx" ON "LeadActividad"("adminId");

-- AddForeignKey
ALTER TABLE "LeadActividad" ADD CONSTRAINT "LeadActividad_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActividad" ADD CONSTRAINT "LeadActividad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActividad" ADD CONSTRAINT "LeadActividad_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
