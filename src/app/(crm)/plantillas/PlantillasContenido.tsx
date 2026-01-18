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

type AbStats = {
  etapa: string;
  rango: string;
  convDays: number;
  totals: { A: { envios: number; leads: number }; B: { envios: number; leads: number } };
  conversions: {
    A: { contactado: number; comparativa: number; contrato: number; cerrado: number };
    B: { contactado: number; comparativa: number; contrato: number; cerrado: number };
  };
  ratios: {
    A: { contactado: number; comparativa: number; contrato: number; cerrado: number };
    B: { contactado: number; comparativa: number; contrato: number; cerrado: number };
  };
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

function ensureVarTag(title: string, v: "A" | "B") {
  const t = String(title || "").trim();
  const has = /\((A|B)\)/i.test(t);
  if (has) return t;
  return `${t} (${v})`.trim();
}

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString("es-ES");
  } catch {
    return dt;
  }
}

export default function PlantillasContenido() {
  const [items, setItems] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [etapa, setEtapa] = useState<(typeof ETAPAS)[number]>("primero");

  // A/B
  const [abRango, setAbRango] = useState<"hoy" | "7d" | "30d">("7d");
  const [abStats, setAbStats] = useState<AbStats | null>(null);
  const [abError, setAbError] = useState<string | null>(null);
  const [abLoading, setAbLoading] = useState(false);

  const cargarAB = async () => {
    setAbLoading(true);
    setAbError(null);
    try {
      const data = await fetchJson(`/api/crm/plantillas/ab-stats?etapa=${etapa}&rango=${abRango}&convDays=7`);
      setAbStats(data as AbStats);
    } catch (e: any) {
      setAbStats(null);
      setAbError(e?.message || "Error cargando métricas A/B");
    } finally {
      setAbLoading(false);
    }
  };

  useEffect(() => {
    cargarAB().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, abRango]);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      // Si tu endpoint soporta etapa, mejor:
      // const data = await fetchJson(`/api/crm/plantillas?canal=whatsapp&etapa=${etapa}`);
      const data = await fetchJson("/api/crm/plantillas?canal=whatsapp");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || "Error cargando plantillas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar().catch(() => {});
  }, []);

  const porEtapa = useMemo(() => items.filter((p) => p.etapa === etapa), [items, etapa]);

  const getVar = (v: "A" | "B") => porEtapa.find((p) => String(p.variante).toUpperCase() === v) || null;

  const ensureTemplate = async (v: "A" | "B") => {
    const existing = getVar(v);
    if (existing) return existing;

    const created = await fetchJson("/api/crm/plantillas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canal: "whatsapp",
        etapa,
        variante: v,
        titulo: ensureVarTag(`${etapa.toUpperCase()} ${v}`, v),
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
      await cargarAB();
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

  const winner =
    abStats && (abStats.ratios.A.cerrado !== abStats.ratios.B.cerrado)
      ? abStats.ratios.A.cerrado > abStats.ratios.B.cerrado
        ? "A"
        : "B"
      : null;

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
            <div className="flex items-center gap-2">
              <div className="text-white font-extrabold text-lg">Variante {v}</div>
              {winner === v && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border bg-emerald-600/15 border-emerald-400 text-emerald-100">
                  Ganadora
                </span>
              )}
            </div>
            <div className="text-slate-500 text-xs">Actualizada: {fmt(tpl.actualizadaEn)}</div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-200">
            <input type="checkbox" checked={tpl.activa} onChange={(e) => guardar(tpl, { activa: e.target.checked })} />
            Activa
          </label>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-extrabold text-slate-400 mb-1">Título (incluye (A) o (B))</label>
          <input
            defaultValue={tpl.titulo}
            onBlur={(e) => {
              const next = ensureVarTag(e.target.value, v);
              if (next !== tpl.titulo) e.target.value = next;
              guardar(tpl, { titulo: next });
            }}
            className="w-full px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 font-bold outline-none focus:border-emerald-400"
          />
        </div>

        <div className="mt-3">
          <label className="block text-xs font-extrabold text-slate-400 mb-1">Contenido (usa {"{{nombre}}"})</label>
          <textarea
            defaultValue={tpl.contenido}
            onBlur={(e) => guardar(tpl, { contenido: e.target.value })}
            rows={8}
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 outline-none focus:border-emerald-400"
          />
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Tip: usa variables como <span className="font-bold text-slate-300">{`{{nombre}}`}</span>
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

      {/* Métricas A/B */}
      <div className="rounded-3xl bg-slate-950/85 border border-slate-700 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-white font-extrabold text-xl">Métricas A/B</div>
            <div className="text-slate-400 text-sm">
              Etapa: <span className="font-bold text-slate-200">{etapa.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={abRango}
              onChange={(e) => setAbRango(e.target.value as any)}
              className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 font-bold"
            >
              <option value="hoy">Hoy</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
            </select>

            <button
              onClick={cargarAB}
              className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-700 text-slate-100 font-bold hover:border-emerald-400"
            >
              {abLoading ? "Actualizando…" : "Actualizar"}
            </button>
          </div>
        </div>

        {abError && (
          <div className="mt-4 rounded-2xl bg-red-900/25 border border-red-500/30 text-red-100 p-4">
            {abError}
          </div>
        )}

        {!abStats ? (
          <div className="mt-4 text-slate-300">Sin datos todavía (necesitas actividades WhatsApp con (A)/(B)).</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(["A", "B"] as const).map((v) => (
              <div key={v} className="rounded-3xl bg-slate-950/70 border border-slate-800 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-white font-extrabold text-lg">Variante {v}</div>
                    {winner === v && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border bg-emerald-600/15 border-emerald-400 text-emerald-100">
                        Ganadora
                      </span>
                    )}
                  </div>
                  <div className="text-slate-300 text-sm font-bold">
                    Envíos: {abStats.totals[v].envios} · Leads: {abStats.totals[v].leads}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {(["contactado", "comparativa", "contrato", "cerrado"] as const).map((k) => (
                    <div key={k} className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
                      <div className="text-slate-400 font-bold">{k.toUpperCase()}</div>
                      <div className="text-white font-extrabold text-2xl">{abStats.ratios[v][k]}%</div>
                      <div className="text-slate-400">{abStats.conversions[v][k]} conv</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
