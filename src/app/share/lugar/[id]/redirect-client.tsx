// src/app/share/lugar/[id]/redirect-client.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Estado = "idle" | "ok" | "error";

export default function RedirectClient({
  to,
  delayMs = 1200,
  debug = true,
}: {
  to: string;
  delayMs?: number;
  debug?: boolean;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function go() {
      try {
        // ✅ comprobación básica: si "to" está vacío o mal, mostramos error
        if (!to || !to.startsWith("/")) {
          throw new Error(`Destino inválido: ${String(to)}`);
        }

        // ✅ marca OK y espera un poco para que puedas ver el estado
        if (!cancelled) setEstado("ok");

        await new Promise((r) => setTimeout(r, delayMs));

        if (!cancelled) router.replace(to);
      } catch (e: any) {
        console.error("RedirectClient error:", e);
        if (!cancelled) {
          setEstado("error");
          setMsg(e?.message || "Error desconocido en RedirectClient");
        }
      }
    }

    go();
    return () => {
      cancelled = true;
    };
  }, [to, delayMs, router]);

  if (!debug) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="text-sm font-extrabold text-slate-200">
        Estado redirección:{" "}
        {estado === "idle" ? "…" : estado === "ok" ? "OK" : "ERROR"}
      </div>

      <div className="mt-2 text-xs text-slate-400 font-bold break-words">
        Destino: {to}
      </div>

      {estado === "error" && (
        <div className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-red-200 font-extrabold text-sm">
          {msg}
          <div className="mt-2 text-xs text-red-300 font-bold">
            Abre la consola (F12 → Console) para ver más detalle.
          </div>
        </div>
      )}

      {estado === "ok" && (
        <div className="mt-3 text-xs text-emerald-300 font-extrabold">
          Redirigiendo en {Math.round(delayMs / 100) / 10}s…
        </div>
      )}
    </div>
  );
}
