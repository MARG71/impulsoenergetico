"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

type Item = {
  id: number;
  creadoEn: string;
  tipo: "A4_QR" | "ESPECIAL";
  accion: "IMPRIMIR" | "DESCARGAR_PDF" | "DESCARGAR_PNG";
  fondoUrlSnap?: string | null;
  qrUrlSnap?: string | null;
  fondo?: { id: number; nombre: string; url: string } | null;
  creadoPor?: { id: number; nombre: string; email: string; rol: Rol } | null;
  lugar?: { id: number; nombre: string; direccion: string } | null;
};

export default function HistorialCartelesLugar() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";

  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;
  const tenantMode =
    isSuperadmin &&
    typeof adminIdContext === "number" &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<"" | "A4_QR" | "ESPECIAL">("");
  const [filtroAccion, setFiltroAccion] = useState<
    "" | "IMPRIMIR" | "DESCARGAR_PDF" | "DESCARGAR_PNG"
  >("");

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("lugarId", String(id));
    sp.set("limit", "200");
    if (filtroTipo) sp.set("tipo", filtroTipo);
    if (filtroAccion) sp.set("accion", filtroAccion);
    return `/api/carteles?${sp.toString()}`;
  }, [id, filtroTipo, filtroAccion]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(query, { cache: "no-store" });
        const d = await r.json();
        setItems(Array.isArray(d) ? d : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <Button
            onClick={() => router.back()}
            className="bg-gray-200 text-black hover:bg-gray-300"
          >
            ⬅ Volver
          </Button>

          <div className="flex gap-2 flex-wrap">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Todos los tipos</option>
              <option value="A4_QR">A4 con QR</option>
              <option value="ESPECIAL">Especial</option>
            </select>

            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value as any)}
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Todas las acciones</option>
              <option value="IMPRIMIR">Imprimir</option>
              <option value="DESCARGAR_PDF">Descargar PDF</option>
              <option value="DESCARGAR_PNG">Descargar PNG</option>
            </select>
          </div>
        </div>

        <div className="bg-white border rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-extrabold text-gray-900">
              Historial de carteles
            </h1>
            <div className="text-sm text-gray-600">
              {loading ? "Cargando..." : `${items.length} registros`}
            </div>
          </div>

          {items.length === 0 && !loading ? (
            <div className="text-gray-600 py-10 text-center">
              Aún no hay registros. Se crearán cuando imprimas o descargues un cartel.
            </div>
          ) : null}

          <div className="space-y-3">
            {items.map((it) => {
              const fecha = new Date(it.creadoEn).toLocaleString("es-ES");
              const fondo = it.fondo?.nombre ?? (it.fondoUrlSnap ? "Fondo (snapshot)" : "—");
              const actor = it.creadoPor?.nombre ?? it.creadoPor?.email ?? "—";

              return (
                <div
                  key={it.id}
                  className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-extrabold text-gray-900">
                      {it.tipo === "A4_QR" ? "A4 con QR" : "Cartel Especial"} —{" "}
                      <span className="text-gray-700">
                        {it.accion === "IMPRIMIR"
                          ? "Imprimir"
                          : it.accion === "DESCARGAR_PDF"
                          ? "Descargar PDF"
                          : "Descargar PNG"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-bold">Fecha:</span> {fecha}
                      {" · "}
                      <span className="font-bold">Fondo:</span> {fondo}
                      {" · "}
                      <span className="font-bold">Usuario:</span> {actor}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {it.fondoUrlSnap ? (
                      <a
                        href={it.fondoUrlSnap}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold px-3 py-2 rounded-lg border hover:bg-gray-50"
                      >
                        Ver fondo usado
                      </a>
                    ) : null}

                    {it.qrUrlSnap ? (
                      <a
                        href={it.qrUrlSnap}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold px-3 py-2 rounded-lg border hover:bg-gray-50"
                      >
                        Abrir link QR
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TIP: si quieres, luego añadimos un botón en la ficha del lugar que abra aquí */}
      </div>
    </div>
  );
}
