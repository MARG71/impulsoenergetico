"use client";

import { useSession } from "next-auth/react";

export default function ContratacionesContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session || !role) return <div className="p-6 text-white/80">No autenticado.</div>;

  const scope =
    role === "SUPERADMIN" ? "Todas (global)"
    : role === "ADMIN" ? "De mi red"
    : role === "AGENTE" ? "Mis cierres"
    : role === "LUGAR" ? "De mi lugar"
    : "—";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Contrataciones</h1>
        <p className="text-white/70">
          Centro de cierres. Ámbito: <span className="font-extrabold">{scope}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-white font-extrabold mb-2">Estado</div>
        <p className="text-white/70 text-sm">
          Esta pantalla será el núcleo: aquí se registrará cada cierre (luz, gas, telefonía, ferretería, etc.),
          con sección/subsección, nivel (C1/C2/C3/ESPECIAL), documentación y cálculo de comisión.
        </p>

        <div className="mt-4 text-sm text-white/70">
          Próximo paso: crear listado + botón “Nueva contratación” (solo ADMIN/SUPERADMIN) y conexión con cierre de comparativas.
        </div>
      </div>
    </div>
  );
}
