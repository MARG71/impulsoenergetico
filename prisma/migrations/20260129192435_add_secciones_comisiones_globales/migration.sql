-- CreateEnum
CREATE TYPE "NivelComision" AS ENUM ('C1', 'C2', 'C3', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "TipoCalculoComision" AS ENUM ('FIJA', 'PORC_BASE', 'PORC_MARGEN', 'MIXTA');

-- CreateTable
CREATE TABLE "Seccion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubSeccion" (
    "id" SERIAL NOT NULL,
    "seccionId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubSeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReglaComisionGlobal" (
    "id" SERIAL NOT NULL,
    "seccionId" INTEGER NOT NULL,
    "subSeccionId" INTEGER,
    "nivel" "NivelComision" NOT NULL,
    "tipo" "TipoCalculoComision" NOT NULL,
    "fijoEUR" DECIMAL(12,2),
    "porcentaje" DECIMAL(6,3),
    "minEUR" DECIMAL(12,2),
    "maxEUR" DECIMAL(12,2),
    "minAgenteEUR" DECIMAL(12,2),
    "maxAgenteEUR" DECIMAL(12,2),
    "minLugarEspecialEUR" DECIMAL(12,2),
    "maxLugarEspecialEUR" DECIMAL(12,2),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReglaComisionGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seccion_slug_key" ON "Seccion"("slug");

-- CreateIndex
CREATE INDEX "Seccion_activa_idx" ON "Seccion"("activa");

-- CreateIndex
CREATE INDEX "SubSeccion_seccionId_activa_idx" ON "SubSeccion"("seccionId", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "SubSeccion_seccionId_slug_key" ON "SubSeccion"("seccionId", "slug");

-- CreateIndex
CREATE INDEX "ReglaComisionGlobal_seccionId_subSeccionId_activa_idx" ON "ReglaComisionGlobal"("seccionId", "subSeccionId", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "ReglaComisionGlobal_seccionId_subSeccionId_nivel_key" ON "ReglaComisionGlobal"("seccionId", "subSeccionId", "nivel");

-- AddForeignKey
ALTER TABLE "SubSeccion" ADD CONSTRAINT "SubSeccion_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglaComisionGlobal" ADD CONSTRAINT "ReglaComisionGlobal_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglaComisionGlobal" ADD CONSTRAINT "ReglaComisionGlobal_subSeccionId_fkey" FOREIGN KEY ("subSeccionId") REFERENCES "SubSeccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
