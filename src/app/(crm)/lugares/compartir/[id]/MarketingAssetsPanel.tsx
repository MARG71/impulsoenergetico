"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Asset = {
  id: number;
  tipo: "IMAGE" | "VIDEO";
  url: string;
  nombre?: string | null;
  creadaEn: string;
};

export default function MarketingAssetsPanel({ lugarId }: { lugarId: number }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  const [tipo, setTipo] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketing-assets?lugarId=${lugarId}`, { cache: "no-store" });
      const data = await res.json();
      setAssets(data.assets || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lugarId]);

  const saveAsset = async () => {
    if (!url.trim()) return alert("Pega una URL");
    setLoading(true);
    try {
      const res = await fetch("/api/marketing-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lugarId,
          tipo,
          url: url.trim(),
          nombre: nombre.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar");

      setNombre("");
      setUrl("");
      await loadAssets();
      alert("✅ Guardado");
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (id: number) => {
    if (!confirm("¿Eliminar este asset?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/marketing-assets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo borrar");
      await loadAssets();
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg md:text-xl font-extrabold text-white">
          Activos de Marketing (Fase 2)
        </h3>
        <Button
          onClick={loadAssets}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold"
        >
          Refrescar
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3 items-end">
        <div>
          <label className="text-sm font-extrabold text-slate-200">Nombre (opcional)</label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Story ahorro enero"
            className="mt-2 bg-slate-950/50 border-slate-700 text-slate-100 h-12 font-bold"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setTipo("IMAGE")}
            className={`h-12 font-extrabold ${
              tipo === "IMAGE" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-white"
            }`}
          >
            Imagen
          </Button>
          <Button
            onClick={() => setTipo("VIDEO")}
            className={`h-12 font-extrabold ${
              tipo === "VIDEO" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-white"
            }`}
          >
            Vídeo
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <label className="text-sm font-extrabold text-slate-200">URL (http/https)</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="bg-slate-950/50 border-slate-700 text-slate-100 h-12 font-bold"
        />
        <Button
          onClick={saveAsset}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-12 px-6"
        >
          {loading ? "Guardando..." : "➕ Guardar"}
        </Button>
      </div>

      <div className="mt-6">
        {loading && assets.length === 0 ? (
          <div className="text-slate-300 font-bold">Cargando...</div>
        ) : assets.length === 0 ? (
          <div className="text-slate-300 font-bold">Aún no hay activos guardados.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assets.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-sm font-extrabold text-white break-words">
                  {a.nombre || `Asset #${a.id}`}
                </div>
                <div className="text-xs text-slate-400 font-bold mt-1">
                  {a.tipo} · {new Date(a.creadaEn).toLocaleString()}
                </div>

                <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  {a.tipo === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt={a.nombre || ""} className="w-full h-44 object-cover" />
                  ) : (
                    <video src={a.url} controls className="w-full h-44 object-cover" />
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => navigator.clipboard.writeText(a.url)}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold h-10"
                  >
                    Copiar URL
                  </Button>
                  <Button
                    onClick={() => window.open(a.url, "_blank")}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold h-10"
                  >
                    Abrir
                  </Button>
                  <Button
                    onClick={() => deleteAsset(a.id)}
                    className="bg-red-500 hover:bg-red-400 text-slate-950 font-extrabold h-10"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-5 text-xs text-slate-400 font-bold">
        Nota: sin Cloudinary/Storage, guardamos solo URLs públicas. Cuando quieras, metemos storage gratis.
      </p>
    </div>
  );
}
