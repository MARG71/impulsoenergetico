"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Tractor, EggFried, Cheese, Milk } from "lucide-react";

const productos = [
  {
    nombre: "Alimentos para ganado",
    icono: <EggFried className="w-8 h-8 text-white" />,
    color: "bg-orange-500",
  },
  {
    nombre: "Maquinaria agrícola",
    icono: <Tractor className="w-8 h-8 text-white" />,
    color: "bg-green-600",
  },
  {
    nombre: "Lácteos y quesos",
    icono: <Cheese className="w-8 h-8 text-white" />,
    color: "bg-yellow-600",
  },
  {
    nombre: "Suministros veterinarios",
    icono: <Milk className="w-8 h-8 text-white" />,
    color: "bg-blue-600",
  },
];

export default function GanaderiaContenido() {
  const searchParams = useSearchParams();
  const agenteId = searchParams.get("agenteId") || "";
  const lugarId = searchParams.get("lugarId") || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen w-full bg-gradient-to-br from-green-100 via-lime-100 to-yellow-100 flex flex-col items-center px-4 py-8"
    >
      {/* Logo y título */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center mb-4 px-4 gap-4">
        <Image
          src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
          alt="Logo Impulso Energético"
          width={160}
          height={50}
          priority
        />
        <motion.h1
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xl sm:text-2xl md:text-3xl text-green-800 text-center font-bold"
        >
          🐄 Venta de productos ganaderos
        </motion.h1>
      </div>

      <p className="text-center text-gray-600 mb-6 max-w-xl text-sm md:text-base">
        En <strong>Impulso Energético</strong> también impulsamos el campo. Descubre nuestros productos exclusivos para profesionales ganaderos.
      </p>

      {/* Tarjetas de productos */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
        {productos.map((item) => (
          <div
            key={item.nombre}
            className={`rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-md hover:shadow-xl transition transform hover:scale-105 cursor-pointer ${item.color}`}
          >
            {item.icono}
            <h3 className="mt-3 text-lg font-semibold text-center">{item.nombre}</h3>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
