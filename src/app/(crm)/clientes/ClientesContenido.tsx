"use client";

import { useSession } from "next-auth/react";

export default function ClientesContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session || !role) return <div className="p-6 text-white/80">No autenticado.</div>;

  const scope =
    role === "SUPERADMIN" ? "Todos los clientes (global)"
    : role === "ADMIN" ? "Clientes de mi red"
    : role === "AGENTE" ? "Clientes asociados a mis cierres"
    : role === "LUGAR" ? "Clientes de mi lugar"
    : "—";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Clientes</h1>
        <p className="text-white/70">
          Historial: <span className="font-extrabold">{scope}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-white font-extrabold mb-2">Cómo funcionará</div>
        <p className="text-white/70 text-sm">
          Seguimos usando Leads como entrada. Cuando una contratación se confirme,
          el sistema creará (o vinculará) un Cliente automáticamente, y aquí verás su historial completo:
          qué compró, en qué secciones, y cuándo.
        </p>

        <div className="mt-4 text-sm text-white/70">
          Próximo paso: listado + buscador + ficha de cliente con historial de contrataciones.
        </div>
      </div>
    </div>
  );
}
