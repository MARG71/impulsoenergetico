//src/app/(crm)/comisiones-globales/ComisionesGlobalesContenido.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

type Nivel = "C1" | "C2" | "C3" | "ESPECIAL";
const NIVELES: Nivel[] = ["C1", "C2", "C3", "ESPECIAL"];
type Tipo = "FIJA" | "PORC_BASE" | "PORC_MARGEN" | "MIXTA";

function toNum(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function pickArrayFromApi(j: any) {
  // soporta: {ok:true, items:[]}, {ok:true, secciones:[]}, {items:[]}, {secciones:[]}, []
  if (!j) return [];
  if (Array.isArray(j)) return j;
  if (Array.isArray(j.items)) return j.items;
  if (Array.isArray(j.secciones)) return j.secciones;
  if (Array.isArray(j.data)) return j.data;
  return [];
}

function isOkResponse(rOk: boolean, j: any) {
  // soporta APIs que no devuelven "ok"
  if (!rOk) return false;
  if (j && typeof j === "object" && "ok" in j) return Boolean(j.ok);
  return true;
}

export default function ComisionesGlobalesContenido() {
  const sp = useSearchParams();
  const adminIdQs = sp.get("adminId"); // SUPERADMIN tenant mode
  const qs = adminIdQs ? `?adminId=${adminIdQs}` : "";

  const [secciones, setSecciones] = useState<any[]>([]);
  const [subsecciones, setSubsecciones] = useState<any[]>([]);
  const [seccionId, setSeccionId] = useState<number | null>(null);
  const [subSeccionId, setSubSeccionId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [reglas, setReglas] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);

  async function safeJson(res: Response) {
    const txt = await res.text();
    try {
      return { json: JSON.parse(txt), text: txt };
    } catch {
      return { json: null, text: txt };
    }
  }

  // --- cargar secciones
  async function loadSecciones() {
    const url = `/api/crm/secciones${qs}`;
    const r = await fetch(url, { cache: "no-store" });
    const { json: j, text } = await safeJson(r);

    if (!isOkResponse(r.ok, j)) {
      const errMsg =
        (j?.error as string) ||
        `No se pudieron cargar secciones (${r.status}).`;

      // Caso típico SUPERADMIN sin adminId:
      if (
        String(errMsg).toLowerCase().includes("tenantadminid") ||
        String(errMsg).toLowerCase().includes("adminid") ||
        r.status === 400
      ) {
        throw new Error(
          `Como SUPERADMIN necesitas entrar en modo tenant: abre esta pantalla con ?adminId=XX.\n\nEjemplo:\n/configuracion/comisiones-globales?adminId=1\n\n(El ID lo sacas de la pantalla “Admins”).\n\nDetalle: ${errMsg}`
        );
      }

      throw new Error(`${errMsg}\n\nRespuesta: ${String(text).slice(0, 200)}…`);
    }

    const items = pickArrayFromApi(j);
    setSecciones(items);

    // autoselect primera
    if (!seccionId && items[0]?.id) setSeccionId(Number(items[0].id));
  }

  // --- cargar subsecciones
  async function loadSubsecciones(seccionIdLocal: number) {
    // 1) si vienen embebidas
    const sec = secciones.find((s) => Number(s.id) === Number(seccionIdLocal));
    if (sec?.subsecciones && Array.isArray(sec.subsecciones)) {
      setSubsecciones(sec.subsecciones);
      return;
    }

    // 2) si existe endpoint
    try {
      const r = await fetch(
        `/api/crm/subsecciones?seccionId=${seccionIdLocal}${
          adminIdQs ? `&adminId=${adminIdQs}` : ""
        }`,
        { cache: "no-store" }
      );
      const { json: j } = await safeJson(r);
      if (!isOkResponse(r.ok, j)) {
        setSubsecciones([]);
        return;
      }
      const items = pickArrayFromApi(j);
      setSubsecciones(items);
    } catch {
      setSubsecciones([]);
    }
  }

  async function loadReglas() {
    if (!seccionId) return;
    setLoading(true);
    try {
      const url = `/api/crm/comisiones-globales?seccionId=${seccionId}&subSeccionId=${
        subSeccionId ?? "null"
      }${adminIdQs ? `&adminId=${adminIdQs}` : ""}`;

      const r = await fetch(url, { cache: "no-store" });
      const { json: j, text } = await safeJson(r);

      if (!isOkResponse(r.ok, j)) {
        throw new Error(
          (j?.error as string) ||
            `Error cargando reglas (${r.status}). Respuesta: ${String(text).slice(
              0,
              200
            )}…`
        );
      }

      const byNivel: Record<string, any> = {};
      for (const n of NIVELES) {
        byNivel[n] =
          j?.byNivel?.[n] ||
          {
            nivel: n,
            activa: true,
            tipo: "PORC_BASE" as Tipo,
            porcentaje: 0,
            fijoEUR: 0,
            minEUR: null,
            maxEUR: null,
            minAgenteEUR: null,
            maxAgenteEUR: null,
            minLugarEspecialEUR: null,
            maxLugarEspecialEUR: null,
          };
      }
      setReglas(byNivel);
    } catch (e: any) {
      toast.error(String(e?.message || e));
      setReglas({});
    } finally {
      setLoading(false);
    }
  }

  async function saveNivel(nivel: Nivel) {
    if (!seccionId) return;
    setSaving((p) => ({ ...p, [nivel]: true }));
    try {
      const payload = {
        seccionId,
        subSeccionId,
        nivel,
        regla: reglas[nivel],
        ...(adminIdQs ? { adminId: Number(adminIdQs) } : {}),
      };

      const r = await fetch(`/api/crm/comisiones-globales${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { json: j, text } = await safeJson(r);
      if (!isOkResponse(r.ok, j)) {
        throw new Error(
          (j?.error as string) ||
            `Error guardando (${r.status}). Respuesta: ${String(text).slice(
              0,
              200
            )}…`
        );
      }

      toast.success(`Guardado ${nivel} ✅`);
      await loadReglas();
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setSaving((p) => ({ ...p, [nivel]: false }));
    }
  }

  async function crearFaltantes() {
    if (!seccionId) return;
    setCreating(true);
    try {
      const r = await fetch(`/api/crm/comisiones-globales/faltantes${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seccionId,
          subSeccionId,
          ...(adminIdQs ? { adminId: Number(adminIdQs) } : {}),
        }),
      });

      const { json: j, text } = await safeJson(r);
      if (!isOkResponse(r.ok, j)) {
        throw new Error(
          (j?.error as string) ||
            `Error creando faltantes (${r.status}). Respuesta: ${String(text).slice(
              0,
              200
            )}…`
        );
      }

      toast.success(`Reglas faltantes creadas ✅ (${j?.created ?? 0})`);
      await loadReglas();
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await loadSecciones();
      } catch (e: any) {
        toast.error(String(e?.message || e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminIdQs]);

  useEffect(() => {
    if (!seccionId) return;
    (async () => {
      await loadSubsecciones(seccionId);
      setSubSeccionId(null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccionId]);

  useEffect(() => {
    if (!seccionId) return;
    loadReglas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccionId, subSeccionId, adminIdQs]);

  const tituloSeccion = useMemo(() => {
    const s = secciones.find((x) => Number(x.id) === Number(seccionId));
    return s?.nombre ?? "—";
  }, [secciones, seccionId]);

  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="text-white text-2xl font-extrabold">Comisiones globales</div>
        <div className="text-white/70 text-sm">
          Define C1/C2/C3/ESPECIAL por sección/subsección. Tipos: fija, % base, mixta. Con mínimos/máximos.
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <div className="text-white/60 text-xs font-bold uppercase mb-1">Sección</div>
            <select
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
              value={seccionId ?? ""}
              onChange={(e) => setSeccionId(e.target.value ? Number(e.target.value) : null)}
            >
              {secciones.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
            <div className="text-white/60 text-xs mt-2">
              Sección actual: <b className="text-white">{tituloSeccion}</b>
            </div>
          </div>

          <div>
            <div className="text-white/60 text-xs font-bold uppercase mb-1">Subsección</div>
            <select
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-D3 text-white font-bold"
              value={subSeccionId ?? "null"}
              onChange={(e) => setSubSeccionId(e.target.value === "null" ? null : Number(e.target.value))}
            >
              <option value="null">— Sin subsección (general)</option>
              {subsecciones.map((ss) => (
                <option key={ss.id} value={ss.id}>
                  {ss.nombre}
                </option>
              ))}
            </select>
            <div className="text-white/60 text-xs mt-2">
              Sub: <b className="text-white">{subSeccionId ? "seleccionada" : "general"}</b>
            </div>
          </div>

          <div className="flex md:justify-end">
            <button
              onClick={crearFaltantes}
              disabled={creating || !seccionId}
              className="w-full md:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-4 py-2 font-extrabold text-slate-950"
            >
              {creating ? "Creando…" : "Crear reglas faltantes"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white font-extrabold text-lg mb-2">Niveles</div>
        <div className="text-white/60 text-sm mb-3">
          Edita y guarda por nivel. Si falta una regla, usa “Crear reglas faltantes”.
        </div>

        {loading ? (
          <div className="text-white/70">Cargando reglas…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {NIVELES.map((nivel) => {
              const r = reglas[nivel] || {};
              return (
                <div key={nivel} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-white font-extrabold text-lg">{nivel}</div>
                    <div className="ml-auto flex items-center gap-2">
                      <label className="text-white/70 text-sm font-bold flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(r.activa ?? true)}
                          onChange={(e) =>
                            setReglas((p) => ({
                              ...p,
                              [nivel]: { ...(p[nivel] || {}), activa: e.target.checked },
                            }))
                          }
                        />
                        Activa
                      </label>

                      <button
                        onClick={() => saveNivel(nivel)}
                        disabled={Boolean(saving[nivel])}
                        className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                      >
                        {saving[nivel] ? "Guardando…" : "Guardar"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-white/60 text-xs font-bold uppercase mb-1">Tipo</div>
                      <select
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                        value={String(r.tipo ?? "PORC_BASE")}
                        onChange={(e) =>
                          setReglas((p) => ({
                            ...p,
                            [nivel]: { ...(p[nivel] || {}), tipo: e.target.value as Tipo },
                          }))
                        }
                      >
                        <option value="PORC_BASE">% sobre base</option>
                        <option value="FIJA">Fija</option>
                        <option value="MIXTA">Mixta</option>
                        <option value="PORC_MARGEN">% margen (por ahora igual que base)</option>
                      </select>
                    </div>

                    <div>
                      <div className="text-white/60 text-xs font-bold uppercase mb-1">% (si aplica)</div>
                      <input
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                        value={r.porcentaje ?? 0}
                        onChange={(e) =>
                          setReglas((p) => ({
                            ...p,
                            [nivel]: { ...(p[nivel] || {}), porcentaje: toNum(e.target.value, 0) },
                          }))
                        }
                        inputMode="decimal"
                      />
                    </div>

                    <div>
                      <div className="text-white/60 text-xs font-bold uppercase mb-1">Fijo € (si aplica)</div>
                      <input
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                        value={r.fijoEUR ?? 0}
                        onChange={(e) =>
                          setReglas((p) => ({
                            ...p,
                            [nivel]: { ...(p[nivel] || {}), fijoEUR: toNum(e.target.value, 0) },
                          }))
                        }
                        inputMode="decimal"
                      />
                    </div>

                    <div>
                      <div className="text-white/60 text-xs font-bold uppercase mb-1">Min € (total)</div>
                      <input
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                        value={r.minEUR ?? ""}
                        onChange={(e) =>
                          setReglas((p) => ({
                            ...p,
                            [nivel]: {
                              ...(p[nivel] || {}),
                              minEUR: e.target.value === "" ? null : toNum(e.target.value, 0),
                            },
                          }))
                        }
                        inputMode="decimal"
                        placeholder="(vacío = sin mínimo)"
                      />
                    </div>

                    <div>
                      <div className="text-white/60 text-xs font-bold uppercase mb-1">Max € (total)</div>
                      <input
                        className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white font-bold"
                        value={r.maxEUR ?? ""}
                        onChange={(e) =>
                          setReglas((p) => ({
                            ...p,
                            [nivel]: {
                              ...(p[nivel] || {}),
                              maxEUR: e.target.value === "" ? null : toNum(e.target.value, 0),
                            },
                          }))
                        }
                        inputMode="decimal"
                        placeholder="(vacío = sin máximo)"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={() => history.back()}
          className="text-emerald-300 hover:text-emerald-200 font-bold"
        >
          ← Volver a Comisiones
        </button>
      </div>
    </div>
  );
}
