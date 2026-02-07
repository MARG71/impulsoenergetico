//src/app/(crm)/comisiones/admin/AdminComisionesContenido.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AdminComisionesContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;

  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white font-extrabold">Acceso no permitido</div>
          <p className="text-white/70 text-sm mt-2">
            Esta sección es para Admin (y Superadmin en modo supervisión).
          </p>
          <Link href="/comisiones" className="inline-block mt-4 text-emerald-300 font-extrabold">
            ← Volver a Comisiones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Planes de comisión (Admin)</h1>
        <p className="text-white/70">
          Aquí el admin definirá planes por sección/subsección/nivel y overrides por agente/lugar.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-white font-extrabold">Estado</div>
        <p className="text-white/70 text-sm mt-2">
          Placeholder listo. Siguiente paso: crear modelos PlanComisionAdmin / Overrides y CRUD.
        </p>

        <div className="mt-4 flex gap-2">
          <Link
            href="/comisiones/mis-comisiones"
            className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-[13px] font-extrabold text-white transition"
          >
            Ver mis comisiones
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
