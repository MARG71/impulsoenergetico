-- CreateEnum
CREATE TYPE "EstadoContratacion" AS ENUM ('BORRADOR', 'PENDIENTE', 'CONFIRMADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoDocumentoContratacion" AS ENUM ('DNI', 'FACTURA', 'CONTRATO', 'OTRO');

-- DropEnum
DROP TYPE "CanalEnvioDocumento";

-- CreateTable
CREATE TABLE "Contratacion" (
    "id" SERIAL NOT NULL,
    "estado" "EstadoContratacion" NOT NULL DEFAULT 'BORRADOR',
    "nivel" "NivelComision" NOT NULL DEFAULT 'C1',
    "seccionId" INTEGER NOT NULL,
    "subSeccionId" INTEGER,
    "leadId" INTEGER,
    "clienteId" INTEGER,
    "agenteId" INTEGER,
    "lugarId" INTEGER,
    "baseImponible" DECIMAL(12,2),
    "totalFactura" DECIMAL(12,2),
    "notas" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,
    "confirmadaEn" TIMESTAMP(3),
    "adminId" INTEGER,

    CONSTRAINT "Contratacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratacionDocumento" (
    "id" SERIAL NOT NULL,
    "contratacionId" INTEGER NOT NULL,
    "tipo" "TipoDocumentoContratacion" NOT NULL DEFAULT 'OTRO',
    "nombre" TEXT,
    "url" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContratacionDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contratacion_adminId_idx" ON "Contratacion"("adminId");

-- CreateIndex
CREATE INDEX "Contratacion_estado_idx" ON "Contratacion"("estado");

-- CreateIndex
CREATE INDEX "Contratacion_seccionId_idx" ON "Contratacion"("seccionId");

-- CreateIndex
CREATE INDEX "Contratacion_subSeccionId_idx" ON "Contratacion"("subSeccionId");

-- CreateIndex
CREATE INDEX "Contratacion_leadId_idx" ON "Contratacion"("leadId");

-- CreateIndex
CREATE INDEX "Contratacion_clienteId_idx" ON "Contratacion"("clienteId");

-- CreateIndex
CREATE INDEX "Contratacion_agenteId_idx" ON "Contratacion"("agenteId");

-- CreateIndex
CREATE INDEX "Contratacion_lugarId_idx" ON "Contratacion"("lugarId");

-- CreateIndex
CREATE INDEX "ContratacionDocumento_contratacionId_idx" ON "ContratacionDocumento"("contratacionId");

-- AddForeignKey
ALTER TABLE "Contratacion" ADD CONSTRAINT "Contratacion_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratacion" ADD CONSTRAINT "Contratacion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratacion" ADD CONSTRAINT "Contratacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratacion" ADD CONSTRAINT "Contratacion_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratacion" ADD CONSTRAINT "Contratacion_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratacion" ADD CONSTRAINT "Contratacion_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratacion" ADD CONSTRAINT "Contratacion_subSeccionId_fkey" FOREIGN KEY ("subSeccionId") REFERENCES "SubSeccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratacionDocumento" ADD CONSTRAINT "ContratacionDocumento_contratacionId_fkey" FOREIGN KEY ("contratacionId") REFERENCES "Contratacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
