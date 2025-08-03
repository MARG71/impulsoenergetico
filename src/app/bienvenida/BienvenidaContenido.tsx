"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Flame, Phone, PartyPopper, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type Oferta = {
  id: number;
  titulo: string;
  descripcion: string;
  descripcionLarga?: string;
  tipo: string;
  destacada: boolean;
  activa?: boolean;
};

export default function BienvenidaContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombre = searchParams.get("nombre") || "";
  const agenteId = searchParams.get("agenteId") || "";
  const lugarId = searchParams.get("lugarId") || "";
  const [filtro, setFiltro] = useState("");

  const secciones = [
    {
      nombre: "Luz",
      icono: <Sparkles className="w-10 h-10 text-yellow-100" />,
      ruta: `/comparador?seccion=luz&agenteId=${agenteId}&lugarId=${lugarId}`,
      bg: "bg-green-500",
    },
    {
      nombre: "Gas",
      icono: <Flame className="w-10 h-10 text-yellow-100" />,
      ruta: "#",
      bg: "bg-orange-500",
    },
    {
      nombre: "Telefonía",
      icono: <Phone className="w-10 h-10 text-yellow-100" />,
      ruta: "#",
      bg: "bg-blue-600",
    },
  ];

  const [ofertasDestacadas, setOfertasDestacadas] = useState<Oferta[]>([]);
  const [ofertasPorTipo, setOfertasPorTipo] = useState<{ luz: Oferta[]; gas: Oferta[]; telefonia: Oferta[] }>({
    luz: [],
    gas: [],
    telefonia: [],
  });
  const [indiceOferta, setIndiceOferta] = useState(0);

  useEffect(() => {
    const fetchOfertas = async () => {
      const [destacadas, luz, gas, telefonia] = await Promise.all([
        fetch("/api/ofertas?destacada=true").then((r) => r.json()),
        fetch("/api/ofertas?tipo=luz").then((r) => r.json()),
        fetch("/api/ofertas?tipo=gas").then((r) => r.json()),
        fetch("/api/ofertas?tipo=telefonia").then((r) => r.json()),
      ]);
      setOfertasDestacadas(destacadas);
      setOfertasPorTipo({ luz, gas, telefonia });
    };

    fetchOfertas();
  }, []);

  useEffect(() => {
    if (ofertasDestacadas.length === 0) return;
    const intervalo = setInterval(() => {
      setIndiceOferta((prev) => (prev + 1) % ofertasDestacadas.length);
    }, 6000);
    return () => clearInterval(intervalo);
  }, [ofertasDestacadas]);

  const ofertaActual = ofertasDestacadas[indiceOferta];

  const avanzar = () => {
    setIndiceOferta((prev) => (prev + 1) % ofertasDestacadas.length);
  };

  const retroceder = () => {
    setIndiceOferta((prev) => (prev - 1 + ofertasDestacadas.length) % ofertasDestacadas.length);
  };

  const handleClick = (seccion: string, ruta: string) => {
    if (seccion === "Luz") {
      router.push(ruta);
    } else {
      alert("🔧 Esta sección está en construcción. Muy pronto estará disponible.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen w-full bg-gradient-to-br from-emerald-100 via-sky-100 to-blue-100 flex flex-col items-center px-4 py-8"
    >
      {/* Logo y saludo */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center mb-4 px-4 gap-4">
        <Image
          src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
          alt="Logo Impulso Energético"
          width={160}
          height={50}
          priority
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xl sm:text-2xl md:text-3xl text-green-600 text-center"
        >
          <PartyPopper className="inline-block w-6 h-6 mr-2 animate-bounce" />
          ¡Bienvenido{nombre ? `, ${nombre}` : ""}!
        </motion.div>
      </div>

      <p className="text-center text-gray-600 mb-4 max-w-xl text-sm md:text-base">
        Gracias por confiar en <strong>Impulso Energético</strong>. Elige el servicio que deseas comparar o consulta nuestras promociones exclusivas.
      </p>

      {/* Secciones */}
      <div className="w-full max-w-5xl bg-gradient-to-r from-green-400 via-orange-400 to-blue-500 rounded-xl p-6 mb-6 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {secciones.map((sec) => (
            <Card
              key={sec.nombre}
              onClick={() => handleClick(sec.nombre, sec.ruta)}
              className={`cursor-pointer text-white ${sec.bg} shadow-md hover:shadow-lg transition-transform hover:scale-105`}
            >
              <CardContent className="flex flex-col items-center py-4">
                {sec.icono}
                <span className="text-base md:text-lg font-medium mt-2">{sec.nombre}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-center text-white text-sm font-semibold bg-pink-600 px-4 py-1 rounded-xl shadow-lg animate-pulse mb-4">
        🔜 Más servicios próximamente disponibles
      </p>

      {/* Carrusel dinámico */}
      {ofertaActual && (
        <div className="w-full py-6 px-4 rounded-xl shadow max-w-4xl mb-6 bg-gradient-to-r from-blue-100 to-indigo-100">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">Ofertas Especiales</h2>
          <div className="relative mb-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={indiceOferta}
              transition={{ duration: 0.4 }}
              className="rounded-xl px-6 py-5 text-center bg-white shadow-md min-h-[160px]"
            >
              <h3 className="text-base md:text-lg font-semibold mb-2 text-green-800">{ofertaActual.titulo}</h3>
              <p className="text-sm md:text-base mb-4 leading-relaxed text-gray-700">{ofertaActual.descripcion}</p>
              <button
                onClick={() => alert("Más información disponible próximamente")}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition text-sm"
              >
                Ir a la oferta
              </button>
            </motion.div>
            <button onClick={retroceder} className="absolute left-[-40px] top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full p-2 shadow hover:bg-gray-100 transition">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={avanzar} className="absolute right-[-40px] top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full p-2 shadow hover:bg-gray-100 transition">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="flex justify-center space-x-1">
            {ofertasDestacadas.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${i === indiceOferta ? "bg-green-600 scale-125" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Buscador general */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="w-full max-w-5xl mb-4"
      >
        <input
          type="text"
          placeholder="🔍 Buscar ofertas por título, descripción..."
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-black placeholder-gray-500"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </form>



      {/* Ofertas por sección */}
      {Object.entries(ofertasPorTipo).map(([seccion, items]) => {
        const fondo =
          seccion === "luz"
            ? "bg-green-500"
            : seccion === "gas"
            ? "bg-orange-500"
            : "bg-blue-600";

        return (
          <div key={seccion} className={`w-full max-w-5xl ${fondo} rounded-xl px-6 py-6 mb-6 text-white`}>
            <h3 className="text-xl font-bold mb-4 capitalize">Ofertas en {seccion}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {items
                .filter((oferta) =>
                  [oferta.titulo, oferta.descripcion, oferta.descripcionLarga]
                    .join(" ")
                    .toLowerCase()
                    .includes(filtro.toLowerCase())
                )
                .map((oferta) => (
                  <div key={oferta.id} className="bg-white rounded-xl shadow p-4 text-sm text-center hover:shadow-lg transition transform hover:scale-[1.02] text-gray-700">
                    <p className="font-bold text-lg text-black mb-1">{oferta.titulo}</p>
                    <p className="text-sm text-gray-600 mb-2">{oferta.descripcion}</p>
                    <p className="text-xs italic text-gray-500 mb-2">{oferta.descripcionLarga}</p>
                    {oferta.destacada && (
                      <span className="inline-block text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded mb-2">
                        ⭐ Oferta destacada
                      </span>
                    )}
                    {!oferta.activa && (
                      <span className="inline-block text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded mb-2">
                        🔒 Inactiva
                      </span>
                    )}
                    <button
                      className={`text-white px-3 py-1 rounded text-xs font-semibold transition ${
                        seccion === "luz"
                          ? "bg-green-600 hover:bg-green-700"
                          : seccion === "gas"
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      onClick={() => alert("Más información próximamente")}
                    >
                      Ver más
                    </button>
                  </div>
                ))}

              {items.filter((oferta) =>
                [oferta.titulo, oferta.descripcion, oferta.descripcionLarga]
                  .join(" ")
                  .toLowerCase()
                  .includes(filtro.toLowerCase())
              ).length === 0 && (
                <div className="col-span-full text-center text-white text-sm italic mt-2">
                  ❌ No se encontraron ofertas para tu búsqueda.
                </div>
              )}
  
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}


