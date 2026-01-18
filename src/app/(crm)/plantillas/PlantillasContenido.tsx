"use client";

import { useEffect, useMemo, useState } from "react";

type Plantilla = {
  id: number;
  canal: string;
  etapa: string;
  variante: string; // A/B
  titulo: string;
  contenido: string;
  activa: boolean;
  actualizadaEn: string;
};

async function fetchJson(url: string, init?: RequestInit, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...init, cache: "no-store", signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
    return data;
  } finally {
    clearTimeout(t);
  }
}

const ETAPAS = ["primero", "seguimiento", "factura", "oferta", "cierre", "referidos"] as const;
const VARS = ["A", "B"] as const;

export default function PlantillasContenido() {
  const [items, setItems] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [etapa, setEtapa] = useState<(typeof ETAPAS)[number]>("primero");

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson("/api/crm/plantillas?canal=whatsapp");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || "Error cargando plantillas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const porEtapa = useMemo(() => items.filter((p) => p.etapa === etapa), [items, etapa]);

  const getVar = (v: "A" | "B") => porEtapa.find((p) => p.variante === v) || null;

  const ensureTemplate = async (v: "A" | "B") => {
    const existing = getVar(v);
    if (existing) return existing;

    // crear por defecto
    const created = await fetchJson("/api/crm/plantillas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canal: "whatsapp",
        etapa,
        variante: v,
        titulo: `${etapa.toUpperCase()} ${v}`,
        contenido: `Hola {{nombre}}, soy de Impulso Energético…`,
        activa: true,
      }),
    });

    await cargar();
    return created as Plantilla;
  };

  const guardar = async (p: Plantilla, patch: Partial<Plantilla>) => {
    setSavingId(p.id);
    try {
      await fetchJson(`/api/crm/plantillas/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await cargar();
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="p-6 text-slate-200">Cargando…</div>;

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-3xl bg-red-900/35 border border-red-500/40 text-red-100 p-5 max-w-2xl">
          <div className="text-xl font-extrabold">Error</div>
          <div className="mt-2">{error}</div>
          <button
            onClick={cargar}
            className="mt-4 inline-flex px-4 py-2 rounded-full bg-slate-950 border border-slate-700 text-slate-100 font-bold hover:border-emerald-400"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const Box = ({ v }: { v: "A" | "B" }) => {
    const tpl = getVar(v);

    if (!tpl) {
      return (
        <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-5">
          <div className="text-white font-extrabold text-lg">Variante {v}</div>
          <div className="text-slate-400 mt-2">No existe todavía.</div>
          <button
            onClick={() => ensureTemplate(v)}
            className="mt-4 inline-flex px-4 py-2 rounded-2xl bg-emerald-600/15 border border-emerald-400 text-emerald-100 font-extrabold hover:bg-emerald-600/25"
          >
            Crear variante {v}
          </button>
        </div>
      );
    }

    const busy = savingId === tpl.id;

    return (
      <div className="rounded-3xl bg-slate-950/80 border border-slate-700 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-white font-extrabold text-lg">Variante {v}</div>
            <div className="text-slate-500 text-xs">Actualizada: {new Date(tpl.actualizadaEn).toLocaleString("es-ES")}</div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-200">
            <input
              type="checkbox"
              checked={tpl.activa}
              onChange={(e) => guardar(tpl, { activa: e.target.checked })}
            />
            Activa
          </label>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-extrabold text-slate-400 mb-1">Título</label>
          <input
            defaultValue={tpl.titulo}
            onBlur={(e) => guardar(tpl, { titulo: e.target.value })}
            className="w-full px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 font-bold outline-none focus:border-emerald-400"
          />
        </div>

        <div className="mt-3">
          <label className="block text-xs font-extrabold text-slate-400 mb-1">Contenido (usa {{nombre}})</label>
          <textarea
            defaultValue={tpl.contenido}
            onBlur={(e) => guardar(tpl, { contenido: e.target.value })}
            rows={8}
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-emerald-400"
          />
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Tip: usa variables como <span className="font-bold text-slate-300">{{`{{nombre}}`}}</span>
        </div>

        {busy && <div className="mt-3 text-sm text-slate-300 font-bold">Guardando…</div>}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Plantillas WhatsApp</h1>
          <p className="text-slate-300 mt-1">Edita mensajes por etapa y usa A/B para mejorar cierres.</p>
        </div>

        <div className="flex gap-2">
          <select
            value={etapa}
            onChange={(e) => setEtapa(e.target.value as any)}
            className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 font-bold"
          >
            {ETAPAS.map((x) => (
              <option key={x} value={x}>
                {x.toUpperCase()}
              </option>
            ))}
          </select>

          <button
            onClick={cargar}
            className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 font-bold hover:border-emerald-400"
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Box v="A" />
        <Box v="B" />
      </div>
    </div>
  );
}
