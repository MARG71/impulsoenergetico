"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

type Sub = { id: number; seccionId: number; nombre: string; slug: string; activa: boolean };
type Sec = { id: number; nombre: string; slug: string; activa: boolean; subSecciones: Sub[] };

type Regla = {
  id: number;
  seccionId: number;
  subSeccionId: number | null;
  nivel: "C1" | "C2" | "C3" | "ESPECIAL";
  tipo: "FIJA" | "PORC_BASE" | "PORC_MARGEN" | "MIXTA";
  fijoEUR: string | null;
  porcentaje: string | null;
  minEUR: string | null;
  maxEUR: string | null;
  minAgenteEUR: string | null;
  maxAgenteEUR: string | null;
  minLugarEspecialEUR: string | null;
  maxLugarEspecialEUR: string | null;
  activa: boolean;
};

const NIVELES: Regla["nivel"][] = ["C1", "C2", "C3", "ESPECIAL"];
const TIPOS: Regla["tipo"][] = ["FIJA", "PORC_BASE", "PORC_MARGEN", "MIXTA"];

function moneyInput(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function parseNullableNumber(input: string) {
  const s = String(input ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return n;
}

export default function ComisionesGlobalesContenido() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const [loading, setLoading] = useState(true);
  const [secciones, setSecciones] = useState<Sec[]>([]);
  const [seccionId, setSeccionId] = useState<number | null>(null);
  const [subSeccionId, setSubSeccionId] = useState<number | "null">("null");

  const [reglas, setReglas] = useState<Record<string, Regla | null>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const subsActivas = useMemo(() => {
    const sec = secciones.find((s) => s.id === seccionId);
    return sec?.subSecciones?.filter((x) => x.activa) ?? [];
  }, [secciones, seccionId]);

  function key(nivel: Regla["nivel"]) {
    return `${seccionId ?? "x"}:${subSeccionId}:${nivel}`;
  }

  async function loadSecciones() {
    const res = await fetch("/api/crm/secciones");
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error(json?.error || "Error cargando secciones");
    setSecciones(json);
    if (!seccionId && json.length) setSeccionId(json[0].id);
  }

  async function loadReglas() {
    if (!seccionId) return;
    setLoading(true);
    const qs = new URLSearchParams();
    qs.set("seccionId", String(seccionId));
    qs.set("subSeccionId", subSeccionId === "null" ? "null" : String(subSeccionId));

    const res = await fetch(`/api/crm/comisiones-globales?${qs.toString()}`);
    const json = await res.json();
    const map: Record<string, Regla | null> = {};

    // inicializa a null para que salgan filas aunque no existan
    for (const n of NIVELES) map[key(n)] = null;

    if (Array.isArray(json)) {
      for (const r of json as Regla[]) {
        const k = `${r.seccionId}:${r.subSeccionId === null ? "null" : r.subSeccionId}:${r.nivel}`;
        map[k] = r;
      }
    }

    setReglas(map);
    setLoading(false);
  }

  useEffect(() => {
    if (status !== "loading" && session) {
      loadSecciones().catch((e) => toast.error(String(e?.message || e)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    loadReglas().catch((e) => toast.error(String(e?.message || e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccionId, subSeccionId]);

  async function seedFaltantes() {
    if (!seccionId) return;
    const res = await fetch("/api/crm/comisiones-globales/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seccionId,
        subSeccionId: subSeccionId === "null" ? null : subSeccionId,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json?.error || "No se pudieron crear reglas");
      return;
    }
    toast.success(`Reglas creadas/aseguradas. Insertadas: ${json.inserted}`);
    loadReglas();
  }

  function updateLocal(nivel: Regla["nivel"], patch: Partial<Regla>) {
    const k = key(nivel);
    setReglas((prev) => {
      const existing = prev[k];
      const base: Regla =
        existing ??
        ({
          id: -1, // -1 = no existe aún en BD
          seccionId: seccionId!,
          subSeccionId: subSeccionId === "null" ? null : (subSeccionId as number),
          nivel,
          tipo: "PORC_BASE",
          fijoEUR: null,
          porcentaje: null,
          minEUR: null,
          maxEUR: null,
          minAgenteEUR: null,
          maxAgenteEUR: null,
          minLugarEspecialEUR: null,
          maxLugarEspecialEUR: null,
          activa: true,
        } as Regla);

      return { ...prev, [k]: { ...base, ...patch } };
    });
  }

  async function saveRow(nivel: Regla["nivel"]) {
    const k = key(nivel);
    const row = reglas[k];
    if (!row || !seccionId) return;

    setSaving((p) => ({ ...p, [k]: true }));

    // si no existe en BD, obligamos a seed primero
    if (row.id === -1) {
      toast.message("Creando regla…");
      await seedFaltantes();
      await loadReglas();
      setSaving((p) => ({ ...p, [k]: false }));
      return;
    }

    const payload = {
      id: row.id,
      tipo: row.tipo,
      activa: row.activa,
      fijoEUR: parseNullableNumber(row.fijoEUR ?? ""),
      porcentaje: parseNullableNumber(row.porcentaje ?? ""),
      minEUR: parseNullableNumber(row.minEUR ?? ""),
      maxEUR: parseNullableNumber(row.maxEUR ?? ""),
      minAgenteEUR: parseNullableNumber(row.minAgenteEUR ?? ""),
      maxAgenteEUR: parseNullableNumber(row.maxAgenteEUR ?? ""),
      minLugarEspecialEUR: parseNullableNumber(row.minLugarEspecialEUR ?? ""),
      maxLugarEspecialEUR: parseNullableNumber(row.maxLugarEspecialEUR ?? ""),
    };

    const res = await fetch("/api/crm/comisiones-globales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setSaving((p) => ({ ...p, [k]: false }));

    if (!res.ok) {
      toast.error(json?.error || "No se pudo guardar");
      return;
    }

    toast.success(`Guardado ${nivel}`);
    loadReglas();
  }

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;
  if (!session) return <div className="p-6 text-white/80">No autenticado.</div>;

  if (role !== "SUPERADMIN") {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white font-extrabold">Acceso no permitido</div>
          <p className="text-white/70 text-sm mt-2">Solo SUPERADMIN puede gestionar comisiones globales.</p>
          <Link href="/comisiones" className="inline-block mt-4 text-emerald-300 font-extrabold">
            ← Volver a Comisiones
          </Link>
        </div>
      </div>
    );
  }

  const seccionActual = secciones.find((s) => s.id === seccionId);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Comisiones globales</h1>
        <p className="text-white/70">
          Define C1/C2/C3/ESPECIAL por sección/subsección. Tipos: fija, % base, % margen, mixta. Con min/max y límites.
        </p>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-5">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-[12px] font-extrabold text-white/70 uppercase tracking-wider">Sección</label>
            <select
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
              value={seccionId ?? ""}
              onChange={(e) => {
                setSeccionId(Number(e.target.value));
                setSubSeccionId("null");
              }}
            >
              {secciones
                .filter((s) => s.activa)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-extrabold text-white/70 uppercase tracking-wider">Subsección</label>
            <select
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
              value={subSeccionId}
              onChange={(e) => setSubSeccionId(e.target.value === "null" ? "null" : Number(e.target.value))}
            >
              <option value="null">— Sin subsección (general)</option>
              {subsActivas.map((ss) => (
                <option key={ss.id} value={ss.id}>
                  {ss.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={seedFaltantes}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-extrabold text-slate-950 transition"
            >
              Crear reglas faltantes
            </button>
          </div>
        </div>

        <div className="mt-3 text-sm text-white/70">
          Sección actual: <span className="font-extrabold text-white">{seccionActual?.nombre ?? "—"}</span>
          {subSeccionId !== "null" ? (
            <span className="ml-2 text-white/60">
              · subsección:{" "}
              <span className="font-extrabold text-white">
                {subsActivas.find((x) => x.id === subSeccionId)?.nombre ?? "—"}
              </span>
            </span>
          ) : (
            <span className="ml-2 text-white/60">· general</span>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="text-white font-extrabold">Niveles</div>
          <div className="text-white/60 text-sm">Edita y guarda por nivel. Si falta una regla, usa “Crear reglas faltantes”.</div>
        </div>

        {loading ? (
          <div className="p-5 text-white/70">Cargando reglas…</div>
        ) : (
          <div className="p-5 space-y-4">
            {NIVELES.map((nivel) => {
              const k = key(nivel);
              const row = reglas[k];

              // Si no existe, dejamos la fila editable (id -1)
              const display = row ?? ({
                id: -1,
                seccionId: seccionId!,
                subSeccionId: subSeccionId === "null" ? null : (subSeccionId as number),
                nivel,
                tipo: "PORC_BASE",
                fijoEUR: "",
                porcentaje: "",
                minEUR: "",
                maxEUR: "",
                minAgenteEUR: "",
                maxAgenteEUR: "",
                minLugarEspecialEUR: "",
                maxLugarEspecialEUR: "",
                activa: true,
              } as any as Regla);

              return (
                <div key={nivel} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-white font-extrabold text-lg">{nivel}</div>
                      <span className="text-[11px] font-extrabold px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white/80">
                        {display.id === -1 ? "No creada" : `ID ${display.id}`}
                      </span>
                      <button
                        onClick={() => updateLocal(nivel, { activa: !display.activa })}
                        className={`text-[12px] font-extrabold px-2 py-1 rounded-lg border transition ${
                          display.activa
                            ? "bg-emerald-400/15 text-emerald-200 border-emerald-400/20"
                            : "bg-white/5 text-white/70 border-white/10"
                        }`}
                      >
                        {display.activa ? "Activa" : "Inactiva"}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => saveRow(nivel)}
                        disabled={!!saving[k]}
                        className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-[13px] font-extrabold text-white transition disabled:opacity-60"
                      >
                        {saving[k] ? "Guardando…" : "Guardar"}
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-extrabold text-white/70 uppercase">Tipo</label>
                      <select
                        className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                        value={display.tipo}
                        onChange={(e) => updateLocal(nivel, { tipo: e.target.value as any })}
                      >
                        {TIPOS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <div className="text-[11px] text-white/50 mt-1">
                        FIJA = € · PORC_BASE = % base · PORC_MARGEN = % margen · MIXTA = € + %
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold text-white/70 uppercase">Fijo (€)</label>
                      <input
                        className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                        value={moneyInput(display.fijoEUR)}
                        onChange={(e) => updateLocal(nivel, { fijoEUR: e.target.value })}
                        placeholder="Ej: 25"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold text-white/70 uppercase">% (ej 4.5)</label>
                      <input
                        className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                        value={moneyInput(display.porcentaje)}
                        onChange={(e) => updateLocal(nivel, { porcentaje: e.target.value })}
                        placeholder="Ej: 4.5"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold text-white/70 uppercase">Min/Max (€)</label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                          value={moneyInput(display.minEUR)}
                          onChange={(e) => updateLocal(nivel, { minEUR: e.target.value })}
                          placeholder="Min"
                        />
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                          value={moneyInput(display.maxEUR)}
                          onChange={(e) => updateLocal(nivel, { maxEUR: e.target.value })}
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid md:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="text-white font-extrabold text-sm mb-2">Límites Agente (€)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                          value={moneyInput(display.minAgenteEUR)}
                          onChange={(e) => updateLocal(nivel, { minAgenteEUR: e.target.value })}
                          placeholder="Min"
                        />
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                          value={moneyInput(display.maxAgenteEUR)}
                          onChange={(e) => updateLocal(nivel, { maxAgenteEUR: e.target.value })}
                          placeholder="Max"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="text-white font-extrabold text-sm mb-2">Límites Lugar especial (€)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                          value={moneyInput(display.minLugarEspecialEUR)}
                          onChange={(e) => updateLocal(nivel, { minLugarEspecialEUR: e.target.value })}
                          placeholder="Min"
                        />
                        <input
                          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                          value={moneyInput(display.maxLugarEspecialEUR)}
                          onChange={(e) => updateLocal(nivel, { maxLugarEspecialEUR: e.target.value })}
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>

                  {display.id === -1 && (
                    <div className="mt-3 text-[12px] text-white/60">
                      Esta regla aún no existe. Pulsa <b>Crear reglas faltantes</b> y luego guarda.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link href="/comisiones" className="text-emerald-300 font-extrabold">
          ← Volver a Comisiones
        </Link>
      </div>
    </div>
  );
}
