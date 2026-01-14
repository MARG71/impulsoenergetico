-- CreateEnum
CREATE TYPE "TipoCartelGenerado" AS ENUM ('A4_QR', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "AccionCartelGenerado" AS ENUM ('IMPRIMIR', 'DESCARGAR_PDF', 'DESCARGAR_PNG');

-- CreateTable
CREATE TABLE "carteles_generados" (
    "id" SERIAL NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoCartelGenerado" NOT NULL,
    "accion" "AccionCartelGenerado" NOT NULL,
    "lugarId" INTEGER NOT NULL,
    "fondoId" INTEGER,
    "fondoUrlSnap" TEXT,
    "qrUrlSnap" TEXT,
    "creadoPorId" INTEGER,
    "adminId" INTEGER,

    CONSTRAINT "carteles_generados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "carteles_generados_lugarId_creadoEn_idx" ON "carteles_generados"("lugarId", "creadoEn");

-- CreateIndex
CREATE INDEX "carteles_generados_tipo_accion_creadoEn_idx" ON "carteles_generados"("tipo", "accion", "creadoEn");

-- CreateIndex
CREATE INDEX "carteles_generados_adminId_idx" ON "carteles_generados"("adminId");

-- AddForeignKey
ALTER TABLE "carteles_generados" ADD CONSTRAINT "carteles_generados_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteles_generados" ADD CONSTRAINT "carteles_generados_fondoId_fkey" FOREIGN KEY ("fondoId") REFERENCES "Fondo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteles_generados" ADD CONSTRAINT "carteles_generados_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteles_generados" ADD CONSTRAINT "carteles_generados_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
