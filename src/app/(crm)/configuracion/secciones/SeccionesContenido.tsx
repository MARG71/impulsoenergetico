"use client";

import { useEffect, useMemo, useState } from "react";

type Sub = { id: number; seccionId: number; nombre: string; slug: string; activa: boolean };
type Sec = { id: number; nombre: string; slug: string; activa: boolean; subSecciones: Sub[] };

export default function SeccionesContenido() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Sec[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [subNombre, setSubNombre] = useState<Record<number, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/crm/secciones");
    const json = await res.json();
    setData(Array.isArray(json) ? json : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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

  const activos = useMemo(() => data.filter((s) => s.activa).length, [data]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Secciones y subsecciones</h1>
        <p className="text-slate-600">
          Gestiona tu catálogo. Puedes activar/desactivar sin perder histórico. Activas: <b>{activos}</b>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="text-sm font-semibold text-slate-700">Nueva sección</label>
            <input
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="w-full mt-1 border rounded-xl px-3 py-2"
              placeholder="Ej: Ferretería"
            />
          </div>
          <button
            onClick={crearSeccion}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
          >
            Crear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-600">Cargando…</div>
      ) : (
        <div className="space-y-4">
          {data.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm border">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{s.nombre}</div>
                  <div className="text-xs text-slate-500">slug: {s.slug}</div>
                </div>
                <button
                  onClick={() => toggleSeccion(s.id, s.activa)}
                  className={`px-3 py-1.5 rounded-xl font-semibold ${
                    s.activa ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {s.activa ? "Activa" : "Inactiva"}
                </button>
              </div>

              <div className="px-4 pb-4">
                <div className="flex gap-2 mb-3">
                  <input
                    value={subNombre[s.id] || ""}
                    onChange={(e) => setSubNombre((p) => ({ ...p, [s.id]: e.target.value }))}
                    className="flex-1 border rounded-xl px-3 py-2"
                    placeholder="Nueva subsección (opcional): Baños, Cerrajería…"
                  />
                  <button
                    onClick={() => crearSub(s.id)}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
                  >
                    Añadir
                  </button>
                </div>

                {s.subSecciones?.length ? (
                  <div className="grid md:grid-cols-2 gap-2">
                    {s.subSecciones.map((sub) => (
                      <div key={sub.id} className="border rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-900">{sub.nombre}</div>
                          <div className="text-xs text-slate-500">slug: {sub.slug}</div>
                        </div>
                        <button
                          onClick={() => toggleSub(sub.id, sub.activa)}
                          className={`px-3 py-1.5 rounded-xl font-semibold ${
                            sub.activa ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {sub.activa ? "Activa" : "Inactiva"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Sin subsecciones todavía.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
