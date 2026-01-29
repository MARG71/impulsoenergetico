"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function MisComisionesContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;

  const label =
    role === "SUPERADMIN" ? "Vista global (supervisión)"
    : role === "ADMIN" ? "Mis comisiones (Admin)"
    : role === "AGENTE" ? "Mis comisiones (Agente)"
    : role === "LUGAR" ? "Mis comisiones (Lugar)"
    : "Mis comisiones";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">{label}</h1>
        <p className="text-white/70">
          Aquí mostraremos el histórico y totales por sección, alimentado desde Contrataciones.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-white font-extrabold">Estado</div>
        <p className="text-white/70 text-sm mt-2">
          Placeholder listo. Siguiente paso: ledger/movimientos y resumen por periodo.
        </p>

        <div className="mt-4 flex gap-2">
          <Link
            href="/contrataciones"
            className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-[13px] font-extrabold text-white transition"
          >
            Ir a Contrataciones
          </Link>
          <Link
            href="/comisiones"
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-extrabold text-slate-950 transition"
          >
            Volver a Comisiones
          </Link>
        </div>
      </div>
    </div>
  );
}
