-- CreateTable
CREATE TABLE "SolicitudContrato" (
    "id" SERIAL NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "dni" TEXT,
    "direccionSuministro" TEXT,
    "cups" TEXT,
    "iban" TEXT,
    "ofertaId" INTEGER,
    "compania" TEXT,
    "tarifa" TEXT,
    "agenteId" INTEGER,
    "lugarId" INTEGER,
    "tipoCliente" TEXT,
    "nombreTarifa" TEXT,

    CONSTRAINT "SolicitudContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudContratoArchivo" (
    "id" SERIAL NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solicitudId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "tipo" TEXT,
    "nombreOriginal" TEXT,
    "mime" TEXT,
    "size" INTEGER,

    CONSTRAINT "SolicitudContratoArchivo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SolicitudContratoArchivo" ADD CONSTRAINT "SolicitudContratoArchivo_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudContrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
