//src/app/(crm)/comisiones/ComisionesContenido.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { withTenant } from "@/lib/tenant-url";


function Card({ title, desc, href, tag }: { title: string; desc: string; href: string; tag?: string }) {
  return (
    <Link href={href} className="block">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition shadow-[0_0_26px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-lg font-extrabold text-white">{title}</h2>
          <span className="text-[11px] font-extrabold px-2 py-1 rounded-lg bg-emerald-400/15 text-emerald-200 border border-emerald-400/20">
            {tag ?? "Entrar"}
          </span>
        </div>
        <p className="text-sm text-white/70">{desc}</p>
      </div>
    </Link>
  );
}

export default function ComisionesContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const sp = useSearchParams();
  const adminIdQs = sp.get("adminId");


  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session || !role) return <div className="p-6 text-white/80">No autenticado.</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Comisiones</h1>
        <p className="text-white/70">
          Tu panel de comisiones según rol. <span className="font-extrabold">Rol:</span> {role}
        </p>
      </div>

      {role === "SUPERADMIN" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card
            title="Secciones y subsecciones"
            desc="Crea y edita secciones/subsecciones cuando quieras."
            href={withTenant("/configuracion/secciones", adminIdQs)}
            tag="Global"
          />

          <Card
            title="Comisiones globales"
            desc="Define C1/C2/C3/ESPECIAL por sección/subsección (fijo, %, min/max, límites)."
            href={withTenant("/configuracion/comisiones-globales", adminIdQs)}
            tag="Global"
          />

          <Card
            title="Contrataciones"
            desc="Centro de cierres para calcular comisiones y adjuntar documentación."
            href={withTenant("/contrataciones", adminIdQs)}
            tag="Centro"
          />

          <Card
            title="Clientes"
            desc="Historial de compras/contrataciones por cliente (se activa al cerrar)."
            href={withTenant("/clientes", adminIdQs)}
            tag="Historial"
          />

          <Card
            title="Importar catálogo + comisiones (Excel)"
            desc="Sube el Excel de tarifas (precios + comisión base SUPERADMIN) y genera reglas C1/C2/C3/ESPECIAL automáticamente."
            href={withTenant("/configuracion/importar-catalogo", adminIdQs)}
            tag="Import"
          />

        </div>
      )}

      {role === "ADMIN" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card
            title="Mis planes de comisiones"
            desc="Configura comisiones para tus agentes/lugares (dentro de límites globales)."
            href="/comisiones/admin"
            tag="Admin"
          />
          <Card
            title="Mis comisiones"
            desc="Consulta tu histórico y totales por sección."
            href="/comisiones/mis-comisiones"
            tag="Resumen"
          />
          <Card
            title="Contrataciones"
            desc="Ver cierres y estados de tu red."
            href="/contrataciones"
            tag="Centro"
          />
          <Card
            title="Clientes"
            desc="Historial de clientes relacionados con tu red."
            href="/clientes"
            tag="Historial"
          />
        </div>
      )}

      {(role === "AGENTE" || role === "LUGAR") && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card
            title="Mis comisiones"
            desc="Consulta tu histórico y totales (se alimenta desde Contrataciones)."
            href="/comisiones/mis-comisiones"
            tag="Mis datos"
          />
          <Card
            title="Contrataciones"
            desc="Tus cierres y su estado (pendiente/confirmada/cancelada)."
            href="/contrataciones"
            tag="Centro"
          />
          <Card
            title="Clientes"
            desc="Clientes asociados a tus contrataciones."
            href="/clientes"
            tag="Historial"
          />
        </div>
      )}
    </div>
  );
}
