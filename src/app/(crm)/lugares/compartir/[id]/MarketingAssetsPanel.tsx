"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Asset = {
  id: number;
  tipo: "IMAGE" | "VIDEO" | "PDF";
  url: string;
  nombre?: string | null;
  publicId?: string | null;
  resourceType?: string | null;
  mime?: string | null;
  size?: number | null;
  creadaEn: string;
};

function guessTipoFromMime(mime: string | null | undefined): Asset["tipo"] {
  if (!mime) return "IMAGE";
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime === "application/pdf") return "PDF";
  return "PDF";

}

export default function MarketingAssetsPanel({
  lugarId,
  adminId,
}: {
  lugarId: number;
  adminId?: number | null; // para modo tenant SUPERADMIN
}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  const [nombre, setNombre] = useState("");
  const [urlManual, setUrlManual] = useState("");

  const [file, setFile] = useState<File | null>(null);

  const adminQuery = useMemo(() => {
    return adminId && Number.isFinite(adminId) ? `&adminId=${adminId}` : "";
  }, [adminId]);


  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/marketing-assets?lugarId=${lugarId}${adminQuery}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setAssets(data.assets || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lugarId, adminQuery]);

  // 1) Subir a Cloudinary
  const uploadToCloudinary = async (f: File) => {
    const form = new FormData();
    form.append("file", f);
    form.append("folder", `impulso/marketing/lugar-${lugarId}`);
    // si algún día quieres forzar: form.append("resourceType", "raw");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "No se pudo subir a Cloudinary");

    return data as {
      url: string;
      publicId: string;
      resourceType: string;
      bytes: number;
      format?: string;
      width?: number;
      height?: number;
    };
  };

  // 2) Guardar en Prisma (MarketingAsset)
  const saveAssetToDb = async (payload: {
    url: string;
    nombre?: string | null;
    tipo: Asset["tipo"];
    publicId?: string | null;
    resourceType?: string | null;
    mime?: string | null;
    size?: number | null;
  }) => {
    const res = await fetch(`/api/marketing-assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lugarId,
        ...payload,
        adminId: adminId ?? null, // solo aplica si SUPERADMIN lo usa
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "No se pudo guardar en BD");
    return data;
  };

  const onUploadAndSave = async () => {
    if (!file) return alert("Selecciona un archivo primero");

    setLoading(true);
    try {
      // 1) upload
      const up = await uploadToCloudinary(file);

      // 2) infer tipo y guardar
      const tipo = guessTipoFromMime(file.type);

      await saveAssetToDb({
        tipo,
        url: up.url,
        nombre: nombre.trim() || file.name || null,
        publicId: up.publicId ?? null,
        resourceType: up.resourceType ?? null,
        mime: file.type ?? null,
        size: typeof up.bytes === "number" ? up.bytes : null,
      });

      setNombre("");
      setFile(null);
      await loadAssets();
      alert("✅ Subido y guardado en MarketingAsset");
    } catch (e: any) {
      alert(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const saveManualUrl = async () => {
    if (!urlManual.trim()) return alert("Pega una URL");
    setLoading(true);
    try {
      await saveAssetToDb({
        tipo: "IMAGE",
        url: urlManual.trim(),
        nombre: nombre.trim() || null,
      });

      setNombre("");
      setUrlManual("");
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
      const url = `/api/marketing-assets/${id}${adminId ? `?adminId=${adminId}` : ""}`;

      const res = await fetch(url, { method: "DELETE" });
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
          Activos de Marketing (Cloudinary + BD)
        </h3>
        <Button
          onClick={loadAssets}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold"
        >
          Refrescar
        </Button>
      </div>

      {/* SUBIR ARCHIVO */}
      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="text-sm font-extrabold text-slate-200">Subir archivo (recomendado)</div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3 items-end">
          <div>
            <label className="text-sm font-extrabold text-slate-200">Nombre (opcional)</label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Story ahorro enero"
              className="mt-2 bg-slate-950/50 border-slate-700 text-slate-100 h-12 font-bold"
            />
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-200">Archivo</label>
            <input
              type="file"
              className="mt-2 block w-full text-slate-200 font-bold"
              accept="image/*,video/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <Button
          onClick={onUploadAndSave}
          disabled={loading}
          className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-12 px-6"
        >
          {loading ? "Subiendo..." : "⬆️ Subir y guardar"}
        </Button>
      </div>

      {/* GUARDAR URL MANUAL */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="text-sm font-extrabold text-slate-200">
          (Opcional) Guardar URL manual
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-sm font-extrabold text-slate-200">URL (http/https)</label>
          <Input
            value={urlManual}
            onChange={(e) => setUrlManual(e.target.value)}
            placeholder="https://..."
            className="bg-slate-950/50 border-slate-700 text-slate-100 h-12 font-bold"
          />
          <Button
            onClick={saveManualUrl}
            disabled={loading}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold h-12 px-6"
          >
            {loading ? "Guardando..." : "➕ Guardar URL"}
          </Button>
        </div>
      </div>

      {/* LISTADO */}
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

                <div className="mt-2 text-[11px] text-slate-500 font-bold break-words">
                  {a.publicId ? <>publicId: {a.publicId}</> : null}
                </div>

                <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  {a.tipo === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt={a.nombre || ""} className="w-full h-44 object-cover" />
                  ) : a.tipo === "VIDEO" ? (
                    <video src={a.url} controls className="w-full h-44 object-cover" />
                  ) : (
                    <div className="p-4 text-slate-200 font-bold">
                      PDF guardado.{" "}
                      <a className="underline" href={a.url} target="_blank" rel="noreferrer">
                        Abrir PDF
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
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
        Ahora el flujo es: archivo → /api/upload (Cloudinary) → /api/marketing-assets (BD)
      </p>
    </div>
  );
}
