-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comparativa" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipoServicio" TEXT NOT NULL,
    "tipoTarifa" TEXT NOT NULL,
    "nombreTarifa" TEXT NOT NULL,
    "consumoAnual" DOUBLE PRECISION NOT NULL,
    "importeFactura" DOUBLE PRECISION NOT NULL,
    "ahorro" DOUBLE PRECISION NOT NULL,
    "comision" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qrId" TEXT,

    CONSTRAINT "Comparativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "compañia" TEXT NOT NULL,
    "tarifa" TEXT NOT NULL,
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comision" DOUBLE PRECISION NOT NULL,
    "agenteId" TEXT,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "Agente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lugar" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,

    CONSTRAINT "Lugar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QR" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "lugarId" TEXT NOT NULL,
    "agenteId" TEXT,

    CONSTRAINT "QR_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Agente_email_key" ON "Agente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "QR_codigo_key" ON "QR"("codigo");

-- AddForeignKey
ALTER TABLE "Comparativa" ADD CONSTRAINT "Comparativa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparativa" ADD CONSTRAINT "Comparativa_qrId_fkey" FOREIGN KEY ("qrId") REFERENCES "QR"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QR" ADD CONSTRAINT "QR_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QR" ADD CONSTRAINT "QR_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
