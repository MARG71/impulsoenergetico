-- CreateTable
CREATE TABLE "FondoCartel" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FondoCartel_pkey" PRIMARY KEY ("id")
);
