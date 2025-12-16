"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import CRMClienteLayout from "../../CRMClienteLayout";

type Panel = {
  lugares: Array<{ id: number; nombre: string; direccion: string; creadoEn: string }>;
  qrs: Array<{ id: number; codigo: string; lugarId: number }>;
};

export default function AgenteLugaresContenido() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<Panel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role = (session?.user as any)?.role ?? null;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) return setError("Debes iniciar sesión.");
    if (role !== "AGENTE") return setError("Solo AGENTE.");

    (async () => {
      const res = await fetch("/api/panel-agente");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.error || "Error cargando lugares");
      setData(json);
    })();
  }, [session, status, role]);

  const qrsPorLugar = useMemo(() => {
    const map = new Map<number, number>();
    (data?.qrs || []).forEach((q) => map.set(q.lugarId, (map.get(q.lugarId) || 0) + 1));
    return map;
  }, [data]);

  return (
    <CRMClienteLayout>
      <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-2">Tus lugares</h1>
          <p className="text-sm text-slate-300 mb-6">Lugares asociados a tu cuenta y número de QR por lugar.</p>

          {error && <div className="rounded-2xl bg-red-900/70 border border-red-600 px-6 py-4 mb-6">{error}</div>}

          {!data ? (
            <div className="text-slate-300">Cargando…</div>
          ) : (
            <div className="space-y-3">
              {data.lugares.map((l) => (
                <div key={l.id} className="rounded-2xl bg-slate-950/80 border border-slate-800 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-50">{l.nombre}</p>
                      <p className="text-xs text-slate-400 mt-1">{l.direccion}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-700">
                      {qrsPorLugar.get(l.id) || 0} QR
                    </span>
                  </div>
                </div>
              ))}
              {data.lugares.length === 0 && (
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800 px-6 py-10 text-center text-slate-400">
                  No tienes lugares asignados.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </CRMClienteLayout>
  );
}
