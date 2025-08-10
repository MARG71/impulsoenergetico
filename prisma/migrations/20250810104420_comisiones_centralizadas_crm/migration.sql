-- AlterTable
ALTER TABLE "Agente" ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pctAgente" DECIMAL(5,4);

-- AlterTable
ALTER TABLE "Lugar" ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pctCliente" DECIMAL(5,4),
ADD COLUMN     "pctLugar" DECIMAL(5,4);

-- CreateTable
CREATE TABLE "global_comision_defaults" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "defaultPctCliente" DECIMAL(5,4) NOT NULL,
    "defaultPctLugar" DECIMAL(5,4) NOT NULL,
    "defaultPctAgente" DECIMAL(5,4) NOT NULL,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_comision_defaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comision_override" (
    "id" SERIAL NOT NULL,
    "lugarId" INTEGER NOT NULL,
    "agenteId" INTEGER,
    "compania" TEXT,
    "tarifa" TEXT,
    "pctCliente" DECIMAL(5,4),
    "pctLugar" DECIMAL(5,4),
    "pctAgente" DECIMAL(5,4),
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comision_override_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comision_override_lugarId_compania_tarifa_activo_validFrom__idx" ON "comision_override"("lugarId", "compania", "tarifa", "activo", "validFrom", "validTo");

-- AddForeignKey
ALTER TABLE "comision_override" ADD CONSTRAINT "comision_override_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comision_override" ADD CONSTRAINT "comision_override_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
