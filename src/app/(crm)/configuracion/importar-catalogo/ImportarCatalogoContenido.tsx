"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { withTenant } from "@/lib/tenant-url";

type Estado = "idle" | "loading" | "ok" | "error";

export default function ImportarCatalogoContenido() {
  const { data: session, status } = useSession();
  const role = String((session?.user as any)?.role ?? (session?.user as any)?.rol ?? "").toUpperCase();

  const sp = useSearchParams();
  const adminIdQs = sp.get("adminId");

  const [seccion, setSeccion] = useState<"LUZ" | "GAS" | "TELEFONIA">("LUZ");
  const [file, setFile] = useState<File | null>(null);

  const [estado, setEstado] = useState<Estado>("idle");
  const [msg, setMsg] = useState<string>("");

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;
  if (role !== "SUPERADMIN") return <div className="p-6 text-white/80">No autorizado.</div>;

  async function importar() {
    setMsg("");

    if (!file) {
      setEstado("error");
      setMsg("Selecciona un archivo Excel (.xlsx).");
      return;
    }

    setEstado("loading");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("seccion", seccion);

    const res = await fetch("/api/crm/comisiones/importar-excel", {
      method: "POST",
      body: fd,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      setEstado("error");
      setMsg(data?.error ?? "Error importando el Excel.");
      return;
    }

    setEstado("ok");
    setMsg(`✅ Importación OK. Reglas creadas: ${data?.createdRules ?? data?.stats?.createdRules ?? 0}`);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Importar catálogo (Excel)</h1>
          <p className="text-white/70">
            Sube tu Excel (precios + comisión base SUPERADMIN) y el sistema generará reglas derivadas C1/C2/C3/ESPECIAL.
          </p>
        </div>

        <Link
          href={withTenant("/comisiones", adminIdQs)}
          className="rounded-xl bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/15"
        >
          ← Volver
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_26px_rgba(0,0,0,0.18)]">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-black/20 p-3">
            <label className="text-xs font-extrabold text-white/70">Sección</label>
            <select
              value={seccion}
              onChange={(e) => setSeccion(e.target.value as any)}
              className="mt-2 w-full rounded-lg bg-black/30 px-3 py-2 text-white outline-none"
            >
              <option value="LUZ">LUZ</option>
              <option value="GAS">GAS</option>
              <option value="TELEFONIA">TELEFONÍA</option>
            </select>
          </div>

          <div className="rounded-xl bg-black/20 p-3 md:col-span-2">
            <label className="text-xs font-extrabold text-white/70">Archivo Excel</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-lg bg-black/30 px-3 py-2 text-white outline-none"
            />
            <div className="mt-2 text-xs text-white/60">
              Consejo: primero prueba con el Excel 2.0TD que me pasaste.
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={importar}
            disabled={estado === "loading"}
            className="rounded-xl bg-emerald-500 px-4 py-2 font-extrabold text-black hover:bg-emerald-400 disabled:opacity-60"
          >
            Importar Excel
          </button>

          {msg ? (
            <div
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                estado === "error" ? "bg-red-500/15 text-red-200" : "bg-emerald-500/15 text-emerald-200"
              }`}
            >
              {msg}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
