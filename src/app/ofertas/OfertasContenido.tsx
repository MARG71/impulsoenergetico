"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

type Props = {
  qs: string;
  lugarNombre: string | null;
  fondoUrl: string | null;
};

export default function OfertasContenido({
  qs,
  lugarNombre,
  fondoUrl,
}: Props) {
  const router = useRouter();

  const qsFinal = useMemo(() => (qs ? `?${qs}` : ""), [qs]);

  const irRegistro = () => router.push(`/registro${qsFinal}`);

  const irOfertas = () => router.push(`/comparador${qsFinal}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-sky-50">


      {/* HERO */}

      <div className="text-center pt-10 px-4">


        {/* LOGO */}

        <div className="flex justify-center">

          <Image
            src="/LOGO-DEFINITIVO-IMPULSO-ENERGETICO.png"
            alt="Impulso Energético"
            width={140}
            height={140}
            priority
          />

        </div>


        <h1 className="mt-6 text-3xl font-extrabold text-sky-800">

          Bienvenido a Impulso Energético

        </h1>


        {lugarNombre && (

          <p className="mt-2 text-slate-500">

            Oferta exclusiva en {lugarNombre}

          </p>

        )}


        <p className="mt-4 text-slate-600">

          Ahorra en luz, gas, telefonía y más

        </p>


      </div>



      {/* CARTEL */}

      {fondoUrl && (

        <div className="flex justify-center mt-8 px-4">

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fondoUrl}
            className="rounded-2xl shadow-2xl max-w-md w-full"
            alt="Oferta"
          />

        </div>

      )}



      {/* BOTONES */}

      <div className="mt-10 px-6 space-y-4">


        {/* REGISTRO */}

        <button
          onClick={irRegistro}
          className="
          w-full
          bg-gradient-to-r
          from-sky-600
          to-sky-800
          text-white
          font-bold
          text-lg
          py-4
          rounded-xl
          shadow-xl
          active:scale-95
          transition
          "
        >

          REGISTRARME GRATIS

        </button>



        {/* OFERTAS */}

        <button
          onClick={irOfertas}
          className="
          w-full
          bg-white
          border-2
          border-sky-700
          text-sky-700
          font-bold
          text-lg
          py-4
          rounded-xl
          shadow-md
          active:scale-95
          transition
          "
        >

          VER OFERTAS

        </button>



      </div>



      {/* BENEFICIOS */}

      <div className="mt-12 px-6 pb-16">


        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">


          <div className="flex gap-3">

            <div>⚡</div>

            <div>Ahorro garantizado</div>

          </div>


          <div className="flex gap-3">

            <div>🎁</div>

            <div>Regalos por contratar</div>

          </div>


          <div className="flex gap-3">

            <div>📊</div>

            <div>Estudio gratuito</div>

          </div>


          <div className="flex gap-3">

            <div>🔒</div>

            <div>Registro seguro</div>

          </div>


        </div>


      </div>


    </div>
  );
}
