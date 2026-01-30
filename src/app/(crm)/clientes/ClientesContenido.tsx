"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type Cliente = {
  id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  creadoEn: string;
  contrataciones: Array<{
    id: number;
    estado: string;
    nivel: string;
    creadaEn: string;
    seccion?: { nombre: string };
    subSeccion?: { nombre: string } | null;
  }>;
};

function normalizeItems<T>(json: any): T[] {
  // Soporta: { ok:true, items:[...] }  o  [...]
  if (Array.isArray(json)) return json as T[];
  if (json && Array.isArray(json.items)) return json.items as T[];
  return [];
}

export default function ClientesContenido() {
  const { data: session, status } = useSession();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/clientes?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Error clientes");
      }

      const arr = normalizeItems<Cliente>(json);
      setItems(arr);
    } catch (e: any) {
      setItems([]);
      toast.error(String(e?.message || e || "Error clientes"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "loading" && session) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Clientes</h1>
          <p className="text-white/70">Se crean/vinculan automáticamente al confirmar una contratación.</p>
        </div>

        <div className="flex gap-2">
          <input
            className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold w-[260px]"
            placeholder="Buscar por nombre/email/teléfono…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={load}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-extrabold text-slate-950 transition"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 text-white font-extrabold">Listado</div>

        {loading ? (
          <div className="p-5 text-white/70">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-5 text-white/70">
            No hay clientes aún. <span className="text-white/50">Se crearán al confirmar contrataciones.</span>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {items.map((c) => (
              <div key={c.id} className="p-5">
                <div className="text-white font-extrabold">
                  #{c.id} · {c.nombre}
                </div>
                <div className="text-white/70 text-sm mt-1">
                  {c.email ? <span className="mr-3">📧 {c.email}</span> : null}
                  {c.telefono ? <span>📱 {c.telefono}</span> : null}
                </div>

                {c.contrataciones?.length ? (
                  <div className="mt-3 text-sm text-white/70">
                    <div className="font-extrabold text-white mb-1">Últimas contrataciones</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {c.contrataciones.slice(0, 5).map((ct) => (
                        <li key={ct.id}>
                          #{ct.id} · {ct.seccion?.nombre ?? "Sección"}
                          {ct.subSeccion?.nombre ? ` / ${ct.subSeccion.nombre}` : ""} · {ct.nivel} · {ct.estado}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-white/60">Sin historial todavía.</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
