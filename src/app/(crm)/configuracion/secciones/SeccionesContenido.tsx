//src/app/(crm)/configuracion/secciones/SeccionesContenido.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Sub = {
  id: number;
  seccionId: number;
  parentId?: number | null;
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

const COLOR_PRESETS = [
  "#22c55e","#16a34a","#10b981","#059669","#34d399","#064e3b",
  "#0ea5e9","#0284c7","#38bdf8","#0369a1","#06b6d4","#0891b2","#164e63",
  "#f97316","#ea580c","#fb923c","#f59e0b","#d97706","#facc15","#ca8a04",
  "#ef4444","#dc2626","#f43f5e","#e11d48","#fb7185","#be123c",
  "#a855f7","#9333ea","#7c3aed","#c026d3","#d946ef","#701a75",
  "#6366f1","#4f46e5","#4338ca","#3730a3","#312e81",
  "#14b8a6","#0d9488","#2dd4bf","#115e59",
  "#64748b","#475569","#334155","#1f2937","#111827",
  "#84cc16","#3b82f6","#8b5cf6","#ec4899","#f472b6","#22d3ee",
  "#a3e635","#60a5fa","#c084fc","#fda4af","#fde047","#5eead4",
];

// --------- helpers API ----------
async function apiJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export default function SeccionesContenido() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [secciones, setSecciones] = useState<Sec[]>([]);

  // Crear sección
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#22c55e");
  const [nuevoImg, setNuevoImg] = useState("");

  // Upload sección
  const [uploadingSec, setUploadingSec] = useState(false);
  const [uploadErrSec, setUploadErrSec] = useState<string | null>(null);

  // Buscador global
  const [qGlobal, setQGlobal] = useState("");

  // ✅ navegación por sección (root -> hijos -> subhijos ...)
  // nav[secId] = stack de {id, nombre} (breadcrumb)
  const [nav, setNav] = useState<Record<number, Array<{ id: number; nombre: string }>>>({});

  // ✅ cache de hijos por (seccionId, parentId)
  const [subCache, setSubCache] = useState<Record<string, Sub[]>>({});
  const [subLoading, setSubLoading] = useState<Record<string, boolean>>({});

  // Crear “sub” (sirve para hijas también)
  const [subNombre, setSubNombre] = useState<Record<number, string>>({});
  const [subColor, setSubColor] = useState<Record<number, string>>({});
  const [subImg, setSubImg] = useState<Record<number, string>>({});

  // Upload sub (por sección)
  const [uploadingSub, setUploadingSub] = useState<Record<number, boolean>>({});
  const [uploadErrSub, setUploadErrSub] = useState<Record<number, string | null>>({});

  // Collapsible por sección
  const [open, setOpen] = useState<Record<number, boolean>>({});

  // ✅ Edit modals (simple)
  const [editSec, setEditSec] = useState<null | {
    id: number;
    nombre: string;
    colorHex: string;
    imagenUrl: string;
  }>(null);

  const [editSub, setEditSub] = useState<null | {
    id: number;
    seccionId: number;
    nombre: string;
    colorHex: string;
    imagenUrl: string;
  }>(null);

  function keyFor(seccionId: number, parentId: number | null) {
    return `${seccionId}:${parentId ?? 0}`;
  }

  async function loadSecciones() {
    setLoading(true);
    try {
      const { res, json } = await apiJson("/api/crm/secciones", { cache: "no-store" } as any);
      const arr = Array.isArray(json) ? json : (Array.isArray(json?.items) ? json.items : []);
      if (!res.ok) {
        alert(json?.error || "Error cargando secciones");
        setSecciones([]);
        return;
      }
      // dejamos solo los campos que usamos
      setSecciones(
        arr.map((s: any) => ({
          id: s.id,
          nombre: s.nombre,
          slug: s.slug,
          activa: !!s.activa,
          colorHex: s.colorHex ?? null,
          imagenUrl: s.imagenUrl ?? null,
        }))
      );

      setOpen((prev) => {
        const next = { ...prev };
        for (const s of arr) if (next[s.id] === undefined) next[s.id] = true;
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  // carga hijos de un parent dentro de una sección
  async function loadSubs(seccionId: number, parentId: number | null) {
    const k = keyFor(seccionId, parentId);
    if (subLoading[k]) return;

    setSubLoading((p) => ({ ...p, [k]: true }));
    try {
      const qs = new URLSearchParams();
      qs.set("seccionId", String(seccionId));
      if (parentId) qs.set("parentId", String(parentId));

      const { res, json } = await apiJson(`/api/crm/subsecciones?${qs.toString()}`, { cache: "no-store" } as any);
      if (!res.ok || !json?.ok) {
        alert(json?.error || "Error cargando subsecciones");
        setSubCache((p) => ({ ...p, [k]: [] }));
        return;
      }
      setSubCache((p) => ({ ...p, [k]: Array.isArray(json.items) ? json.items : [] }));
    } finally {
      setSubLoading((p) => ({ ...p, [k]: false }));
    }
  }

  useEffect(() => { loadSecciones(); }, []);

  // cuando abres sección por primera vez, trae root subs
  useEffect(() => {
    for (const s of secciones) {
      const k = keyFor(s.id, null);
      if (!subCache[k]) loadSubs(s.id, null);
      setNav((prev) => (prev[s.id] ? prev : { ...prev, [s.id]: [] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secciones.length]);

  async function crearSeccion() {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;

    const colorHex = normalizeHex(nuevoColor) || null;
    const imagenUrl = nuevoImg.trim() || null;

    const { res, json } = await apiJson("/api/crm/secciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, colorHex, imagenUrl }),
    });

    if (!res.ok) {
      alert(json?.error || "No se pudo crear la sección");
      return;
    }

    setNuevoNombre("");
    setNuevoImg("");
    setNuevoColor("#22c55e");
    await loadSecciones();
  }

  async function toggleSeccion(id: number, activa: boolean) {
    await apiJson("/api/crm/secciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activa: !activa }),
    });
    loadSecciones();
  }

  async function eliminarSeccion(id: number) {
    const ok = confirm("¿Eliminar esta sección? (irreversible). Si está en uso, puede fallar.");
    if (!ok) return;

    const { res, json } = await apiJson("/api/crm/secciones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) alert(json?.error || "No se pudo eliminar");
    loadSecciones();
  }

  async function guardarEdicionSeccion() {
    if (!editSec) return;

    const payload = {
      id: editSec.id,
      nombre: editSec.nombre.trim(),
      colorHex: normalizeHex(editSec.colorHex) || null,
      imagenUrl: editSec.imagenUrl.trim() || null,
    };

    const { res, json } = await apiJson("/api/crm/secciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert(json?.error || "No se pudo editar");
      return;
    }
    setEditSec(null);
    loadSecciones();
  }

  async function crearSub(seccionId: number) {
    const nombre = (subNombre[seccionId] || "").trim();
    if (!nombre) return;

    const stack = nav[seccionId] || [];
    const parentId = stack.length ? stack[stack.length - 1].id : null;

    const colorHex = normalizeHex(subColor[seccionId] || "") || null;
    const imagenUrl = (subImg[seccionId] || "").trim() || null;

    const { res, json } = await apiJson("/api/crm/subsecciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seccionId, parentId, nombre, colorHex, imagenUrl }),
    });

    if (!res.ok || !json?.ok) {
      alert(json?.error || "No se pudo crear");
      return;
    }

    setSubNombre((p) => ({ ...p, [seccionId]: "" }));
    setSubColor((p) => ({ ...p, [seccionId]: "" }));
    setSubImg((p) => ({ ...p, [seccionId]: "" }));

    // recarga hijos del parent actual
    await loadSubs(seccionId, parentId);
  }

  async function toggleSub(id: number, activa: boolean, seccionId: number, parentId: number | null) {
    await apiJson("/api/crm/subsecciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activa: !activa }),
    });
    loadSubs(seccionId, parentId);
  }

  async function eliminarSub(id: number, seccionId: number, parentId: number | null) {
    const ok = confirm("¿Eliminar esta subsección? (irreversible). Si tiene hijas, también se borrarán (cascade).");
    if (!ok) return;

    const { res, json } = await apiJson("/api/crm/subsecciones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok || !json?.ok) alert(json?.error || "No se pudo eliminar");
    loadSubs(seccionId, parentId);
  }

  async function guardarEdicionSub() {
    if (!editSub) return;

    const payload = {
      id: editSub.id,
      nombre: editSub.nombre.trim(),
      colorHex: normalizeHex(editSub.colorHex) || null,
      imagenUrl: editSub.imagenUrl.trim() || null,
    };

    const { res, json } = await apiJson("/api/crm/subsecciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok || !json?.ok) {
      alert(json?.error || "No se pudo editar");
      return;
    }

    // recarga la lista donde estás
    const seccionId = editSub.seccionId;
    const stack = nav[seccionId] || [];
    const parentId = stack.length ? stack[stack.length - 1].id : null;

    setEditSub(null);
    loadSubs(seccionId, parentId);
  }

  function entrarEnSub(seccionId: number, sub: Sub) {
    setNav((prev) => {
      const next = { ...prev };
      const stack = next[seccionId] ? [...next[seccionId]] : [];
      stack.push({ id: sub.id, nombre: sub.nombre });
      next[seccionId] = stack;
      return next;
    });
    // carga hijos del sub clicado
    loadSubs(seccionId, sub.id);
  }

  function volverEnSub(seccionId: number) {
    setNav((prev) => {
      const next = { ...prev };
      const stack = next[seccionId] ? [...next[seccionId]] : [];
      stack.pop();
      next[seccionId] = stack;
      return next;
    });

    // recarga el nivel anterior
    const stack = nav[seccionId] || [];
    const newStack = stack.slice(0, -1);
    const parentId = newStack.length ? newStack[newStack.length - 1].id : null;
    loadSubs(seccionId, parentId);
  }

  const stats = useMemo(() => {
    const activos = secciones.filter((s) => s.activa).length;
    const total = secciones.length;
    return { activos, total };
  }, [secciones]);

  const filtered = useMemo(() => {
    const q = qGlobal.trim().toLowerCase();
    if (!q) return secciones;
    return secciones.filter((s) =>
      s.nombre.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  }, [secciones, qGlobal]);

  return (
    <div className="min-h-screen px-6 md:px-8 py-8 text-slate-50 bg-black">
      <div className="w-full max-w-[1400px] mx-auto space-y-6">

        {/* CABECERA */}
        <header className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-[0_0_50px_rgba(0,0,0,0.25)]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Secciones y subsecciones</h1>
            <p className="text-slate-200 font-bold mt-2">
              Configura el catálogo de <span className="text-white">comisiones</span>. Puedes crear niveles infinitos dentro de una sección.
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-sm font-extrabold">
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                Secciones: <span className="text-white">{stats.total}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                Activas: <span className="text-emerald-300">{stats.activos}</span>
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
            </div>

            {/* Buscador global */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-extrabold text-slate-200">Buscador global</div>
              <div className="mt-3">
                <input
                  value={qGlobal}
                  onChange={(e) => setQGlobal(e.target.value)}
                  className="w-full h-12 rounded-2xl bg-black border border-white/10 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-500"
                  placeholder="Busca por nombre, slug o ID (sección)"
                />
              </div>
              <div className="mt-2 text-xs text-slate-400 font-bold">
                Filtra el listado de secciones.
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

              const stack = nav[s.id] || [];
              const parentId = stack.length ? stack[stack.length - 1].id : null;
              const k = keyFor(s.id, parentId);
              const subs = subCache[k] || [];
              const isSubLoading = !!subLoading[k];

              return (
                <div
                  key={s.id}
                  className="rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.35)]"
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

                        {secColor ? (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-black/20 bg-black/20 text-white">
                            🎨 {secColor}
                          </span>
                        ) : null}
                      </div>

                      {/* breadcrumbs */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-white/90">Ruta:</span>
                        <span className="px-2.5 py-1 rounded-full border border-black/20 bg-black/20 text-xs font-extrabold text-white">
                          Root
                        </span>
                        {stack.map((x) => (
                          <span
                            key={x.id}
                            className="px-2.5 py-1 rounded-full border border-black/20 bg-black/20 text-xs font-extrabold text-white"
                          >
                            {x.nombre}
                          </span>
                        ))}
                        {stack.length ? (
                          <button
                            onClick={() => volverEnSub(s.id)}
                            className="h-8 px-3 rounded-xl bg-black/30 hover:bg-black/40 border border-black/20 text-white font-extrabold text-xs"
                          >
                            ⬅ Volver nivel
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* botones */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button
                        onClick={() => setOpen((p) => ({ ...p, [s.id]: !(p[s.id] ?? true) }))}
                        className="h-11 px-5 rounded-2xl font-extrabold border border-black/20 bg-black/30 text-white hover:bg-black/40"
                      >
                        {(open[s.id] ?? true) ? "⬆️ Ocultar" : "⬇️ Mostrar"}
                      </button>

                      <button
                        onClick={() => setEditSec({
                          id: s.id,
                          nombre: s.nombre,
                          colorHex: s.colorHex || "",
                          imagenUrl: s.imagenUrl || "",
                        })}
                        className="h-11 px-5 rounded-2xl font-extrabold border border-black/20 bg-white/10 text-white hover:bg-white/15"
                      >
                        ✏️ Editar
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

                  {(open[s.id] ?? true) ? (
                    <div className="px-5 md:px-6 pb-6">

                      {/* crear sub (en el nivel actual) */}
                      <div className="rounded-2xl border border-black/20 bg-black/20 p-4">
                        <div className="text-sm font-extrabold text-white">
                          Crear {(stack.length ? "hija" : "subsección")} en este nivel
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                          <input
                            value={subNombre[s.id] || ""}
                            onChange={(e) => setSubNombre((p0) => ({ ...p0, [s.id]: e.target.value }))}
                            className="md:col-span-5 h-11 rounded-2xl bg-black/30 border border-black/20 px-4 text-white font-extrabold outline-none placeholder:text-white/60"
                            placeholder={stack.length ? "Nombre de la hija..." : "Ej: Iberdrola, Naturgy, Vodafone..."}
                          />

                          <div className="md:col-span-3">
                            <div className="text-xs font-extrabold text-white mb-1">-Color</div>

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

                          <button
                            onClick={() => crearSub(s.id)}
                            className="md:col-span-4 h-11 px-6 rounded-2xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold"
                          >
                            ➕ Crear
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

                                  const res = await fetch("/api/crm/media/upload", { method: "POST", body: fd });
                                  const json = await res.json();
                                  if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo subir");

                                  setSubImg((prev) => ({ ...prev, [s.id]: json.url }));
                                } catch (err: any) {
                                  setUploadErrSub((prev) => ({ ...prev, [s.id]: err?.message || "Error subiendo" }));
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

                      {/* listado en carrusel */}
                      <div className="mt-4">
                        {isSubLoading ? (
                          <div className="text-white font-extrabold">Cargando nivel…</div>
                        ) : subs.length ? (
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {subs.map((sub) => {
                              const subColor = normalizeHex(sub.colorHex || "") || null;

                              return (
                                <div
                                  key={sub.id}
                                  className="min-w-[360px] max-w-[360px] rounded-2xl border border-black/20 p-4 flex items-start justify-between gap-3"
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
                                      onClick={() => entrarEnSub(s.id, sub)}
                                      className="h-10 px-4 rounded-2xl font-extrabold border border-black/20 bg-sky-500 text-slate-950 hover:bg-sky-400"
                                      title="Entrar para ver/crear hijas"
                                    >
                                      ➕ Hijas
                                    </button>

                                    <button
                                      onClick={() => setEditSub({
                                        id: sub.id,
                                        seccionId: s.id,
                                        nombre: sub.nombre,
                                        colorHex: sub.colorHex || "",
                                        imagenUrl: sub.imagenUrl || "",
                                      })}
                                      className="h-10 px-4 rounded-2xl font-extrabold border border-black/20 bg-white/10 text-white hover:bg-white/15"
                                    >
                                      ✏️
                                    </button>

                                    <button
                                      onClick={() => toggleSub(sub.id, sub.activa, s.id, parentId)}
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
                                      onClick={() => eliminarSub(sub.id, s.id, parentId)}
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
                          <div className="text-white font-bold">
                            No hay elementos en este nivel.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 md:px-6 pb-6 text-white font-bold">
                      Sección colapsada.
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

      {/* MODAL EDIT SECCIÓN */}
      {editSec ? (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-[720px] rounded-3xl border border-white/10 bg-black p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xl font-extrabold text-white">Editar sección</div>
              <button
                onClick={() => setEditSec(null)}
                className="h-10 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-extrabold"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-extrabold text-white mb-1">Nombre</div>
                <input
                  value={editSec.nombre}
                  onChange={(e) => setEditSec((p) => p ? ({ ...p, nombre: e.target.value }) : p)}
                  className="w-full h-11 rounded-2xl bg-black border border-white/10 px-4 text-white font-extrabold outline-none"
                />
              </div>

              <div>
                <div className="text-xs font-extrabold text-white mb-1">Color</div>
                <div className="flex flex-wrap gap-2 max-h-[132px] overflow-auto pr-1">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditSec((p) => p ? ({ ...p, colorHex: c }) : p)}
                      className={classNames("h-10 w-10 rounded-2xl border", editSec.colorHex === c ? "border-white" : "border-white/10")}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <input
                  value={editSec.colorHex}
                  onChange={(e) => setEditSec((p) => p ? ({ ...p, colorHex: e.target.value }) : p)}
                  className="mt-2 w-full h-10 rounded-2xl bg-black border border-white/10 px-3 text-white font-extrabold outline-none"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xs font-extrabold text-white mb-1">Imagen/Logo URL</div>
              <input
                value={editSec.imagenUrl}
                onChange={(e) => setEditSec((p) => p ? ({ ...p, imagenUrl: e.target.value }) : p)}
                className="w-full h-11 rounded-2xl bg-black border border-white/10 px-4 text-white font-bold outline-none"
                placeholder="https://..."
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditSec(null)}
                className="h-11 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-extrabold"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicionSeccion}
                className="h-11 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL EDIT SUB */}
      {editSub ? (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-[720px] rounded-3xl border border-white/10 bg-black p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xl font-extrabold text-white">Editar subsección</div>
              <button
                onClick={() => setEditSub(null)}
                className="h-10 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-extrabold"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-extrabold text-white mb-1">Nombre</div>
                <input
                  value={editSub.nombre}
                  onChange={(e) => setEditSub((p) => p ? ({ ...p, nombre: e.target.value }) : p)}
                  className="w-full h-11 rounded-2xl bg-black border border-white/10 px-4 text-white font-extrabold outline-none"
                />
              </div>

              <div>
                <div className="text-xs font-extrabold text-white mb-1">Color</div>
                <div className="flex flex-wrap gap-2 max-h-[132px] overflow-auto pr-1">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditSub((p) => p ? ({ ...p, colorHex: c }) : p)}
                      className={classNames("h-10 w-10 rounded-2xl border", editSub.colorHex === c ? "border-white" : "border-white/10")}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <input
                  value={editSub.colorHex}
                  onChange={(e) => setEditSub((p) => p ? ({ ...p, colorHex: e.target.value }) : p)}
                  className="mt-2 w-full h-10 rounded-2xl bg-black border border-white/10 px-3 text-white font-extrabold outline-none"
                  placeholder="#RRGGBB"
                />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xs font-extrabold text-white mb-1">Imagen/Logo URL</div>
              <input
                value={editSub.imagenUrl}
                onChange={(e) => setEditSub((p) => p ? ({ ...p, imagenUrl: e.target.value }) : p)}
                className="w-full h-11 rounded-2xl bg-black border border-white/10 px-4 text-white font-bold outline-none"
                placeholder="https://..."
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditSub(null)}
                className="h-11 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-extrabold"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicionSub}
                className="h-11 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
