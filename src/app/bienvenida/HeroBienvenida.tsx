"use client";

import Image from "next/image";
import React from "react";

type AccesoRapido = {
  label: string;
  onClick: () => void;
};

interface HeroBienvenidaProps {
  nombre: string | null;
  agenteId: string | null;
  lugarId: string | null;
  accesosRapidos: AccesoRapido[];
  hayClubEspecial: boolean;
  clubLogoUrl: string | null;
  clubNombre: string | null;
  clubMensaje: string | null;
  clubAportacion: number | null;
  clubColorAcento: string;
  onAbrirModal: () => void;
  onIrALuz: () => void;
}

export function HeroBienvenida({
  nombre,
  agenteId,
  lugarId,
  accesosRapidos,
  hayClubEspecial,
  clubLogoUrl,
  clubNombre,
  clubMensaje,
  clubAportacion,
  clubColorAcento,
  onAbrirModal,
  onIrALuz,




}: HeroBienvenidaProps) {


  const nombreVisible = nombre?.trim() || null;
  
  return (
    <div className="rounded-3xl bg-slate-950/95 border border-emerald-500/50 p-6 flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch shadow-xl shadow-emerald-500/30">
      {/* Columna logo + contacto + claim */}
      <div className="flex flex-col justify-between gap-4 lg:w-[280px] xl:w-[320px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <div className="relative h-16 w-64 md:h-20 md:w-72">
              <Image
                src="/logo-impulso.png"
                alt="Impulso Energético"
                fill
                className="object-contain drop-shadow-[0_0_24px_rgba(16,231,152,0.75)]"
                priority
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-base md:text-lg font-bold text-slate-50">
              Tel. 692 13 70 48
            </p>
            <p className="text-base md:text-lg font-bold text-slate-50">
              E-mail:{" "}
              <a
                href="mailto:info@impulsoenergetico.es"
                className="underline decoration-emerald-400/70 underline-offset-4"
              >
                info@impulsoenergetico.es
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-1 mt-2">
          <p className="text-base md:text-lg font-bold text-slate-50">
            Plataforma de ahorro y comisiones
          </p>
          <p className="text-[11px] md:text-xs tracking-[0.22em] uppercase text-emerald-300 font-semibold">
            Servicios y ventajas para socios
          </p>
        </div>
      </div>

      {/* Columna mensaje bienvenida + accesos rápidos + club */}
      <div className="flex-1 rounded-2xl bg-slate-900/80 border border-slate-700/80 p-4 md:p-5 lg:p-6 shadow-[0_0_32px_rgba(15,23,42,0.9)] flex flex-col lg:flex-row gap-5 lg:gap-7 items-start justify-between">
        {/* Mensaje principal + accesos rápidos */}
        <div className="flex-1 space-y-3">
          <div className="text-[10px] md:text-xs font-semibold tracking-[0.28em] text-emerald-300 uppercase">
            IMPULSO ENERGÉTICO
          </div>

          <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight">
            {nombreVisible && (
                <>
                Hola,{" "}
                <span className="text-emerald-400 font-extrabold">
                    {nombreVisible}
                </span>{" "}
                👋
                <br />
                </>
            )}
            Ahorra en tus facturas y{" "}
            <span className="text-amber-300 font-extrabold">
                gana comisiones
            </span>{" "}
            desde hoy.
          </h1>


          <p className="mt-2 text-xs text-amber-300 font-bold">
            VERSIÓN CON PLADUR ACTIVADA
          </p>

          {(agenteId || lugarId) && (
            <p className="text-[11px] text-slate-400">
              QR detectado ·{" "}
              {agenteId && (
                <>
                  Agente: <b>{agenteId}</b>{" "}
                </>
              )}
              {lugarId && (
                <>
                  · Lugar: <b>{lugarId}</b>
                </>
              )}
            </p>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
            {/* Botones principales */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onAbrirModal}
                className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 font-semibold text-slate-950 shadow shadow-emerald-500/40 text-xs md:text-sm"
              >
                Acceder / actualizar mis datos
              </button>
              <button
                onClick={onIrALuz}
                className="px-4 py-2.5 rounded-full border border-emerald-300 text-emerald-200 hover:bg-emerald-500/10 text-xs md:text-sm"
              >
                LUZ
              </button>
            </div>

            {/* Accesos rápidos */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-slate-300">
                ACCESOS RÁPIDOS A SECCIONES
              </span>
              <div className="flex flex-wrap gap-2">
                {accesosRapidos.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.onClick}
                    className="px-3 py-1.5 rounded-full border border-slate-600 text-[11px] text-slate-100 hover:bg-slate-800/80"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bloque Club / Asociación */}
        {hayClubEspecial && (
          <div
            className="w-full lg:w-[260px] xl:w-[300px] relative overflow-hidden rounded-2xl bg-slate-950/80 border p-4 flex gap-4 items-center shadow-[0_0_28px_rgba(16,185,129,0.45)]"
            style={{
              borderColor: clubColorAcento || "#22c55e",
              boxShadow: `0 0 32px ${
                clubColorAcento || "rgba(34,197,94,0.55)"
              }`,
            }}
          >
            <span className="pointer-events-none absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/10 blur-xl opacity-60" />

            <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-slate-900/90 border border-white/15 flex items-center justify-center overflow-hidden">
              {clubLogoUrl ? (
                <Image
                  src={clubLogoUrl}
                  alt={clubNombre || "Logo club"}
                  fill
                  className="object-contain"
                />
              ) : (
                <span className="text-2xl">🤝</span>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="text-[9px] uppercase tracking-[0.22em] text-emerald-200/90 font-semibold">
                Club / Asociación
              </div>
              <div className="text-xs md:text-sm font-bold">
                {clubNombre || "Programa solidario"}
              </div>
              {clubMensaje && (
                <p className="text-[10px] md:text-xs text-slate-200/90">
                  {clubMensaje}
                </p>
              )}
              {clubAportacion != null && !Number.isNaN(clubAportacion) && (
                <div className="inline-flex items-center mt-1 rounded-full bg-black/40 px-3 py-1 text-[10px] font-semibold text-emerald-200 border border-emerald-300/50">
                  💚 Aportación acumulada:{" "}
                  <span className="ml-1">
                    {clubAportacion.toLocaleString("es-ES", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
