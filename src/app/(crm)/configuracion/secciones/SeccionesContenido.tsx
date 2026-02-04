//src/app/(crm)/configuracion/secciones/SeccionesContenido.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type Sec = {
  id: number;
  nombre: string;
  slug: string;
  activa: boolean;
  colorHex?: string | null;
  imagenUrl?: string | null;
};

type Sub = {
  id: number;
  seccionId: number;
  parentId: number | null;
  nombre: string;
  slug: string;
  activa: boolean;
  colorHex?: string | null;
  imagenUrl?: string | null;
  _count?: { hijos: number };
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

type PathItem = { id: number | null; nombre: string };

export default function SeccionesContenido() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [secciones, setSecciones] = useState<Sec[]>([]);

  // crear sección
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#22c55e");
  const [nuevoImg, setNuevoImg] = useState("");

  // buscadores
  const [qGlobal, setQGlobal] = useState("");

  // colapsable por sección
  const [open, setOpen] = useState<Record<number, boolean>>({});

  // navegación por nivel por sección (stack)
  const [pathBySec, setPathBySec] = useState<Record<number, PathItem[]>>({});
  // subsecciones cargadas por (seccionId + parentId actual)
  const [subsBySec, setSubsBySec] = useState<Record<number, Sub[]>>({});

  // crear hija en nivel actual
  const [subNombre, setSubNombre] = useState<Record<number, string>>({});
  const [subColor, setSubColor] = useState<Record<number, string>>({});
  const [subImg, setSubImg] = useState<Record<number, string>>({});

  // upload
  const [uploadingSec, setUploadingSec] = useState(false);
  const [uploadErrSec, setUploadErrSec] = useState<string | null>(null);
  const [uploadingSub, setUploadingSub] = useState<Record<number, boolean>>({});
  const [uploadErrSub, setUploadErrSub] = useState<Record<number, string | null>>({});

  // modal editar sección
  const [editSec, setEditSec] = useState<Sec | null>(null);
  const [editSecNombre, setEditSecNombre] = useState("");
  const [editSecColor, setEditSecColor] = useState("");
  const [editSecImg, setEditSecImg] = useState("");
  const [editSecUploading, setEditSecUploading] = useState(false);

  // modal editar subsección
  const [editSub, setEditSub] = useState<Sub | null>(null);
  const [editSubNombre, setEditSubNombre] = useState("");
  const [editSubColor, setEditSubColor] = useState("");
  const [editSubImg, setEditSubImg] = useState("");
  const [editSubUploading, setEditSubUploading] = useState(false);

  const subsReqSeq = useRef<Record<number, number>>({});

  
  async function loadSecciones() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/secciones", { cache: "no-store" });
      const json = await res.json();
      const arr: Sec[] = Array.isArray(json) ? json : [];
      setSecciones(arr);

      for (const s of arr) {
        loadSubsForWithParent(s.id, null);
      }


      // open por defecto
      setOpen((prev) => {
        const next = { ...prev };
        for (const s of arr) if (next[s.id] === undefined) next[s.id] = true;
        return next;
      });

      // inicializa path root y carga root subs
      for (const s of arr) {
        setPathBySec((prev) => {
          if (prev[s.id]?.length) return prev;
          return { ...prev, [s.id]: [{ id: null, nombre: "Root" }] };
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function currentParentId(secId: number) {
    const path = pathBySec[secId] || [{ id: null, nombre: "Root" }];
    return path[path.length - 1]?.id ?? null;
  }

  async function loadSubsFor(secId: number) {
    const parentId = currentParentId(secId);
    const qs = new URLSearchParams();
    qs.set("seccionId", String(secId));
    qs.set("parentId", parentId === null ? "null" : String(parentId));

    const res = await fetch(`/api/crm/subsecciones?${qs.toString()}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json?.ok) {
      // si falla, no vaciamos para no “desaparecer”
      return;
    }
    setSubsBySec((prev) => ({ ...prev, [secId]: json.items as Sub[] }));
  }

  useEffect(() => {
    loadSecciones();
  }, []);

  // cuando cambie path de una sección, recarga sus subs
  useEffect(() => {
    for (const s of secciones) loadSubsFor(s.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secciones.length]);


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
    await loadSecciones();
  }

  async function toggleSeccion(id: number, activa: boolean) {
    await fetch("/api/crm/secciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activa: !activa }),
    });
    await loadSecciones();
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
    await loadSecciones();
  }

  async function crearSub(secId: number) {
    const nombre = (subNombre[secId] || "").trim();
    if (!nombre) return;

    const parentId = currentParentId(secId);
    const colorHex = normalizeHex(subColor[secId] || "") || null;
    const imagenUrl = (subImg[secId] || "").trim() || null;

    const res = await fetch("/api/crm/subsecciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seccionId: secId,
        parentId,
        nombre,
        colorHex,
        imagenUrl,
      }),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok) {
      alert(j?.error || "No se pudo crear la subsección");
      return;
    }

    setSubNombre((p) => ({ ...p, [secId]: "" }));
    setSubColor((p) => ({ ...p, [secId]: "" }));
    setSubImg((p) => ({ ...p, [secId]: "" }));
    await loadSubsFor(secId);
  }

  async function toggleSub(secId: number, id: number, activa: boolean) {
    await fetch("/api/crm/subsecciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activa: !activa }),
    });
    await loadSubsFor(secId);
  }

  async function eliminarSub(secId: number, id: number) {
    const ok = confirm("¿Eliminar esta subsección? (borra también toda la rama de hijas).");
    if (!ok) return;

    const res = await fetch("/api/crm/subsecciones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) alert(json?.error || "No se pudo eliminar");
    await loadSubsFor(secId);
  }

  function goToHijas(secId: number, sub: Sub) {
    setPathBySec((prev) => {
      const current = prev[secId] || [{ id: null, nombre: "Root" }];
      const nextPath = [...current, { id: sub.id, nombre: sub.nombre }];

      // cargamos directamente ese nivel (sin depender del estado ya aplicado)
      loadSubsForWithParent(secId, sub.id);

      return { ...prev, [secId]: nextPath };
    });
  }


  async function loadSubsForWithParent(secId: number, parentId: number | null) {
    const seq = (subsReqSeq.current[secId] ?? 0) + 1;
    subsReqSeq.current[secId] = seq;

    const qs = new URLSearchParams();
    qs.set("seccionId", String(secId));
    qs.set("parentId", parentId === null ? "null" : String(parentId));

    const res = await fetch(`/api/crm/subsecciones?${qs.toString()}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));

    // si llega tarde (hay una request más nueva), ignoramos
    if (subsReqSeq.current[secId] !== seq) return;

    if (!res.ok || !json?.ok) return;

    setSubsBySec((prev) => ({ ...prev, [secId]: (json.items as Sub[]) ?? [] }));
  }



  function goBackLevel(secId: number) {
    setPathBySec((prev) => {
      const current = prev[secId] || [{ id: null, nombre: "Root" }];
      if (current.length <= 1) return prev;

      const next = current.slice(0, -1);
      const newParentId = next[next.length - 1]?.id ?? null;

      loadSubsForWithParent(secId, newParentId);

      return { ...prev, [secId]: next };
    });
  }


  function goToRoot(secId: number) {
    loadSubsForWithParent(secId, null);
    setPathBySec((prev) => ({ ...prev, [secId]: [{ id: null, nombre: "Root" }] }));
  }


  const filteredSecciones = useMemo(() => {
    const q = qGlobal.trim().toLowerCase();
    if (!q) return secciones;
    return secciones.filter((s) => {
      return (
        s.nombre?.toLowerCase().includes(q) ||
        s.slug?.toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    });
  }, [secciones, qGlobal]);

  // ===== MODALES =====
  function openEditSec(s: Sec) {
    setEditSec(s);
    setEditSecNombre(s.nombre || "");
    setEditSecColor(s.colorHex || "");
    setEditSecImg(s.imagenUrl || "");
  }

  async function saveEditSec() {
    if (!editSec) return;
    const nombre = editSecNombre.trim();
    if (!nombre) return alert("Nombre requerido");

    const colorHex = editSecColor ? normalizeHex(editSecColor) : "";
    if (editSecColor && !colorHex) return alert("Color inválido (#RRGGBB)");

    const res = await fetch("/api/crm/secciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editSec.id,
        nombre,
        colorHex: colorHex || null,
        imagenUrl: editSecImg.trim() || null,
      }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "No se pudo actualizar");
      return;
    }

    setEditSec(null);
    await loadSecciones();
  }

  function openEditSub(secId: number, sub: Sub) {
    setEditSub(sub);
    setEditSubNombre(sub.nombre || "");
    setEditSubColor(sub.colorHex || "");
    setEditSubImg(sub.imagenUrl || "");
  }

  async function saveEditSub(secId: number) {
    if (!editSub) return;
    const nombre = editSubNombre.trim();
    if (!nombre) return alert("Nombre requerido");

    const colorHex = editSubColor ? normalizeHex(editSubColor) : "";
    if (editSubColor && !colorHex) return alert("Color inválido (#RRGGBB)");

    const res = await fetch("/api/crm/subsecciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editSub.id,
        nombre,
        colorHex: colorHex || null,
        imagenUrl: editSubImg.trim() || null,
      }),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok) {
      alert(j?.error || "No se pudo actualizar");
      return;
    }

    setEditSub(null);
    await loadSubsFor(secId);
  }

  // ===== UI =====
  return (
    <div className="min-h-screen px-6 md:px-8 py-8 text-slate-50 bg-black">
      <div className="w-full max-w-[1400px] mx-auto space-y-6">

        <header className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-[0_0_50px_rgba(0,0,0,0.25)]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Secciones y subsecciones (árbol infinito)</h1>
            <p className="text-slate-200 font-bold mt-2">
              Root → Hijas → Subhijas… (sin mezclar niveles)
            </p>
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

        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-extrabold text-slate-200">Nueva sección</div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                <input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="md:col-span-6 h-12 rounded-2xl bg-black border border-white/10 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-500"
                  placeholder="Ej: Luz, Gas, Telefonía…"
                />

                <div className="md:col-span-3">
                  <div className="text-xs font-extrabold text-slate-300 mb-1">-Color</div>

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
                  placeholder="URL (se rellena sola al subir)"
                />
              </div>

              {uploadErrSec ? <div className="mt-2 text-sm font-bold text-red-300">{uploadErrSec}</div> : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-extrabold text-slate-200">Buscador (secciones)</div>
              <div className="mt-3">
                <input
                  value={qGlobal}
                  onChange={(e) => setQGlobal(e.target.value)}
                  className="w-full h-12 rounded-2xl bg-black border border-white/10 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-500"
                  placeholder="Busca por nombre, slug o ID"
                />
              </div>
              <div className="mt-2 text-xs text-slate-400 font-bold">
                El árbol se navega dentro de cada sección.
              </div>
            </div>

          </div>
        </section>

        {loading ? (
          <div className="text-slate-200 font-extrabold">Cargando…</div>
        ) : (
          <div className="space-y-4">
            {filteredSecciones.map((s) => {
              const secColor = normalizeHex(s.colorHex || "") || null;
              const subs = subsBySec[s.id] || [];
              const path = pathBySec[s.id] || [{ id: null, nombre: "Root" }];

              return (
                <div
                  key={s.id}
                  className="rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.35)]"
                  style={{ backgroundColor: secColor ? secColor : "rgba(255,255,255,0.06)" }}
                >
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

                        <div className="text-2xl font-extrabold text-white break-words">{s.nombre}</div>

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

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="text-xs font-extrabold text-white uppercase tracking-wide">Ruta:</div>
                        <div className="flex flex-wrap gap-2">
                          {path.map((p, idx) => (
                            <span
                              key={`${p.id}-${idx}`}
                              className="px-2.5 py-1 rounded-full border border-black/20 bg-black/20 text-white text-xs font-extrabold"
                            >
                              {p.nombre}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2 flex-wrap">
                        <button
                          onClick={() => goToRoot(s.id)}
                          className="h-10 px-4 rounded-2xl font-extrabold border border-black/20 bg-black/30 text-white hover:bg-black/40"
                        >
                          ⤒ Root
                        </button>
                        <button
                          onClick={() => goBackLevel(s.id)}
                          className="h-10 px-4 rounded-2xl font-extrabold border border-black/20 bg-black/30 text-white hover:bg-black/40"
                        >
                          ← Volver nivel
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button
                        onClick={() => setOpen((p) => ({ ...p, [s.id]: !(p[s.id] ?? true) }))}
                        className="h-11 px-5 rounded-2xl font-extrabold border border-black/20 bg-black/30 text-white hover:bg-black/40"
                      >
                        {(open[s.id] ?? true) ? "⬆️ Ocultar" : "⬇️ Mostrar"}
                      </button>

                      <button
                        onClick={() => openEditSec(s)}
                        className="h-11 px-5 rounded-2xl font-extrabold border border-black/20 bg-black/30 text-white hover:bg-black/40"
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
                      <div className="rounded-2xl border border-black/20 bg-black/20 p-4">
                        <div className="text-sm font-extrabold text-white">
                          Crear hija en este nivel
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                          <input
                            value={subNombre[s.id] || ""}
                            onChange={(e) => setSubNombre((p0) => ({ ...p0, [s.id]: e.target.value }))}
                            className="md:col-span-5 h-11 rounded-2xl bg-black/30 border border-black/20 px-4 text-white font-extrabold outline-none placeholder:text-white/60"
                            placeholder="Nombre de la hija…"
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

                      {subs.length ? (
                        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                          {subs.map((sub) => {
                            const subColor = normalizeHex(sub.colorHex || "") || null;
                            const hijos = sub._count?.hijos ?? 0;

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

                                  <div className="mt-3 flex gap-2 flex-wrap">
                                    <button
                                      onClick={() => goToHijas(s.id, sub)}
                                      className="h-10 px-4 rounded-2xl font-extrabold border border-black/20 bg-sky-500/25 text-white hover:bg-sky-500/35"
                                    >
                                      ➕ Hijas ({hijos})
                                    </button>

                                    <button
                                      onClick={() => openEditSub(s.id, sub)}
                                      className="h-10 px-4 rounded-2xl font-extrabold border border-black/20 bg-black/30 text-white hover:bg-black/40"
                                    >
                                      ✏️ Editar
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 shrink-0">
                                  <button
                                    onClick={() => toggleSub(s.id, sub.id, sub.activa)}
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
                                    onClick={() => eliminarSub(s.id, sub.id)}
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
                          No hay elementos en este nivel.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-5 md:px-6 pb-6 text-white font-bold">
                      Sección colapsada.
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSecciones.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 text-slate-200 font-extrabold">
                No hay resultados.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL EDIT SECCION */}
      {editSec ? (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-black p-6 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-extrabold text-white">Editar sección</div>
                <div className="text-xs font-bold text-white/70">#{editSec.id} · slug: {editSec.slug}</div>
              </div>
              <button
                onClick={() => setEditSec(null)}
                className="h-10 px-4 rounded-2xl border border-white/10 bg-white/10 text-white font-extrabold hover:bg-white/15"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-extrabold text-white/80 mb-1">Nombre</div>
                <input
                  value={editSecNombre}
                  onChange={(e) => setEditSecNombre(e.target.value)}
                  className="w-full h-11 rounded-2xl bg-black border border-white/10 px-4 text-white font-extrabold outline-none"
                />
              </div>

              <div>
                <div className="text-xs font-extrabold text-white/80 mb-1">Color</div>
                <div className="flex flex-wrap gap-2 max-h-[132px] overflow-auto pr-1">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditSecColor(c)}
                      className={classNames(
                        "h-10 w-10 rounded-2xl border",
                        editSecColor === c ? "border-white" : "border-white/10"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  value={editSecColor}
                  onChange={(e) => setEditSecColor(e.target.value)}
                  className="mt-2 w-full h-10 rounded-2xl bg-black border border-white/10 px-3 text-white font-extrabold outline-none"
                  placeholder="#RRGGBB"
                />
              </div>

              <div className="md:col-span-2">
                <div className="text-xs font-extrabold text-white/80 mb-1">Imagen/Logo URL</div>

                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <label className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-extrabold cursor-pointer">
                    {editSecUploading ? "Subiendo..." : "📤 Subir"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setEditSecUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append("file", f);
                          fd.append("folder", "impulso/secciones");
                          const res = await fetch("/api/crm/media/upload", { method: "POST", body: fd });
                          const json = await res.json();
                          if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo subir");
                          setEditSecImg(json.url);
                        } catch (err: any) {
                          alert(err?.message || "Error subiendo");
                        } finally {
                          setEditSecUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>

                  <input
                    value={editSecImg}
                    onChange={(e) => setEditSecImg(e.target.value)}
                    className="flex-1 h-11 rounded-2xl bg-black border border-white/10 px-4 text-white font-bold outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditSec(null)}
                className="h-11 px-5 rounded-2xl border border-white/10 bg-white/10 text-white font-extrabold hover:bg-white/15"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditSec}
                className="h-11 px-5 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL EDIT SUBSECCION */}
      {editSub ? (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-black p-6 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-extrabold text-white">Editar subsección</div>
                <div className="text-xs font-bold text-white/70">#{editSub.id} · slug: {editSub.slug}</div>
              </div>
              <button
                onClick={() => setEditSub(null)}
                className="h-10 px-4 rounded-2xl border border-white/10 bg-white/10 text-white font-extrabold hover:bg-white/15"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-extrabold text-white/80 mb-1">Nombre</div>
                <input
                  value={editSubNombre}
                  onChange={(e) => setEditSubNombre(e.target.value)}
                  className="w-full h-11 rounded-2xl bg-black border border-white/10 px-4 text-white font-extrabold outline-none"
                />
              </div>

              <div>
                <div className="text-xs font-extrabold text-white/80 mb-1">Color</div>
                <div className="flex flex-wrap gap-2 max-h-[132px] overflow-auto pr-1">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditSubColor(c)}
                      className={classNames(
                        "h-10 w-10 rounded-2xl border",
                        editSubColor === c ? "border-white" : "border-white/10"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  value={editSubColor}
                  onChange={(e) => setEditSubColor(e.target.value)}
                  className="mt-2 w-full h-10 rounded-2xl bg-black border border-white/10 px-3 text-white font-extrabold outline-none"
                  placeholder="#RRGGBB"
                />
              </div>

              <div className="md:col-span-2">
                <div className="text-xs font-extrabold text-white/80 mb-1">Imagen/Logo URL</div>

                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <label className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-extrabold cursor-pointer">
                    {editSubUploading ? "Subiendo..." : "📤 Subir"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setEditSubUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append("file", f);
                          fd.append("folder", "impulso/subsecciones");
                          const res = await fetch("/api/crm/media/upload", { method: "POST", body: fd });
                          const json = await res.json();
                          if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo subir");
                          setEditSubImg(json.url);
                        } catch (err: any) {
                          alert(err?.message || "Error subiendo");
                        } finally {
                          setEditSubUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>

                  <input
                    value={editSubImg}
                    onChange={(e) => setEditSubImg(e.target.value)}
                    className="flex-1 h-11 rounded-2xl bg-black border border-white/10 px-4 text-white font-bold outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditSub(null)}
                className="h-11 px-5 rounded-2xl border border-white/10 bg-white/10 text-white font-extrabold hover:bg-white/15"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  // buscamos seccionId desde el objeto editSub
                  await saveEditSub(editSub.seccionId);
                }}
                className="h-11 px-5 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400"
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
