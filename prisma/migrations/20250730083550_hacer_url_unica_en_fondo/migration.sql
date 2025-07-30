-- CreateTable
CREATE TABLE "Fondo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Fondo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionGlobal" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "fondoCartelUrl" TEXT NOT NULL,

    CONSTRAINT "ConfiguracionGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fondo_url_key" ON "Fondo"("url");
