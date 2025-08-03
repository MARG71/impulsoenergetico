-- CreateTable
CREATE TABLE "ProductoGanadero" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "precioCoste" DOUBLE PRECISION NOT NULL,
    "margen" DOUBLE PRECISION NOT NULL,
    "precioPVP" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION,
    "precioFinal" DOUBLE PRECISION NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductoGanadero_pkey" PRIMARY KEY ("id")
);
