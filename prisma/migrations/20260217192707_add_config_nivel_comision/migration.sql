-- DropIndex
DROP INDEX "ReglaComisionGlobal_seccionId_subSeccionId_nivel_key";

-- CreateTable
CREATE TABLE "ConfigNivelComision" (
    "id" SERIAL NOT NULL,
    "seccionId" INTEGER NOT NULL,
    "subSeccionId" INTEGER,
    "nivel" "NivelComision" NOT NULL,
    "pctSobreBase" DECIMAL(6,3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,
    "adminId" INTEGER,

    CONSTRAINT "ConfigNivelComision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConfigNivelComision_adminId_seccionId_subSeccionId_nivel_ac_idx" ON "ConfigNivelComision"("adminId", "seccionId", "subSeccionId", "nivel", "activa");

-- CreateIndex
CREATE INDEX "ConfigNivelComision_seccionId_subSeccionId_idx" ON "ConfigNivelComision"("seccionId", "subSeccionId");

-- CreateIndex
CREATE INDEX "ReglaComisionGlobal_adminId_seccionId_subSeccionId_nivel_idx" ON "ReglaComisionGlobal"("adminId", "seccionId", "subSeccionId", "nivel");

-- AddForeignKey
ALTER TABLE "ConfigNivelComision" ADD CONSTRAINT "ConfigNivelComision_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigNivelComision" ADD CONSTRAINT "ConfigNivelComision_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigNivelComision" ADD CONSTRAINT "ConfigNivelComision_subSeccionId_fkey" FOREIGN KEY ("subSeccionId") REFERENCES "SubSeccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
