"use client";

import React from "react";

interface ModalDatosClienteProps {
  abierto: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formNombre: string;
  formEmail: string;
  formTelefono: string;
  setFormNombre: (v: string) => void;
  setFormEmail: (v: string) => void;
  setFormTelefono: (v: string) => void;
  guardando: boolean;
  mensajeGuardarError: string | null;
  mensajeGuardarOK: string | null;
}

export function ModalDatosCliente({
  abierto,
  onClose,
  onSubmit,
  formNombre,
  formEmail,
  formTelefono,
  setFormNombre,
  setFormEmail,
  setFormTelefono,
  guardando,
  mensajeGuardarError,
  mensajeGuardarOK,
}: ModalDatosClienteProps) {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-datos-titulo"
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.6)] p-5 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="modal-datos-titulo"
              className="text-lg md:text-xl font-bold text-slate-50"
            >
              Actualiza tus datos
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1">
              Revisa tu nombre, email y teléfono para poder enviarte
              ofertas y seguimiento de tus comparativas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-lg"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-200">
              Nombre completo
            </label>
            <input
              type="text"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-200">
              Email
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-200">
              Teléfono
            </label>
            <input
              type="tel"
              value={formTelefono}
              onChange={(e) => setFormTelefono(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              required
            />
          </div>

          {mensajeGuardarError && (
            <p className="text-xs text-red-300">
              {mensajeGuardarError}
            </p>
          )}
          {mensajeGuardarOK && (
            <p className="text-xs text-emerald-300">
              {mensajeGuardarOK}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-600 text-xs md:text-sm text-slate-200 hover:bg-slate-800/70"
            >
              Salir sin guardar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-emerald-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
