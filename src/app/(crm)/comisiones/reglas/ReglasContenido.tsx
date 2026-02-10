"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { apiWithTenant } from "@/lib/tenant-url";

type Nivel = "C1" | "C2" | "C3" | "ESPECIAL";
type Tipo = "FIJA" | "PORC_BASE" | "PORC_MARGEN" | "MIXTA";

type Seccion = { id: number; nombre: string; slug?: string | null };
type SubSeccion = { id: number; nombre: string; slug?: string | null; seccionId: number };

type Regla = {
  id: number;
  adminId?: number | null;
  seccionId: number;
  subSeccionId: number | null;
  nivel: Nivel;
  tipo: Tipo;

  fijoEUR: string | number | null;
  porcentaje: string | number | null;

  minEUR: string | number | null;
  maxEUR: string | number | null;

  minAgenteEUR: string | number | null;
  maxAgenteEUR: string | number | null;
  minLugarEspecialEUR: string | number | null;
  maxLugarEspecialEUR: string | number | null;

  activa: boolean;

  seccion?: Seccion;
  subSeccion?: SubSeccion | null;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function inputNum(value: any) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function badgeNivel(n: Nivel) {
  const map: Record<Nivel, string> = {
    C1: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
    C2: "bg-sky-500/15 text-sky-200 border-sky-400/20",
    C3: "bg-violet-500/15 text-violet-200 border-violet-400/20",
    ESPECIAL: "bg-orange-500/15 text-orange-200 border-orange-400/20",
  };
  return map[n] ?? "bg-white/10 text-white border-white/10";
}

function fmtEUR(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function tipoLabel(t: Tipo) {
  if (t === "FIJA") return "Fija";
  if (t === "PORC_BASE") return "% sobre base";
  if (t === "PORC_MARGEN") return "% sobre margen";
  if (t === "MIXTA") return "Mixta (fijo + %)";
  return t;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-semibold text-white/90">{label}</label>
        {hint ? <div className="text-xs text-white/50">{hint}</div> : null}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/10 bg-[#0b1220]/70 px-3 py-2 text-white outline-none
                 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-500/20"
    />
  );
}

function Select({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-[#0b1220]/70 px-3 py-2 text-white outline-none",
        "focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-500/20",
        disabled && "opacity-60"
      )}
    >
      {children}
    </select>
  );
}

export default function ReglasComisionContenido() {
  const { data: session, status } = useSession();

  const role = String((session?.user as any)?.role ?? (session?.user as any)?.rol ?? "").toUpperCase();
  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN" || isSuperadmin;

  // SUPERADMIN puede filtrar por adminId
  const [adminId, setAdminId] = useState<string>("");

  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [subSecciones, setSubSecciones] = useState<SubSeccion[]>([]);
  const [reglas, setReglas] = useState<Regla[]>([]);

  // Form
  const [seccionId, setSeccionId] = useState<string>("");
  const [subSeccionId, setSubSeccionId] = useState<string>("");
  const [nivel, setNivel] = useState<Nivel>("C1");
  const [tipo, setTipo] = useState<Tipo>("PORC_BASE");

  const [fijoEUR, setFijoEUR] = useState<string>("");
  const [porcentaje, setPorcentaje] = useState<string>("");

  const [minEUR, setMinEUR] = useState<string>("");
  const [maxEUR, setMaxEUR] = useState<string>("");

  const [minAgenteEUR, setMinAgenteEUR] = useState<string>("");
  const [maxAgenteEUR, setMaxAgenteEUR] = useState<string>("");

  const [minLugarEspecialEUR, setMinLugarEspecialEUR] = useState<string>("");
  const [maxLugarEspecialEUR, setMaxLugarEspecialEUR] = useState<string>("");

  const [activa, setActiva] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const subSeccionesFiltradas = useMemo(() => {
    const sid = Number(seccionId || 0);
    if (!sid) return [];
    return subSecciones.filter((s) => s.seccionId === sid);
  }, [subSecciones, seccionId]);

  function showOk(text: string) {
    setMsg({ type: "ok", text });
    setTimeout(() => setMsg(null), 2500);
  }
  function showErr(text: string) {
    setMsg({ type: "err", text });
    setTimeout(() => setMsg(null), 3500);
  }

  async function loadSecciones() {
    const url1 = isSuperadmin ? apiWithTenant("/api/crm/secciones", adminId || null) : "/api/crm/secciones";
    const url2 = isSuperadmin ? apiWithTenant("/api/crm/subsecciones", adminId || null) : "/api/crm/subsecciones";

    const [r1, r2] = await Promise.all([fetch(url1, { cache: "no-store" }), fetch(url2, { cache: "no-store" })]);
    const j1 = await r1.json();
    const j2 = await r2.json();

    setSecciones(Array.isArray(j1?.secciones) ? j1.secciones : []);
    setSubSecciones(Array.isArray(j2?.subsecciones) ? j2.subsecciones : []);
  }

  async function loadReglas() {
    const url = isSuperadmin ? apiWithTenant("/api/crm/reglas-comision-global", adminId || null) : "/api/crm/reglas-comision-global";
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    setReglas(Array.isArray(j?.reglas) ? j.reglas : []);
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isAdmin) return;
    (async () => {
      try {
        setLoading(true);
        await loadSecciones();
        await loadReglas();
      } catch (e: any) {
        showErr(e?.message ?? "Error cargando datos");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isSuperadmin) return;
    (async () => {
      try {
        setLoading(true);
        await loadSecciones();
        await loadReglas();
      } catch (e: any) {
        showErr(e?.message ?? "Error recargando por adminId");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  function resetForm() {
    setEditingId(null);
    setSeccionId("");
    setSubSeccionId("");
    setNivel("C1");
    setTipo("PORC_BASE");
    setFijoEUR("");
    setPorcentaje("");
    setMinEUR("");
    setMaxEUR("");
    setMinAgenteEUR("");
    setMaxAgenteEUR("");
    setMinLugarEspecialEUR("");
    setMaxLugarEspecialEUR("");
    setActiva(true);
  }

  function fillFormFromRegla(r: Regla) {
    setEditingId(r.id);
    setSeccionId(String(r.seccionId));
    setSubSeccionId(r.subSeccionId ? String(r.subSeccionId) : "");
    setNivel(r.nivel);
    setTipo(r.tipo);

    setFijoEUR(inputNum(r.fijoEUR));
    setPorcentaje(inputNum(r.porcentaje));

    setMinEUR(inputNum(r.minEUR));
    setMaxEUR(inputNum(r.maxEUR));

    setMinAgenteEUR(inputNum(r.minAgenteEUR));
    setMaxAgenteEUR(inputNum(r.maxAgenteEUR));

    setMinLugarEspecialEUR(inputNum(r.minLugarEspecialEUR));
    setMaxLugarEspecialEUR(inputNum(r.maxLugarEspecialEUR));

    setActiva(Boolean(r.activa));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    try {
      setMsg(null);

      const sid = Number(seccionId);
      if (!sid) return showErr("Selecciona una Sección");
      const subId = subSeccionId ? Number(subSeccionId) : null;

      const payload: any = {
        seccionId: sid,
        subSeccionId: subId,
        nivel,
        tipo,
        activa,

        fijoEUR: fijoEUR === "" ? null : Number(fijoEUR),
        porcentaje: porcentaje === "" ? null : Number(porcentaje),

        minEUR: minEUR === "" ? null : Number(minEUR),
        maxEUR: maxEUR === "" ? null : Number(maxEUR),

        minAgenteEUR: minAgenteEUR === "" ? null : Number(minAgenteEUR),
        maxAgenteEUR: maxAgenteEUR === "" ? null : Number(maxAgenteEUR),

        minLugarEspecialEUR: minLugarEspecialEUR === "" ? null : Number(minLugarEspecialEUR),
        maxLugarEspecialEUR: maxLugarEspecialEUR === "" ? null : Number(maxLugarEspecialEUR),
      };

      const url = isSuperadmin ? apiWithTenant("/api/crm/reglas-comision-global", adminId || null) : "/api/crm/reglas-comision-global";

      setLoading(true);

      if (editingId) {
        const r = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const j = await r.json();
        if (!r.ok) return showErr(j?.error ?? "No se pudo actualizar");
        showOk("Regla actualizada");
      } else {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await r.json();
        if (!r.ok) return showErr(j?.error ?? "No se pudo crear");
        showOk("Regla creada");
      }

      await loadReglas();
      resetForm();
    } catch (e: any) {
      showErr(e?.message ?? "Error guardando");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActiva(r: Regla) {
    try {
      const url = isSuperadmin ? apiWithTenant("/api/crm/reglas-comision-global", adminId || null) : "/api/crm/reglas-comision-global";
      setLoading(true);
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, activa: !r.activa }),
      });
      const j = await res.json();
      if (!res.ok) return showErr(j?.error ?? "No se pudo cambiar estado");
      await loadReglas();
      showOk(!r.activa ? "Regla activada" : "Regla desactivada");
    } catch (e: any) {
      showErr(e?.message ?? "Error cambiando estado");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return <div className="p-6 text-white/80">Cargando…</div>;

  if (!isAdmin) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">No autorizado.</div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      {/* HEADER */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Reglas de Comisión (Global/Tenant)</h1>
        <p className="mt-1 text-white/70">
          Aquí defines cómo se calcula la comisión por <b>Sección / SubSección</b> y por nivel <b>C1, C2, C3, ESPECIAL</b>.
        </p>
      </div>

      {msg && (
        <div
          className={cn(
            "mb-4 rounded-2xl border p-3",
            msg.type === "ok"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-red-400/30 bg-red-500/10 text-red-100"
          )}
        >
          {msg.text}
        </div>
      )}

      {/* SUPERADMIN tenant selector */}
      {isSuperadmin && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-[#07101e]/50 p-4">
          <div className="mb-2 text-sm font-semibold text-white/90">Modo SUPERADMIN</div>
          <div className="text-xs text-white/60 mb-3">
            Puedes ver reglas <b>globales</b> (adminId vacío) o las reglas de un <b>ADMIN concreto</b> (adminId = ID del admin).
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <Field label="adminId (opcional)" hint="Vacío = global">
              <Input value={adminId} onChange={setAdminId} placeholder="Ej: 12" />
            </Field>

            <button
              onClick={() => setAdminId("")}
              className="h-[42px] rounded-xl bg-white/10 px-4 font-semibold hover:bg-white/15"
            >
              Ver global
            </button>

            <button
              onClick={async () => {
                setLoading(true);
                await loadReglas();
                setLoading(false);
                showOk("Recargado");
              }}
              className="h-[42px] rounded-xl bg-white/10 px-4 font-semibold hover:bg-white/15"
              disabled={loading}
            >
              Recargar
            </button>
          </div>
        </div>
      )}

      {/* FORM CARD */}
      <div className="rounded-3xl border border-white/10 bg-[#07101e]/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-bold">
              {editingId ? `Editar regla #${editingId}` : "Crear nueva regla"}
            </div>
            <div className="text-sm text-white/60">
              Consejo: crea primero la regla <b>General</b> (sin SubSección) y luego si quieres reglas específicas.
            </div>
          </div>

          <div className="flex gap-2">
            {editingId && (
              <button onClick={resetForm} className="rounded-xl bg-white/10 px-4 py-2 font-semibold hover:bg-white/15">
                Cancelar
              </button>
            )}
            <button
              onClick={save}
              disabled={loading}
              className="rounded-xl bg-emerald-500 px-4 py-2 font-extrabold text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {editingId ? "Guardar cambios" : "Crear regla"}
            </button>
          </div>
        </div>

        {/* Bloque: Identidad */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-sm font-bold text-white/90">1) Dónde aplica la regla</div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Field label="Sección" hint="Obligatorio">
              <Select
                value={seccionId}
                onChange={(v) => {
                  setSeccionId(v);
                  setSubSeccionId("");
                }}
              >
                <option value="">Selecciona…</option>
                {secciones.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.nombre}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="SubSección" hint="Opcional (General si vacío)">
              <Select value={subSeccionId} onChange={setSubSeccionId} disabled={!seccionId}>
                <option value="">(General)</option>
                {subSeccionesFiltradas.map((ss) => (
                  <option key={ss.id} value={String(ss.id)}>
                    {ss.nombre}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Nivel" hint="C1/C2/C3/ESPECIAL">
              <Select value={nivel} onChange={(v) => setNivel(v as Nivel)}>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
                <option value="C3">C3</option>
                <option value="ESPECIAL">ESPECIAL</option>
              </Select>
            </Field>

            <Field label="Estado">
              <div className="flex h-[42px] items-center gap-2 rounded-xl border border-white/10 bg-[#0b1220]/70 px-3">
                <input
                  id="activa"
                  type="checkbox"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                />
                <label htmlFor="activa" className="text-sm text-white/80">
                  Regla activa
                </label>
              </div>
            </Field>
          </div>
        </div>

        {/* Bloque: Cálculo */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-sm font-bold text-white/90">2) Cómo se calcula la comisión</div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Field label="Tipo de cálculo" hint="Elige la fórmula">
              <Select value={tipo} onChange={(v) => setTipo(v as Tipo)}>
                <option value="PORC_BASE">% sobre base</option>
                <option value="FIJA">Fija</option>
                <option value="MIXTA">Mixta (fijo + %)</option>
                <option value="PORC_MARGEN">% sobre margen</option>
              </Select>
            </Field>

            <Field label="Fijo (€)" hint="Solo FIJA o MIXTA">
              <Input value={fijoEUR} onChange={setFijoEUR} placeholder="Ej: 30" />
            </Field>

            <Field label="Porcentaje (%)" hint="Ej: 10 = 10%">
              <Input value={porcentaje} onChange={setPorcentaje} placeholder="Ej: 10" />
            </Field>

            <div className="rounded-2xl border border-white/10 bg-[#0b1220]/60 p-3">
              <div className="text-xs text-white/60">Resumen fórmula</div>
              <div className="mt-1 text-sm font-bold">
                {tipoLabel(tipo)}{" "}
                <span className="text-white/70">
                  {tipo === "FIJA"
                    ? `→ ${fijoEUR || "0"}€`
                    : tipo === "MIXTA"
                    ? `→ ${fijoEUR || "0"}€ + ${porcentaje || "0"}%`
                    : `→ ${porcentaje || "0"}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque: Límites */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 text-sm font-bold text-white/90">3) Límites de comisión total</div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Mín total (€)" hint="Opcional">
                <Input value={minEUR} onChange={setMinEUR} placeholder="Ej: 5" />
              </Field>
              <Field label="Máx total (€)" hint="Opcional">
                <Input value={maxEUR} onChange={setMaxEUR} placeholder="Ej: 200" />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 text-sm font-bold text-white/90">4) Límites pago Agente</div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Mín agente (€)" hint="Opcional">
                <Input value={minAgenteEUR} onChange={setMinAgenteEUR} placeholder="Ej: 10" />
              </Field>
              <Field label="Máx agente (€)" hint="Opcional">
                <Input value={maxAgenteEUR} onChange={setMaxAgenteEUR} placeholder="Ej: 120" />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 text-sm font-bold text-white/90">5) Límites pago Lugar ESPECIAL</div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Mín lugar especial (€)" hint="Solo si Lugar.especial = true">
                <Input value={minLugarEspecialEUR} onChange={setMinLugarEspecialEUR} placeholder="Ej: 20" />
              </Field>
              <Field label="Máx lugar especial (€)" hint="Solo si Lugar.especial = true">
                <Input value={maxLugarEspecialEUR} onChange={setMaxLugarEspecialEUR} placeholder="Ej: 200" />
              </Field>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-white/50">
            Nota: SubSección vacía = regla general (fallback). Si existe una regla exacta, tiene prioridad.
          </div>

          <button
            onClick={async () => {
              setLoading(true);
              await loadReglas();
              setLoading(false);
              showOk("Reglas recargadas");
            }}
            disabled={loading}
            className="rounded-xl bg-white/10 px-4 py-2 font-semibold hover:bg-white/15 disabled:opacity-60"
          >
            Recargar reglas
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-[#07101e]/60 p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-bold">Reglas existentes</div>
            <div className="text-sm text-white/60">{reglas.length} reglas</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="text-white/70">
              <tr className="border-b border-white/10">
                <th className="py-3 text-left">ID</th>
                <th className="py-3 text-left">Sección</th>
                <th className="py-3 text-left">SubSección</th>
                <th className="py-3 text-left">Nivel</th>
                <th className="py-3 text-left">Cálculo</th>
                <th className="py-3 text-left">Límites</th>
                <th className="py-3 text-left">Estado</th>
                <th className="py-3 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {reglas.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="py-3 text-white/80">#{r.id}</td>
                  <td className="py-3 font-semibold">{r.seccion?.nombre ?? `Sección ${r.seccionId}`}</td>
                  <td className="py-3 text-white/80">
                    {r.subSeccion?.nombre ?? (r.subSeccionId ? `Sub ${r.subSeccionId}` : "General")}
                  </td>

                  <td className="py-3">
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-xs font-bold", badgeNivel(r.nivel))}>
                      {r.nivel}
                    </span>
                  </td>

                  <td className="py-3 text-white/80">
                    <div className="font-semibold">{tipoLabel(r.tipo)}</div>
                    <div className="text-xs text-white/60">
                      {r.tipo === "FIJA"
                        ? `Total = ${fmtEUR(r.fijoEUR)}`
                        : r.tipo === "MIXTA"
                        ? `Total = ${fmtEUR(r.fijoEUR)} + ${toNum(r.porcentaje)}%`
                        : `Total = ${toNum(r.porcentaje)}%`}
                    </div>
                  </td>

                  <td className="py-3 text-white/70">
                    <div className="text-xs">Total: {r.minEUR != null || r.maxEUR != null ? `${fmtEUR(r.minEUR)} – ${fmtEUR(r.maxEUR)}` : "—"}</div>
                    <div className="text-xs">Agente: {r.minAgenteEUR != null || r.maxAgenteEUR != null ? `${fmtEUR(r.minAgenteEUR)} – ${fmtEUR(r.maxAgenteEUR)}` : "—"}</div>
                    <div className="text-xs">Lugar esp.: {r.minLugarEspecialEUR != null || r.maxLugarEspecialEUR != null ? `${fmtEUR(r.minLugarEspecialEUR)} – ${fmtEUR(r.maxLugarEspecialEUR)}` : "—"}</div>
                  </td>

                  <td className="py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-1 text-xs font-bold",
                        r.activa
                          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                          : "border-red-400/20 bg-red-500/15 text-red-200"
                      )}
                    >
                      {r.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>

                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => fillFormFromRegla(r)}
                        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => toggleActiva(r)}
                        className={cn(
                          "rounded-xl px-3 py-2 text-xs font-semibold",
                          r.activa ? "bg-red-500/20 hover:bg-red-500/30" : "bg-emerald-500/20 hover:bg-emerald-500/30"
                        )}
                      >
                        {r.activa ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {reglas.length === 0 && (
                <tr>
                  <td className="py-6 text-white/60" colSpan={8}>
                    No hay reglas todavía. Crea la primera arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-white/50">
          Prioridad: 1) regla exacta (Sección+SubSección+nivel), 2) general (SubSección vacío), 3) global (adminId null).
        </div>
      </div>
    </div>
  );
}
