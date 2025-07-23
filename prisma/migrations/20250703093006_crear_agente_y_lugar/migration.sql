-- CreateTable
CREATE TABLE "Agente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,

    CONSTRAINT "Agente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lugar" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "agenteId" INTEGER NOT NULL,

    CONSTRAINT "Lugar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agente_email_key" ON "Agente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lugar_qrCode_key" ON "Lugar"("qrCode");

-- AddForeignKey
ALTER TABLE "Comparativa" ADD CONSTRAINT "Comparativa_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparativa" ADD CONSTRAINT "Comparativa_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lugar" ADD CONSTRAINT "Lugar_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
