-- CreateTable
CREATE TABLE "FondoActivo" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "url" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FondoActivo_pkey" PRIMARY KEY ("id")
);
