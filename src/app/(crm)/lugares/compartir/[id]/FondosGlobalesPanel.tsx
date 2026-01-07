"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

type Fondo = {
  id: number;
  nombre: string;
  url: string;
  creadoEn: string;
  activo: boolean;
};

export default function FondosGlobalesPanel() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const isSuperadmin = role === "SUPERADMIN";

  const [fondos, setFondos] = useState<Fondo[]>([]);
  const [loading, setLoading] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);

  const loadFondos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fondos?filtro=todos", { cache: "no-store" });
      const data = await res.json();
      setFondos(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFondos();
  }, []);

  const subir = async () => {
    if (!isSuperadmin) return alert("Solo SUPERADMIN puede subir fondos.");
    if (!archivo) return alert("Selecciona un archivo");
    setLoading(true);

    try {
      // 1) Upload a Cloudinary (backend)
      const fd = new FormData();
      fd.append("file", archivo);
      fd.append("folder", "impulso/fondos/historico");

      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await up.json();

      if (!up.ok || !upData?.url) {
        throw new Error(upData?.error || "Error en /api/upload");
      }

      // 2) Guardar en BD (Fondo)
      const apiRes = await fetch("/api/fondos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: archivo.name,
          url: upData.url,
          publicId: upData.publicId || null,
          resourceType: upData.resourceType || null,
          bytes: upData.bytes ?? null,
          width: upData.width ?? null,
          height: upData.height ?? null,
          format: upData.format ?? null,
          mime: archivo.type || null,
        }),
      });

      const apiData = await apiRes.json();
      if (!apiRes.ok) throw new Error(apiData?.error || "Error al guardar en BD");

      setArchivo(null);
      await loadFondos();
      alert("✅ Fondo subido y guardado");
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const activar = async (id: number) => {
    if (!isSuperadmin) return alert("Solo SUPERADMIN puede activar fondos.");
    setLoading(true);
    try {
      const res = await fetch("/api/fondos/seleccionar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo activar");
      await loadFondos();
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!isSuperadmin) return alert("Solo SUPERADMIN puede eliminar fondos.");
    if (!confirm("¿Eliminar este fondo? (Se borrará de Cloudinary y BD)")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/fondos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo eliminar");
      await loadFondos();
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg md:text-xl font-extrabold text-white">
            Fondos globales de carteles
          </h3>
          <p className="mt-1 text-xs text-slate-400 font-bold">
            ⚠️ Fondo activo global: aplica a todos los lugares de todos los admins.
            {!isSuperadmin ? " (Solo SUPERADMIN puede gestionar.)" : ""}
          </p>
        </div>

        <Button
          onClick={loadFondos}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold"
        >
          Refrescar
        </Button>
      </div>

      {/* SUBIR (SOLO SUPERADMIN) */}
      {isSuperadmin && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-sm font-extrabold text-slate-200 mb-2">
            Subir fondo (Cloudinary + BD)
          </div>

          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-extrabold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
          />

          <div className="mt-3 flex gap-2">
            <Button
              onClick={subir}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-11 px-6"
            >
              {loading ? "Subiendo..." : "➕ Subir"}
            </Button>

            <Input
              value={archivo?.name || ""}
              readOnly
              className="bg-slate-950/50 border-slate-700 text-slate-100 h-11 font-bold"
              placeholder="Ningún archivo seleccionado"
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        {loading && fondos.length === 0 ? (
          <div className="text-slate-300 font-bold">Cargando...</div>
        ) : fondos.length === 0 ? (
          <div className="text-slate-300 font-bold">Aún no hay fondos guardados.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {fondos.map((f) => (
              <div
                key={f.id}
                className={`rounded-2xl border p-4 ${
                  f.activo
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-950/50"
                }`}
              >
                <div className="text-sm font-extrabold text-white break-words">
                  {f.nombre || `Fondo #${f.id}`}
                </div>

                <div className="text-xs text-slate-400 font-bold mt-1">
                  #{f.id} · {new Date(f.creadoEn).toLocaleString()}
                </div>

                <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={f.nombre} className="w-full h-44 object-cover" />
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  <Button
                    onClick={() => window.open(f.url, "_blank")}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold h-10"
                  >
                    Abrir
                  </Button>

                  {isSuperadmin ? (
                    <>
                      <Button
                        onClick={() => activar(f.id)}
                        className={`font-extrabold h-10 ${
                          f.activo
                            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                            : "bg-sky-500 text-slate-950 hover:bg-sky-400"
                        }`}
                      >
                        {f.activo ? "✅ Activo" : "Usar"}
                      </Button>

                      <Button
                        onClick={() => eliminar(f.id)}
                        className="bg-red-500 hover:bg-red-400 text-slate-950 font-extrabold h-10"
                      >
                        Eliminar
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">
                      Solo SUPERADMIN puede activar/eliminar
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-5 text-xs text-slate-400 font-bold">
        Estos fondos son globales (se usan en carteles). Al eliminar, se borra de Cloudinary y BD.
      </p>
    </div>
  );
}
