"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Sub = { id: number; seccionId: number; nombre: string; slug: string; activa: boolean };
type Sec = { id: number; nombre: string; slug: string; activa: boolean; subSecciones: Sub[] };

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function hashToIndex(str: string, mod: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

// Paletas corporativas “vivas” (verde / naranja / azul + extras)
const SECTION_PALETTES = [
  { ring: "ring-emerald-400/40", border: "border-emerald-500/40", bg: "bg-emerald-500/10", pill: "bg-emerald-500/20 text-emerald-100", stripe: "bg-emerald-500" },
  { ring: "ring-sky-400/40", border: "border-sky-500/40", bg: "bg-sky-500/10", pill: "bg-sky-500/20 text-sky-100", stripe: "bg-sky-500" },
  { ring: "ring-orange-400/40", border: "border-orange-500/40", bg: "bg-orange-500/10", pill: "bg-orange-500/20 text-orange-100", stripe: "bg-orange-500" },
  { ring: "ring-fuchsia-400/40", border: "border-fuchsia-500/40", bg: "bg-fuchsia-500/10", pill: "bg-fuchsia-500/20 text-fuchsia-100", stripe: "bg-fuchsia-500" },
  { ring: "ring-indigo-400/40", border: "border-indigo-500/40", bg: "bg-indigo-500/10", pill: "bg-indigo-500/20 text-indigo-100", stripe: "bg-indigo-500" },
  { ring: "ring-teal-400/40", border: "border-teal-500/40", bg: "bg-teal-500/10", pill: "bg-teal-500/20 text-teal-100", stripe: "bg-teal-500" },
];

function paletteForSection(sec: Sec) {
  const idx = hashToIndex(`${sec.slug}-${sec.id}-${sec.nombre}`, SECTION_PALETTES.length);
  return SECTION_PALETTES[idx];
}

export default function SeccionesContenido() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Sec[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [subNombre, setSubNombre] = useState<Record<number, string>>({});

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

  useEffect(() => {
    load();
  }, []);

  async function crearSeccion() {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    await fetch("/api/crm/secciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    setNuevoNombre("");
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
    await fetch("/api/crm/subsecciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seccionId, nombre }),
    });
    setSubNombre((p) => ({ ...p, [seccionId]: "" }));
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

  // ✅ filtro global por cualquier campo (sección o subsección)
  const filtered = useMemo(() => {
    const q = qGlobal.trim().toLowerCase();
    if (!q) return data;

    return data
      .map((s) => {
        const hitSec =
          s.nombre?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50 px-6 md:px-8 py-8">
      <div className="w-full max-w-[1400px] mx-auto space-y-6">
        {/* CABECERA + BOTONES */}
        <header className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Secciones y subsecciones</h1>
            <p className="text-slate-300 font-bold mt-2">
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

        {/* CREAR + BUSCADOR GLOBAL */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
              <div className="text-sm font-extrabold text-slate-200">Nueva sección</div>
              <div className="mt-3 flex gap-2">
                <input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="flex-1 h-12 rounded-2xl bg-slate-950/60 border border-slate-700 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-500"
                  placeholder="Ej: Seguros, Solar, Aerotermia..."
                />
                <button
                  onClick={crearSeccion}
                  className="h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
                >
                  Crear
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400 font-bold">
                Tip: usa nombres cortos y claros. El slug se genera automáticamente.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
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
          <div className="text-slate-300 font-extrabold">Cargando…</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((s) => {
              const p = paletteForSection(s);

              // buscador por sección
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
                    "rounded-3xl border bg-slate-950/60 overflow-hidden",
                    "shadow-[0_0_40px_rgba(0,0,0,0.35)]",
                    p.border
                  )}
                >
                  {/* barra de color */}
                  <div className={classNames("h-1.5 w-full", p.stripe)} />

                  {/* cabecera sección */}
                  <div className="p-5 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-2xl font-extrabold text-white break-words">
                          {s.nombre}
                        </div>
                        <span
                          className={classNames(
                            "px-3 py-1 rounded-full text-xs font-extrabold border border-slate-700",
                            p.pill
                          )}
                        >
                          slug: {s.slug}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-slate-700 bg-slate-900/40 text-slate-200">
                          #{s.id}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-slate-700 bg-slate-900/40 text-slate-200">
                          Subs: {s.subSecciones?.length || 0}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">
                          Buscador de subsecciones
                        </div>
                      </div>

                      <div className="mt-2 flex gap-2">
                        <input
                          value={qPorSeccion[s.id] || ""}
                          onChange={(e) =>
                            setQPorSeccion((prev) => ({ ...prev, [s.id]: e.target.value }))
                          }
                          className="flex-1 h-11 rounded-2xl bg-slate-950/60 border border-slate-700 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-500"
                          placeholder="Buscar dentro de esta sección…"
                        />
                        <button
                          onClick={() => setQPorSeccion((prev) => ({ ...prev, [s.id]: "" }))}
                          className="h-11 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold"
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
                            : "bg-slate-900/40 text-slate-100 border-slate-700 hover:bg-slate-900/60"
                        )}
                      >
                        {s.activa ? "✅ Activa" : "⛔ Inactiva"}
                      </button>
                    </div>
                  </div>

                  {/* crear subsección */}
                  <div className="px-5 md:px-6 pb-6">
                    <div className={classNames("rounded-2xl border bg-slate-900/25 p-4", p.border)}>
                      <div className="text-sm font-extrabold text-slate-200">
                        Añadir subsección
                      </div>
                      <div className="mt-3 flex flex-col md:flex-row gap-2 md:items-center">
                        <input
                          value={subNombre[s.id] || ""}
                          onChange={(e) =>
                            setSubNombre((p0) => ({ ...p0, [s.id]: e.target.value }))
                          }
                          className="flex-1 h-11 rounded-2xl bg-slate-950/60 border border-slate-700 px-4 text-slate-100 font-extrabold outline-none placeholder:text-slate-500"
                          placeholder="Ej: Iberdrola, Naturgy, Vodafone..."
                        />
                        <button
                          onClick={() => crearSub(s.id)}
                          className="h-11 px-6 rounded-2xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold"
                        >
                          ➕ Añadir
                        </button>
                      </div>
                    </div>

                    {/* listado subsecciones */}
                    {subs?.length ? (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {subs.map((sub) => (
                          <div
                            key={sub.id}
                            className={classNames(
                              "rounded-2xl border border-slate-800 bg-slate-950/50 p-4 flex items-start justify-between gap-3",
                              "ring-1",
                              p.ring
                            )}
                          >
                            <div className="min-w-0">
                              <div className="text-base font-extrabold text-white break-words">
                                {sub.nombre}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs font-extrabold">
                                <span className={classNames("px-2.5 py-1 rounded-full border border-slate-700", p.pill)}>
                                  slug: {sub.slug}
                                </span>
                                <span className="px-2.5 py-1 rounded-full border border-slate-700 bg-slate-900/40 text-slate-200">
                                  #{sub.id}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleSub(sub.id, sub.activa)}
                              className={classNames(
                                "shrink-0 h-10 px-4 rounded-2xl font-extrabold border",
                                sub.activa
                                  ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/20"
                                  : "bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-900/60"
                              )}
                            >
                              {sub.activa ? "Activa" : "Inactiva"}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-slate-400 font-bold">
                        Sin subsecciones todavía.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 text-slate-300 font-extrabold">
                No hay resultados con ese filtro.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
