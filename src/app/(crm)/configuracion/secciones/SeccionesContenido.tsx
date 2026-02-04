//src/app/(crm)/configuracion/secciones/SeccionesContenido.tsx
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

function hashToIndex(str: string, mod: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

const SECTION_PALETTES = [
  { ring: "ring-emerald-400/40", border: "border-emerald-500/40", pill: "bg-emerald-500/20 text-emerald-100", stripe: "bg-emerald-500" },
  { ring: "ring-sky-400/40", border: "border-sky-500/40", pill: "bg-sky-500/20 text-sky-100", stripe: "bg-sky-500" },
  { ring: "ring-orange-400/40", border: "border-orange-500/40", pill: "bg-orange-500/20 text-orange-100", stripe: "bg-orange-500" },
  { ring: "ring-fuchsia-400/40", border: "border-fuchsia-500/40", pill: "bg-fuchsia-500/20 text-fuchsia-100", stripe: "bg-fuchsia-500" },
  { ring: "ring-indigo-400/40", border: "border-indigo-500/40", pill: "bg-indigo-500/20 text-indigo-100", stripe: "bg-indigo-500" },
  { ring: "ring-teal-400/40", border: "border-teal-500/40", pill: "bg-teal-500/20 text-teal-100", stripe: "bg-teal-500" },
];

function paletteForSection(sec: Sec) {
  const idx = hashToIndex(`${sec.slug}-${sec.id}-${sec.nombre}`, SECTION_PALETTES.length);
  return SECTION_PALETTES[idx];
}

function normalizeHex(v: string) {
  const s = (v || "").trim();
  if (!s) return "";
  const hex = s.startsWith("#") ? s : `#${s}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "";
}

function hexToRgba(hex: string, alpha: number) {
  const h = normalizeHex(hex);
  if (!h) return null;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/secciones", { cache: "no-store" });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
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

    await fetch("/api/crm/secciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, colorHex, imagenUrl }),
    });

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

    await fetch("/api/crm/subsecciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seccionId, nombre, colorHex, imagenUrl }),
    });

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
    <div className="min-h-screen px-6 md:px-8 py-8 text-slate-50 bg-gradient-to-b from-slate-950 via-indigo-950/70 to-emerald-950/40">
      <div className="w-full max-w-[1400px] mx-auto space-y-6">

        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-white/5 backdrop-blur p-6 md:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-[0_0_50px_rgba(0,0,0,0.25)]">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Secciones y subsecciones</h1>
            <p className="text-slate-200 font-bold mt-2">
              Configura el catálogo de <span className="text-white">comisiones</span>. Puedes activar/desactivar sin perder histórico.
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-sm font-extrabold">
              <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/40">
                Secciones: <span className="text-white">{stats.total}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/40">
                Activas: <span className="text-emerald-300">{stats.activos}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/40">
                Sub-secciones: <span className="text-white">{stats.totalSubs}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/40">
                Sub activas: <span className="text-emerald-300">{stats.subsActivas}</span>
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => router.push("/dashboard")}
              className="h-11 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold"
            >
              🧭 Dashboard
            </button>
            <button
              onClick={() => router.back()}
              className="h-11 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold"
            >
              ← Volver
            </button>
          </div>
        </header>

        {/* CREAR + BUSCADOR */}
        <section className="rounded-3xl border border-slate-800 bg-white/5 backdrop-blur p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Nueva sección */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="text-sm font-extrabold text-slate-200">Nueva sección</div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="md:col-span-6 h-12 rounded-2xl bg-slate-950/60 border border-slate-700 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-500"
                  placeholder="Ej: Seguros, Solar, Aerotermia..."
                />

                <div className="md:col-span-3 flex gap-2 items-center">
                  <input
                    type="color"
                    value={nuevoColor}
                    onChange={(e) => setNuevoColor(e.target.value)}
                    className="h-12 w-14 rounded-xl border border-slate-700 bg-slate-950/60"
                    title="Color de la sección"
                  />
                  <input
                    value={nuevoColor}
                    onChange={(e) => setNuevoColor(e.target.value)}
                    className="flex-1 h-12 rounded-2xl bg-slate-950/60 border border-slate-700 px-3 text-slate-100 font-extrabold outline-none"
                    placeholder="#22c55e"
                  />
                </div>

                <button
                  onClick={crearSeccion}
                  className="md:col-span-3 h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
                >
                  Crear
                </button>
              </div>

              <div className="mt-2">
                <input
                  value={nuevoImg}
                  onChange={(e) => setNuevoImg(e.target.value)}
                  className="w-full h-11 rounded-2xl bg-slate-950/60 border border-slate-700 px-4 text-slate-100 font-bold outline-none placeholder:text-slate-500"
                  placeholder="(Opcional) URL de logo/imagen (Cloudinary)"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400 font-bold">
                Tip: el slug se genera automático. El color y la imagen se guardan y se usan como fondo.
              </p>
            </div>

            {/* Buscador global */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="text-sm font-extrabold text-slate-200">Buscador global</div>
              <div className="mt-3">
                <input
                  value={qGlobal}
                  onChange={(e) => setQGlobal(e.target.value)}
                  className="w-full h-12 rounded-2xl bg-slate-950/60 border border-slate-700 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-500"
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
              const p = paletteForSection(s);

              const secBg = s.colorHex ? hexToRgba(s.colorHex, 0.18) : null;
              const secStripe = s.colorHex ? s.colorHex : null;

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
                  className={classNames(
                    "rounded-3xl border overflow-hidden",
                    "shadow-[0_0_40px_rgba(0,0,0,0.35)]",
                    s.colorHex ? "border-white/10" : p.border
                  )}
                  style={{
                    background: secBg ? `linear-gradient(135deg, ${secBg}, rgba(15,23,42,0.55))` : "rgba(2,6,23,0.55)",
                  }}
                >
                  {/* barra superior color */}
                  <div
                    className={classNames("h-1.5 w-full", secStripe ? "" : p.stripe)}
                    style={secStripe ? { backgroundColor: secStripe } : undefined}
                  />

                  {/* cabecera sección */}
                  <div className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        {s.imagenUrl ? (
                          <div className="h-11 w-11 rounded-2xl overflow-hidden border border-white/10 bg-black/20 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.imagenUrl} alt={s.nombre} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-11 w-11 rounded-2xl border border-white/10 bg-black/20 shrink-0" />
                        )}

                        <div className="text-2xl font-extrabold text-white break-words">
                          {s.nombre}
                        </div>

                        <span className={classNames("px-3 py-1 rounded-full text-xs font-extrabold border border-white/10", p.pill)}>
                          slug: {s.slug}
                        </span>

                        <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-white/10 bg-black/20 text-slate-100">
                          #{s.id}
                        </span>

                        <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-white/10 bg-black/20 text-slate-100">
                          Subs: {s.subSecciones?.length || 0}
                        </span>

                        {s.colorHex ? (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-white/10 bg-black/20 text-slate-100">
                            🎨 {s.colorHex}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="text-xs font-extrabold text-slate-200 uppercase tracking-wide">
                          Buscador de subsecciones
                        </div>
                      </div>

                      <div className="mt-2 flex gap-2">
                        <input
                          value={qPorSeccion[s.id] || ""}
                          onChange={(e) => setQPorSeccion((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          className="flex-1 h-11 rounded-2xl bg-black/20 border border-white/10 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-300/50"
                          placeholder="Buscar dentro de esta sección…"
                        />
                        <button
                          onClick={() => setQPorSeccion((prev) => ({ ...prev, [s.id]: "" }))}
                          className="h-11 px-4 rounded-2xl bg-slate-800/70 hover:bg-slate-700 text-slate-100 font-extrabold border border-white/10"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button
                        onClick={() => toggleSeccion(s.id, s.activa)}
                        className={classNames(
                          "h-11 px-5 rounded-2xl font-extrabold border",
                          s.activa
                            ? "bg-emerald-500 text-slate-950 border-emerald-400/40 hover:bg-emerald-400"
                            : "bg-slate-900/40 text-slate-100 border-white/10 hover:bg-slate-900/60"
                        )}
                      >
                        {s.activa ? "✅ Activa" : "⛔ Inactiva"}
                      </button>
                    </div>
                  </div>

                  {/* crear subsección */}
                  <div className="px-5 md:px-6 pb-6">
                    <div className={classNames("rounded-2xl border p-4", "border-white/10 bg-black/15")}>
                      <div className="text-sm font-extrabold text-slate-100">
                        Añadir subsección
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <input
                          value={subNombre[s.id] || ""}
                          onChange={(e) => setSubNombre((p0) => ({ ...p0, [s.id]: e.target.value }))}
                          className="md:col-span-5 h-11 rounded-2xl bg-black/20 border border-white/10 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-300/50"
                          placeholder="Ej: Iberdrola, Naturgy, Vodafone..."
                        />

                        <div className="md:col-span-3 flex gap-2 items-center">
                          <input
                            type="color"
                            value={subColor[s.id] || "#0ea5e9"}
                            onChange={(e) => setSubColor((p0) => ({ ...p0, [s.id]: e.target.value }))}
                            className="h-11 w-14 rounded-xl border border-white/10 bg-black/20"
                            title="Color de la subsección"
                          />
                          <input
                            value={subColor[s.id] || ""}
                            onChange={(e) => setSubColor((p0) => ({ ...p0, [s.id]: e.target.value }))}
                            className="flex-1 h-11 rounded-2xl bg-black/20 border border-white/10 px-3 text-slate-100 font-extrabold outline-none"
                            placeholder="#0ea5e9"
                          />
                        </div>

                        <button
                          onClick={() => crearSub(s.id)}
                          className="md:col-span-4 h-11 px-6 rounded-2xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold"
                        >
                          ➕ Añadir
                        </button>
                      </div>

                      <div className="mt-2">
                        <input
                          value={subImg[s.id] || ""}
                          onChange={(e) => setSubImg((p0) => ({ ...p0, [s.id]: e.target.value }))}
                          className="w-full h-11 rounded-2xl bg-black/20 border border-white/10 px-4 text-slate-100 font-bold outline-none placeholder:text-slate-300/50"
                          placeholder="(Opcional) URL de logo/imagen (Cloudinary)"
                        />
                      </div>
                    </div>

                    {/* listado subsecciones */}
                    {subs?.length ? (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {subs.map((sub) => {
                          const subBg = sub.colorHex ? hexToRgba(sub.colorHex, 0.18) : null;

                          return (
                            <div
                              key={sub.id}
                              className={classNames(
                                "rounded-2xl border p-4 flex items-start justify-between gap-3",
                                "ring-1",
                                "border-white/10",
                                sub.colorHex ? "" : "bg-slate-950/50",
                                sub.colorHex ? "" : p.ring
                              )}
                              style={{
                                background: subBg ? `linear-gradient(135deg, ${subBg}, rgba(2,6,23,0.45))` : undefined,
                              }}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {sub.imagenUrl ? (
                                    <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 bg-black/20 shrink-0">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={sub.imagenUrl} alt={sub.nombre} className="h-full w-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="h-9 w-9 rounded-xl border border-white/10 bg-black/20 shrink-0" />
                                  )}

                                  <div className="text-base font-extrabold text-white break-words">
                                    {sub.nombre}
                                  </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2 text-xs font-extrabold">
                                  <span className={classNames("px-2.5 py-1 rounded-full border border-white/10", p.pill)}>
                                    slug: {sub.slug}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-full border border-white/10 bg-black/20 text-slate-100">
                                    #{sub.id}
                                  </span>
                                  {sub.colorHex ? (
                                    <span className="px-2.5 py-1 rounded-full border border-white/10 bg-black/20 text-slate-100">
                                      🎨 {sub.colorHex}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <button
                                onClick={() => toggleSub(sub.id, sub.activa)}
                                className={classNames(
                                  "shrink-0 h-10 px-4 rounded-2xl font-extrabold border",
                                  sub.activa
                                    ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/20"
                                    : "bg-slate-900/40 text-slate-100 border-white/10 hover:bg-slate-900/60"
                                )}
                              >
                                {sub.activa ? "Activa" : "Inactiva"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-slate-200 font-bold">
                        Sin subsecciones todavía.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="rounded-3xl border border-slate-800 bg-white/5 backdrop-blur p-6 text-slate-200 font-extrabold">
                No hay resultados con ese filtro.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
