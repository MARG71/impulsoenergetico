"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Sub = {
  id: number;
  seccionId: number;
  nombre: string;
  slug: string;
  activa: boolean;
  colorHex?: string | null;
  imagenUrl?: string | null;
};

type Sec = {
  id: number;
  nombre: string;
  slug: string;
  activa: boolean;
  colorHex?: string | null;
  imagenUrl?: string | null;
  subSecciones: Sub[];
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function normalizeHex(v: string) {
  const s = (v || "").trim();
  if (!s) return "";
  const hex = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "";
}

function isHex(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

// ✅ Paleta GRANDE (la tuya)
const COLOR_PRESETS = [
  // Verdes / Esmeraldas
  "#22c55e","#16a34a","#10b981","#059669","#34d399","#064e3b",
  // Azules / Cian / Sky
  "#0ea5e9","#0284c7","#38bdf8","#0369a1","#06b6d4","#0891b2","#164e63",
  // Naranjas / Ámbar / Amarillos
  "#f97316","#ea580c","#fb923c","#f59e0b","#d97706","#facc15","#ca8a04",
  // Rojos / Rosas
  "#ef4444","#dc2626","#f43f5e","#e11d48","#fb7185","#be123c",
  // Morados / Violetas / Fucsias
  "#a855f7","#9333ea","#7c3aed","#c026d3","#d946ef","#701a75",
  // Índigos
  "#6366f1","#4f46e5","#4338ca","#3730a3","#312e81",
  // Teal / Turquesas
  "#14b8a6","#0d9488","#2dd4bf","#115e59",
  // Neutros (por si quieres algo sobrio)
  "#64748b","#475569","#334155","#1f2937","#111827",
  // Extras “corporativos vivos”
  "#84cc16","#3b82f6","#8b5cf6","#ec4899","#f472b6","#22d3ee",
  "#a3e635","#60a5fa","#c084fc","#fda4af","#fde047","#5eead4",
];

export default function SeccionesContenido() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Sec[]>([]);

  // ✅ Crear sección
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#22c55e");
  const [nuevoImg, setNuevoImg] = useState("");

  // ✅ Crear subsección (por sección)
  const [subNombre, setSubNombre] = useState<Record<number, string>>({});
  const [subColor, setSubColor] = useState<Record<number, string>>({});
  const [subImg, setSubImg] = useState<Record<number, string>>({});

  // ✅ Buscadores
  const [qGlobal, setQGlobal] = useState("");
  const [qPorSeccion, setQPorSeccion] = useState<Record<number, string>>({});

  // ✅ Collapsible por sección
  const [open, setOpen] = useState<Record<number, boolean>>({});

  // ✅ Upload sección
  const [uploadingSec, setUploadingSec] = useState(false);
  const [uploadErrSec, setUploadErrSec] = useState<string | null>(null);

  // ✅ Upload subsección (por sección)
  const [uploadingSub, setUploadingSub] = useState<Record<number, boolean>>({});
  const [uploadErrSub, setUploadErrSub] = useState<Record<number, string | null>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/secciones", { cache: "no-store" });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
      // por defecto, todo abierto si no existe estado
      setOpen((prev) => {
        const next = { ...prev };
        for (const s of (Array.isArray(json) ? json : [])) {
          if (next[s.id] === undefined) next[s.id] = true;
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function crearSeccion() {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;

    const colorHex = normalizeHex(nuevoColor) || null;
    const imagenUrl = nuevoImg.trim() || null;

    const res = await fetch("/api/crm/secciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, colorHex, imagenUrl }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "No se pudo crear la sección");
      return;
    }

    setNuevoNombre("");
    setNuevoImg("");
    setNuevoColor("#22c55e");
    load();
  }

  async function toggleSeccion(id: number, activa: boolean) {
    await fetch("/api/crm/secciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activa: !activa }),
    });
    load();
  }

  async function crearSub(seccionId: number) {
    const nombre = (subNombre[seccionId] || "").trim();
    if (!nombre) return;

    const colorHex = normalizeHex(subColor[seccionId] || "") || null;
    const imagenUrl = (subImg[seccionId] || "").trim() || null;

    const res = await fetch("/api/crm/subsecciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seccionId, nombre, colorHex, imagenUrl }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "No se pudo crear la subsección");
      return;
    }

    setSubNombre((p) => ({ ...p, [seccionId]: "" }));
    setSubColor((p) => ({ ...p, [seccionId]: "" }));
    setSubImg((p) => ({ ...p, [seccionId]: "" }));
    load();
  }

  async function toggleSub(id: number, activa: boolean) {
    await fetch("/api/crm/subsecciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activa: !activa }),
    });
    load();
  }

  async function eliminarSeccion(id: number) {
    const ok = confirm("¿Eliminar esta sección? (irreversible). Si está en uso, puede fallar.");
    if (!ok) return;

    const res = await fetch("/api/crm/secciones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) alert(json?.error || "No se pudo eliminar");
    load();
  }

  async function eliminarSub(id: number) {
    const ok = confirm("¿Eliminar esta subsección? (irreversible). Si está en uso, puede fallar.");
    if (!ok) return;

    const res = await fetch("/api/crm/subsecciones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) alert(json?.error || "No se pudo eliminar");
    load();
  }

  const stats = useMemo(() => {
    const activos = data.filter((s) => s.activa).length;
    const total = data.length;
    const totalSubs = data.reduce((acc, s) => acc + (s.subSecciones?.length || 0), 0);
    const subsActivas = data.reduce(
      (acc, s) => acc + (s.subSecciones?.filter((x) => x.activa)?.length || 0),
      0
    );
    return { activos, total, totalSubs, subsActivas };
  }, [data]);

  const filtered = useMemo(() => {
    const q = qGlobal.trim().toLowerCase();
    if (!q) return data;

    return data
      .map((s) => {
        const hitSec =
          s.nombre?.toLowerCase().includes(q) ||
          s.slug?.toLowerCase().includes(q) ||
          String(s.id).includes(q);

        const subs = (s.subSecciones || []).filter((sub) => {
          return (
            sub.nombre?.toLowerCase().includes(q) ||
            sub.slug?.toLowerCase().includes(q) ||
            String(sub.id).includes(q)
          );
        });

        if (hitSec) return { ...s, subSecciones: s.subSecciones || [] };
        if (subs.length) return { ...s, subSecciones: subs };
        return null;
      })
      .filter(Boolean) as Sec[];
  }, [data, qGlobal]);

  return (
    // ✅ FONDO NEGRO (sin degradado)
    <div className="min-h-screen px-6 md:px-8 py-8 text-slate-50 bg-black">
      <div className="w-full max-w-[1400px] mx-auto space-y-6">

        {/* CABECERA */}
        <header className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-[0_0_50px_rgba(0,0,0,0.25)]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Secciones y subsecciones</h1>
            <p className="text-slate-200 font-bold mt-2">
              Configura el catálogo de <span className="text-white">comisiones</span>. Puedes activar/desactivar sin perder histórico.
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-sm font-extrabold">
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                Secciones: <span className="text-white">{stats.total}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                Activas: <span className="text-emerald-300">{stats.activos}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                Sub-secciones: <span className="text-white">{stats.totalSubs}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                Sub activas: <span className="text-emerald-300">{stats.subsActivas}</span>
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => router.push("/dashboard")}
              className="h-11 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-100 font-extrabold border border-white/10"
            >
              🧭 Dashboard
            </button>
            <button
              onClick={() => router.back()}
              className="h-11 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-100 font-extrabold border border-white/10"
            >
              ← Volver
            </button>
          </div>
        </header>

        {/* CREAR + BUSCADOR */}
        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Nueva sección */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-extrabold text-slate-200">Nueva sección</div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                <input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="md:col-span-6 h-12 rounded-2xl bg-black border border-white/10 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-500"
                  placeholder="Ej: Seguros, Solar, Aerotermia..."
                />

                <div className="md:col-span-3">
                  <div className="text-xs font-extrabold text-slate-300 mb-1">-Color Sección</div>

                  <div className="flex flex-wrap gap-2 max-h-[132px] overflow-auto pr-1">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNuevoColor(c)}
                        className={classNames(
                          "h-10 w-10 rounded-2xl border",
                          nuevoColor === c ? "border-white" : "border-white/10"
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>

                  <input
                    value={nuevoColor}
                    onChange={(e) => setNuevoColor(e.target.value)}
                    className="mt-2 w-full h-10 rounded-2xl bg-black border border-white/10 px-3 text-slate-100 font-extrabold outline-none"
                    placeholder="#22c55e"
                  />

                  {!isHex(nuevoColor) ? (
                    <div className="mt-1 text-xs font-bold text-orange-200">Formato: #RRGGBB</div>
                  ) : null}
                </div>

                <button
                  onClick={crearSeccion}
                  className="md:col-span-3 h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
                >
                  Crear
                </button>
              </div>

              <div className="mt-2 flex flex-col md:flex-row gap-2 md:items-center">
                <label className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-100 font-extrabold cursor-pointer">
                  {uploadingSec ? "Subiendo..." : "📤 Subir logo/imagen/PDF"}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploadErrSec(null);
                      setUploadingSec(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", f);
                        fd.append("folder", "impulso/secciones");

                        const res = await fetch("/api/crm/media/upload", { method: "POST", body: fd });
                        const json = await res.json();
                        if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo subir");

                        setNuevoImg(json.url);
                      } catch (err: any) {
                        setUploadErrSec(err?.message || "Error subiendo");
                      } finally {
                        setUploadingSec(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>

                <input
                  value={nuevoImg}
                  onChange={(e) => setNuevoImg(e.target.value)}
                  className="flex-1 h-11 rounded-2xl bg-black border border-white/10 px-4 text-slate-100 font-bold outline-none placeholder:text-slate-500"
                  placeholder="URL (si ya la tienes) — se rellena sola al subir"
                />
              </div>

              {uploadErrSec ? (
                <div className="mt-2 text-sm font-bold text-red-300">{uploadErrSec}</div>
              ) : null}

              <p className="mt-2 text-xs text-slate-400 font-bold">
                Tip: el slug se genera automático. El color y la imagen se guardan.
              </p>
            </div>

            {/* Buscador global */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-extrabold text-slate-200">Buscador global</div>
              <div className="mt-3">
                <input
                  value={qGlobal}
                  onChange={(e) => setQGlobal(e.target.value)}
                  className="w-full h-12 rounded-2xl bg-black border border-white/10 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-500"
                  placeholder="Busca por nombre, slug o ID (sección o subsección)"
                />
              </div>
              <div className="mt-2 text-xs text-slate-400 font-bold">
                Filtra todo el listado (incluye subsecciones).
              </div>
            </div>

          </div>
        </section>

        {/* LISTADO */}
        {loading ? (
          <div className="text-slate-200 font-extrabold">Cargando…</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((s) => {
              const secColor = normalizeHex(s.colorHex || "") || null;

              const qs = (qPorSeccion[s.id] || "").trim().toLowerCase();
              const subs = (s.subSecciones || []).filter((sub) => {
                if (!qs) return true;
                return (
                  sub.nombre?.toLowerCase().includes(qs) ||
                  sub.slug?.toLowerCase().includes(qs) ||
                  String(sub.id).includes(qs)
                );
              });

              return (
                <div
                  key={s.id}
                  className="rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.35)]"
                  // ✅ COLOR SÓLIDO (sin degradado)
                  style={{ backgroundColor: secColor ? secColor : "rgba(255,255,255,0.06)" }}
                >
                  {/* header sección */}
                  <div className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        {s.imagenUrl ? (
                          <div className="h-11 w-11 rounded-2xl overflow-hidden border border-black/20 bg-black/20 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.imagenUrl} alt={s.nombre} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-11 w-11 rounded-2xl border border-black/20 bg-black/20 shrink-0" />
                        )}

                        <div className="text-2xl font-extrabold text-white break-words">
                          {s.nombre}
                        </div>

                        <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-black/20 bg-black/20 text-white">
                          slug: {s.slug}
                        </span>

                        <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-black/20 bg-black/20 text-white">
                          #{s.id}
                        </span>

                        <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-black/20 bg-black/20 text-white">
                          Subs: {s.subSecciones?.length || 0}
                        </span>

                        {secColor ? (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-black/20 bg-black/20 text-white">
                            🎨 {secColor}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="text-xs font-extrabold text-white uppercase tracking-wide">
                          Buscador de subsecciones
                        </div>
                      </div>

                      <div className="mt-2 flex gap-2">
                        <input
                          value={qPorSeccion[s.id] || ""}
                          onChange={(e) => setQPorSeccion((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          className="flex-1 h-11 rounded-2xl bg-black/30 border border-black/20 px-4 text-white font-extrabold outline-none placeholder:text-white/60"
                          placeholder="Buscar dentro de esta sección…"
                        />
                        <button
                          onClick={() => setQPorSeccion((prev) => ({ ...prev, [s.id]: "" }))}
                          className="h-11 px-4 rounded-2xl bg-black/30 hover:bg-black/40 text-white font-extrabold border border-black/20"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    {/* Botones derecha */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button
                        onClick={() => setOpen((p) => ({ ...p, [s.id]: !(p[s.id] ?? true) }))}
                        className="h-11 px-5 rounded-2xl font-extrabold border border-black/20 bg-black/30 text-white hover:bg-black/40"
                      >
                        {(open[s.id] ?? true) ? "⬆️ Ocultar" : "⬇️ Mostrar"}
                      </button>

                      <button
                        onClick={() => toggleSeccion(s.id, s.activa)}
                        className={classNames(
                          "h-11 px-5 rounded-2xl font-extrabold border border-black/20",
                          s.activa
                            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                            : "bg-black/30 text-white hover:bg-black/40"
                        )}
                      >
                        {s.activa ? "✅ Activa" : "⛔ Inactiva"}
                      </button>

                      <button
                        onClick={() => eliminarSeccion(s.id)}
                        className="h-11 px-5 rounded-2xl font-extrabold border border-black/20 bg-red-500/25 text-white hover:bg-red-500/35"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>

                  {/* CONTENIDO COLAPSABLE */}
                  {(open[s.id] ?? true) ? (
                    <div className="px-5 md:px-6 pb-6">

                      {/* crear subsección */}
                      <div className="rounded-2xl border border-black/20 bg-black/20 p-4">
                        <div className="text-sm font-extrabold text-white">Añadir subsección</div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                          {/* Nombre */}
                          <input
                            value={subNombre[s.id] || ""}
                            onChange={(e) => setSubNombre((p0) => ({ ...p0, [s.id]: e.target.value }))}
                            className="md:col-span-5 h-11 rounded-2xl bg-black/30 border border-black/20 px-4 text-white font-extrabold outline-none placeholder:text-white/60"
                            placeholder="Ej: Iberdrola, Naturgy, Vodafone..."
                          />

                          {/* Paleta color */}
                          <div className="md:col-span-3">
                            <div className="text-xs font-extrabold text-white mb-1">-Color SubSección</div>

                            <div className="flex flex-wrap gap-2 max-h-[132px] overflow-auto pr-1">
                              {COLOR_PRESETS.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setSubColor((p0) => ({ ...p0, [s.id]: c }))}
                                  className={classNames(
                                    "h-10 w-10 rounded-2xl border",
                                    (subColor[s.id] || "#0ea5e9") === c ? "border-white" : "border-black/20"
                                  )}
                                  style={{ backgroundColor: c }}
                                  title={c}
                                />
                              ))}
                            </div>

                            <input
                              value={subColor[s.id] || "#0ea5e9"}
                              onChange={(e) => setSubColor((p0) => ({ ...p0, [s.id]: e.target.value }))}
                              className="mt-2 w-full h-10 rounded-2xl bg-black/30 border border-black/20 px-3 text-white font-extrabold outline-none"
                              placeholder="#0ea5e9"
                            />

                            {!isHex(subColor[s.id] || "#0ea5e9") ? (
                              <div className="mt-1 text-xs font-bold text-orange-200">Formato: #RRGGBB</div>
                            ) : null}
                          </div>

                          {/* Botón añadir */}
                          <button
                            onClick={() => crearSub(s.id)}
                            className="md:col-span-4 h-11 px-6 rounded-2xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold"
                          >
                            ➕ Añadir
                          </button>
                        </div>

                        {/* Upload + URL */}
                        <div className="mt-2 flex flex-col md:flex-row gap-2 md:items-center">
                          <label className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-black/30 hover:bg-black/40 border border-black/20 text-white font-extrabold cursor-pointer">
                            {uploadingSub[s.id] ? "Subiendo..." : "📤 Subir logo/imagen/PDF"}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,application/pdf"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;

                                setUploadErrSub((prev) => ({ ...prev, [s.id]: null }));
                                setUploadingSub((prev) => ({ ...prev, [s.id]: true }));

                                try {
                                  const fd = new FormData();
                                  fd.append("file", f);
                                  fd.append("folder", "impulso/subsecciones");

                                  const res = await fetch("/api/crm/media/upload", {
                                    method: "POST",
                                    body: fd,
                                  });

                                  const json = await res.json();
                                  if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo subir");

                                  setSubImg((prev) => ({ ...prev, [s.id]: json.url }));
                                } catch (err: any) {
                                  setUploadErrSub((prev) => ({
                                    ...prev,
                                    [s.id]: err?.message || "Error subiendo",
                                  }));
                                } finally {
                                  setUploadingSub((prev) => ({ ...prev, [s.id]: false }));
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>

                          <input
                            value={subImg[s.id] || ""}
                            onChange={(e) => setSubImg((p0) => ({ ...p0, [s.id]: e.target.value }))}
                            className="flex-1 h-11 rounded-2xl bg-black/30 border border-black/20 px-4 text-white font-bold outline-none placeholder:text-white/60"
                            placeholder="URL (se rellena sola al subir)"
                          />
                        </div>

                        {uploadErrSub[s.id] ? (
                          <div className="mt-2 text-sm font-bold text-red-200">{uploadErrSub[s.id]}</div>
                        ) : null}
                      </div>

                      {/* LISTADO SUBSECCIONES EN CARRUSEL HORIZONTAL */}
                      {subs?.length ? (
                        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                          {subs.map((sub) => {
                            const subColor = normalizeHex(sub.colorHex || "") || null;

                            return (
                              <div
                                key={sub.id}
                                className="min-w-[340px] max-w-[340px] rounded-2xl border border-black/20 p-4 flex items-start justify-between gap-3"
                                // ✅ color sólido (sin degradado)
                                style={{ backgroundColor: subColor ? subColor : "rgba(0,0,0,0.22)" }}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    {sub.imagenUrl ? (
                                      <div className="h-9 w-9 rounded-xl overflow-hidden border border-black/20 bg-black/20 shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={sub.imagenUrl} alt={sub.nombre} className="h-full w-full object-cover" />
                                      </div>
                                    ) : (
                                      <div className="h-9 w-9 rounded-xl border border-black/20 bg-black/20 shrink-0" />
                                    )}

                                    <div className="text-base font-extrabold text-white break-words">
                                      {sub.nombre}
                                    </div>
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-extrabold">
                                    <span className="px-2.5 py-1 rounded-full border border-black/20 bg-black/20 text-white">
                                      slug: {sub.slug}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full border border-black/20 bg-black/20 text-white">
                                      #{sub.id}
                                    </span>
                                    {subColor ? (
                                      <span className="px-2.5 py-1 rounded-full border border-black/20 bg-black/20 text-white">
                                        🎨 {subColor}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 shrink-0">
                                  <button
                                    onClick={() => toggleSub(sub.id, sub.activa)}
                                    className={classNames(
                                      "h-10 px-4 rounded-2xl font-extrabold border border-black/20",
                                      sub.activa
                                        ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                                        : "bg-black/30 text-white hover:bg-black/40"
                                    )}
                                  >
                                    {sub.activa ? "Activa" : "Inactiva"}
                                  </button>

                                  <button
                                    onClick={() => eliminarSub(sub.id)}
                                    className="h-10 px-4 rounded-2xl font-extrabold border border-black/20 bg-red-500/25 text-white hover:bg-red-500/35"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-4 text-sm text-white font-bold">
                          Sin subsecciones todavía.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-5 md:px-6 pb-6 text-white font-bold">
                      Sección colapsada. (Subs: {s.subSecciones?.length || 0})
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 text-slate-200 font-extrabold">
                No hay resultados con ese filtro.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
