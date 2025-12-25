"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type AdminRow = {
  id: number;
  nombre: string;
  email: string;
  rol: "ADMIN";
  adminId: number | null;
};

export default function AdminsContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admins", { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "No autorizado");
        }
        const data = await res.json();
        setAdmins(data.admins || []);
      } catch (e: any) {
        toast.error(e?.message || "Error cargando admins");
      } finally {
        setLoading(false);
      }
    };

    if (role === "SUPERADMIN") run();
    else setLoading(false);
  }, [role]);

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return admins;
    return admins.filter((a) =>
      `${a.nombre} ${a.email} ${a.id}`.toLowerCase().includes(qq)
    );
  }, [admins, q]);

  if (status === "loading")
    return <div className="text-white/80">Cargando sesión…</div>;

  if (role !== "SUPERADMIN") {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-white">
        <div className="text-xl font-extrabold">Acceso restringido</div>
        <div className="text-white/80 mt-2">
          Esta sección es solo para SUPERADMIN.
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 font-extrabold text-slate-950 transition"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-3xl font-extrabold text-white">Admins</div>
            <div className="text-white/75 font-semibold mt-1">
              Lista global de administradores (tenants).
            </div>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-[13px] font-extrabold text-white transition"
          >
            Volver
          </Link>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email o ID…"
            className="w-full md:max-w-md rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-white placeholder:text-white/50 font-semibold outline-none"
          />
          <div className="text-white/70 font-bold text-sm">
            Total: <span className="text-white">{filtrados.length}</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
        <div className="text-white font-extrabold text-lg mb-4">Listado</div>

        {loading ? (
          <div className="text-white/70">Cargando…</div>
        ) : filtrados.length === 0 ? (
          <div className="text-white/70">No hay admins.</div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((a) => (
              <div
                key={a.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-white font-extrabold truncate">
                    #{a.id} · {a.nombre}
                  </div>
                  <div className="text-white/75 font-semibold truncate">
                    {a.email}
                  </div>
                  <div className="text-white/60 text-sm font-bold mt-1">
                    TenantId: <span className="text-white">{a.id}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/dashboard?adminId=${a.id}`)}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-extrabold text-slate-950 transition"
                >
                  Ver / Entrar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
