-- CreateEnum
CREATE TYPE "EstadoAsientoComision" AS ENUM ('PENDIENTE', 'LIQUIDADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "ReceptorComisionTipo" AS ENUM ('ADMIN', 'AGENTE', 'LUGAR');

-- CreateEnum
CREATE TYPE "EstadoLiquidacionComision" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateTable
CREATE TABLE "AsientoComision" (
    "id" SERIAL NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liquidadoEn" TIMESTAMP(3),
    "adminId" INTEGER,
    "contratacionId" INTEGER NOT NULL,
    "seccionId" INTEGER NOT NULL,
    "subSeccionId" INTEGER,
    "nivel" "NivelComision" NOT NULL,
    "reglaId" INTEGER,
    "baseEUR" DECIMAL(12,2) NOT NULL,
    "totalComision" DECIMAL(12,2) NOT NULL,
    "agenteEUR" DECIMAL(12,2) NOT NULL,
    "lugarEUR" DECIMAL(12,2) NOT NULL,
    "adminEUR" DECIMAL(12,2) NOT NULL,
    "pctAgenteSnap" DECIMAL(6,3) NOT NULL,
    "pctLugarSnap" DECIMAL(6,3) NOT NULL,
    "leadId" INTEGER,
    "clienteId" INTEGER,
    "agenteId" INTEGER,
    "lugarId" INTEGER,
    "estado" "EstadoAsientoComision" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,

    CONSTRAINT "AsientoComision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoComision" (
    "id" SERIAL NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" INTEGER,
    "asientoId" INTEGER NOT NULL,
    "receptorTipo" "ReceptorComisionTipo" NOT NULL,
    "receptorId" INTEGER,
    "importeEUR" DECIMAL(12,2) NOT NULL,
    "liquidacionId" INTEGER,

    CONSTRAINT "MovimientoComision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidacionComision" (
    "id" SERIAL NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" INTEGER,
    "desde" TIMESTAMP(3) NOT NULL,
    "hasta" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoLiquidacionComision" NOT NULL DEFAULT 'ABIERTA',
    "totalAgenteEUR" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalLugarEUR" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAdminEUR" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "LiquidacionComision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AsientoComision_contratacionId_key" ON "AsientoComision"("contratacionId");

-- CreateIndex
CREATE INDEX "AsientoComision_adminId_creadoEn_idx" ON "AsientoComision"("adminId", "creadoEn");

-- CreateIndex
CREATE INDEX "AsientoComision_estado_creadoEn_idx" ON "AsientoComision"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "AsientoComision_seccionId_subSeccionId_idx" ON "AsientoComision"("seccionId", "subSeccionId");

-- CreateIndex
CREATE INDEX "AsientoComision_agenteId_lugarId_idx" ON "AsientoComision"("agenteId", "lugarId");

-- CreateIndex
CREATE INDEX "MovimientoComision_adminId_creadoEn_idx" ON "MovimientoComision"("adminId", "creadoEn");

-- CreateIndex
CREATE INDEX "MovimientoComision_asientoId_idx" ON "MovimientoComision"("asientoId");

-- CreateIndex
CREATE INDEX "MovimientoComision_receptorTipo_receptorId_idx" ON "MovimientoComision"("receptorTipo", "receptorId");

-- CreateIndex
CREATE INDEX "MovimientoComision_liquidacionId_idx" ON "MovimientoComision"("liquidacionId");

-- CreateIndex
CREATE INDEX "LiquidacionComision_adminId_creadoEn_idx" ON "LiquidacionComision"("adminId", "creadoEn");

-- CreateIndex
CREATE INDEX "LiquidacionComision_estado_desde_hasta_idx" ON "LiquidacionComision"("estado", "desde", "hasta");

-- AddForeignKey
ALTER TABLE "AsientoComision" ADD CONSTRAINT "AsientoComision_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsientoComision" ADD CONSTRAINT "AsientoComision_contratacionId_fkey" FOREIGN KEY ("contratacionId") REFERENCES "Contratacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoComision" ADD CONSTRAINT "MovimientoComision_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoComision" ADD CONSTRAINT "MovimientoComision_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "AsientoComision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoComision" ADD CONSTRAINT "MovimientoComision_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "LiquidacionComision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionComision" ADD CONSTRAINT "LiquidacionComision_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
