-- CreateTable
CREATE TABLE "ResultadoComparativa" (
    "id" SERIAL NOT NULL,
    "comparativaId" INTEGER NOT NULL,
    "compañia" TEXT NOT NULL,
    "tarifa" TEXT NOT NULL,
    "precioAnual" DOUBLE PRECISION NOT NULL,
    "ahorroEstimado" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ResultadoComparativa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResultadoComparativa" ADD CONSTRAINT "ResultadoComparativa_comparativaId_fkey" FOREIGN KEY ("comparativaId") REFERENCES "Comparativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
