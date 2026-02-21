"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

type Props = {
  qs: string;
  lugarNombre: string | null;
  fondoUrl: string | null;
};

const HomeContenido: React.FC<Props> = ({ qs, lugarNombre, fondoUrl }) => {
  const router = useRouter();

  // ✅ mantiene trazabilidad QR
  const qsFinal = useMemo(() => (qs ? `?${qs}` : ""), [qs]);

  const irAlCRM = () => {
    router.push("/login");
  };

  const irARegistro = () => {
    router.push(`/registro${qsFinal}`);
  };

  const irAComparador = (tipo?: "luz" | "gas" | "telefonia") => {
    if (tipo) {
      router.push(`/comparador?tipo=${tipo}${qs ? `&${qs}` : ""}`);
    } else {
      router.push(`/comparador${qsFinal}`);
    }
  };

  const irAGanaderia = () => {
    router.push(`/ganaderia${qsFinal}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ✅ IMAGEN DEL CARTEL ACTIVO */}
      {fondoUrl && (
        <div className="w-full bg-slate-900 flex justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fondoUrl}
            alt="Oferta Impulso Energético"
            className="max-w-md w-full rounded-xl shadow-xl"
          />
        </div>
      )}

      {/* CABECERA */}
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between">

          <div className="flex items-center gap-3">

            <Image
              src="/LOGO-DEFINITIVO-IMPULSO-ENERGETICO.png"
              alt="Impulso Energético"
              width={70}
              height={70}
              className="h-12 w-auto"
            />

            <div>

              <div className="text-xs font-bold text-sky-800 uppercase">
                Impulso Energético
              </div>

              {lugarNombre && (
                <div className="text-xs text-slate-500">
                  📍 {lugarNombre}
                </div>
              )}

            </div>

          </div>

          <button
            onClick={irARegistro}
            className="px-4 py-2 rounded-full bg-sky-700 text-white font-bold"
          >
            Registro
          </button>

        </div>
      </header>


      {/* CONTENIDO */}
      <main className="max-w-6xl mx-auto px-4 py-10">

        <h1 className="text-3xl font-bold text-center text-sky-800 mb-6">
          Accede a tus ofertas personalizadas
        </h1>


        <div className="grid gap-4 md:grid-cols-2">

          <button
            onClick={irARegistro}
            className="bg-sky-700 text-white p-6 rounded-xl font-bold text-lg"
          >
            Registrarme
          </button>

          <button
            onClick={() => irAComparador()}
            className="bg-green-600 text-white p-6 rounded-xl font-bold text-lg"
          >
            Ver ofertas
          </button>

          <button
            onClick={() => irAComparador("luz")}
            className="bg-yellow-500 text-white p-6 rounded-xl font-bold"
          >
            Luz
          </button>

          <button
            onClick={() => irAComparador("gas")}
            className="bg-orange-500 text-white p-6 rounded-xl font-bold"
          >
            Gas
          </button>

          <button
            onClick={() => irAComparador("telefonia")}
            className="bg-blue-500 text-white p-6 rounded-xl font-bold"
          >
            Telefonía
          </button>

          <button
            onClick={irAGanaderia}
            className="bg-green-800 text-white p-6 rounded-xl font-bold"
          >
            Ganadería
          </button>

        </div>


        <div className="mt-10 text-center">

          <button
            onClick={irAlCRM}
            className="text-sm text-slate-500 underline"
          >
            Acceso agentes / CRM
          </button>

        </div>

      </main>

    </div>
  );
};

export default HomeContenido;
