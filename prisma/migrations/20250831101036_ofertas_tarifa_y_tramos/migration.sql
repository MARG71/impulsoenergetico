-- CreateEnum
CREATE TYPE "TipoOferta" AS ENUM ('LUZ', 'GAS', 'TELEFONIA');

-- CreateTable
CREATE TABLE "OfertaTarifa" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoOferta" NOT NULL,
    "subtipo" TEXT NOT NULL,
    "compania" TEXT NOT NULL,
    "anexoPrecio" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "descripcionCorta" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "precioKwhP1" DECIMAL(10,6),
    "precioKwhP2" DECIMAL(10,6),
    "precioKwhP3" DECIMAL(10,6),
    "precioKwhP4" DECIMAL(10,6),
    "precioKwhP5" DECIMAL(10,6),
    "precioKwhP6" DECIMAL(10,6),
    "comisionKwhAdminBase" DECIMAL(10,6),
    "payload" JSONB,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfertaTarifa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfertaTarifaTramo" (
    "id" SERIAL NOT NULL,
    "ofertaTarifaId" INTEGER NOT NULL,
    "consumoDesdeKWh" INTEGER NOT NULL,
    "consumoHastaKWh" INTEGER,
    "comisionKwhAdmin" DECIMAL(10,6),
    "comisionFijaAdmin" DECIMAL(10,2),
    "pctCliente" DECIMAL(5,4),
    "pctLugar" DECIMAL(5,4),
    "pctAgente" DECIMAL(5,4),
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,

    CONSTRAINT "OfertaTarifaTramo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfertaTarifa_tipo_subtipo_compania_idx" ON "OfertaTarifa"("tipo", "subtipo", "compania");

-- CreateIndex
CREATE INDEX "OfertaTarifa_tipo_subtipo_anexoPrecio_idx" ON "OfertaTarifa"("tipo", "subtipo", "anexoPrecio");

-- CreateIndex
CREATE UNIQUE INDEX "OfertaTarifa_tipo_subtipo_compania_nombre_anexoPrecio_key" ON "OfertaTarifa"("tipo", "subtipo", "compania", "nombre", "anexoPrecio");

-- CreateIndex
CREATE INDEX "OfertaTarifaTramo_ofertaTarifaId_idx" ON "OfertaTarifaTramo"("ofertaTarifaId");

-- CreateIndex
CREATE INDEX "OfertaTarifaTramo_consumoDesdeKWh_consumoHastaKWh_idx" ON "OfertaTarifaTramo"("consumoDesdeKWh", "consumoHastaKWh");

-- CreateIndex
CREATE UNIQUE INDEX "OfertaTarifaTramo_ofertaTarifaId_consumoDesdeKWh_consumoHas_key" ON "OfertaTarifaTramo"("ofertaTarifaId", "consumoDesdeKWh", "consumoHastaKWh");

-- AddForeignKey
ALTER TABLE "OfertaTarifaTramo" ADD CONSTRAINT "OfertaTarifaTramo_ofertaTarifaId_fkey" FOREIGN KEY ("ofertaTarifaId") REFERENCES "OfertaTarifa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
