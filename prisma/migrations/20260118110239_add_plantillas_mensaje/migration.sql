-- CreateTable
CREATE TABLE "PlantillaMensaje" (
    "id" SERIAL NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,
    "adminId" INTEGER,
    "canal" TEXT NOT NULL DEFAULT 'whatsapp',
    "etapa" TEXT NOT NULL,
    "variante" TEXT NOT NULL DEFAULT 'A',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,

    CONSTRAINT "PlantillaMensaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlantillaMensaje_adminId_canal_etapa_variante_idx" ON "PlantillaMensaje"("adminId", "canal", "etapa", "variante");

-- AddForeignKey
ALTER TABLE "PlantillaMensaje" ADD CONSTRAINT "PlantillaMensaje_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
