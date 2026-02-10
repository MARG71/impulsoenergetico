"use client";

import { useEffect, useMemo, useState } from "react";

type Seccion = { id: number; nombre: string };
type SubSeccion = { id: number; nombre: string; seccionId: number };

type Regla = {
  id: number;
  adminId: number | null;
  seccionId: number;
  subSeccionId: number | null;
  nivel: "C1" | "C2" | "C3" | "ESPECIAL";
  tipo: "FIJA" | "PORC_BASE" | "MIXTA";
  fijoEUR: string | null;
  porcentaje: string | null;
  minEUR: string | null;
  maxEUR: string | null;
  minAgenteEUR: string | null;
  maxAgenteEUR: string | null;
  minLugarEspecialEUR: string | null;
  maxLugarEspecialEUR: string | null;
  activa: boolean;
  seccion?: Seccion;
  subSeccion?: SubSeccion | null;
};

const niveles: Regla["nivel"][] = ["C1", "C2", "C3", "ESPECIAL"];
const tipos: Regla["tipo"][] = ["FIJA", "PORC_BASE", "MIXTA"];

function toNum(v: any) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function ReglasContenido() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [subsecciones, setSubsecciones] = useState<SubSeccion[]>([]);
  const [reglas, setReglas] = useState<Regla[]>([]);

  const [filterSeccionId, setFilterSeccionId] = useState<number | "">("");
  const [filterNivel, setFilterNivel] = useState<Regla["nivel"] | "">("");

  // Form crear/editar
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    adminId: "" as string, // vacío => null (global)
    seccionId: "" as string,
    subSeccionId: "" as string, // vacío => null
    nivel: "C1" as Regla["nivel"],
    tipo: "PORC_BASE" as Regla["tipo"],
    fijoEUR: "",
    porcentaje: "",
    minEUR: "",
    maxEUR: "",
    minAgenteEUR: "",
    maxAgenteEUR: "",
    minLugarEspecialEUR: "",
    maxLugarEspecialEUR: "",
    activa: true,
  });

  const subsFiltradas = useMemo(() => {
    const sid = Number(form.seccionId || 0);
    if (!sid) return [];
    return subsecciones.filter((s) => s.seccionId === sid);
  }, [subsecciones, form.seccionId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [sec, sub, reg] = await Promise.all([
        fetch("/api/crm/secciones").then((r) => r.json()),
        fetch("/api/crm/subsecciones").then((r) => r.json()),
        fetch("/api/crm/reglas-comision-global").then((r) => r.json()),
      ]);

      setSecciones(sec?.secciones ?? []);
      setSubsecciones(sub?.subsecciones ?? []);
      setReglas(reg?.reglas ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const reglasFiltradas = useMemo(() => {
    return reglas.filter((r) => {
      if (filterSeccionId !== "" && r.seccionId !== Number(filterSeccionId)) return false;
      if (filterNivel !== "" && r.nivel !== filterNivel) return false;
      return true;
    });
  }, [reglas, filterSeccionId, filterNivel]);

  function resetForm() {
    setEditId(null);
    setForm({
      adminId: "",
      seccionId: "",
      subSeccionId: "",
      nivel: "C1",
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
    });
  }

  function startEdit(r: Regla) {
    setEditId(r.id);
    setForm({
      adminId: r.adminId == null ? "" : String(r.adminId),
      seccionId: String(r.seccionId),
      subSeccionId: r.subSeccionId == null ? "" : String(r.subSeccionId),
      nivel: r.nivel,
      tipo: r.tipo,
      fijoEUR: r.fijoEUR ?? "",
      porcentaje: r.porcentaje ?? "",
      minEUR: r.minEUR ?? "",
      maxEUR: r.maxEUR ?? "",
      minAgenteEUR: r.minAgenteEUR ?? "",
      maxAgenteEUR: r.maxAgenteEUR ?? "",
      minLugarEspecialEUR: r.minLugarEspecialEUR ?? "",
      maxLugarEspecialEUR: r.maxLugarEspecialEUR ?? "",
      activa: r.activa,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    const seccionId = Number(form.seccionId);
    if (!seccionId) return alert("Selecciona sección");

    setSaving(true);
    try {
      const payload: any = {
        adminId: form.adminId ? Number(form.adminId) : null,
        seccionId,
        subSeccionId: form.subSeccionId ? Number(form.subSeccionId) : null,
        nivel: form.nivel,
        tipo: form.tipo,
        fijoEUR: toNum(form.fijoEUR),
        porcentaje: toNum(form.porcentaje),
        minEUR: toNum(form.minEUR),
        maxEUR: toNum(form.maxEUR),
        minAgenteEUR: toNum(form.minAgenteEUR),
        maxAgenteEUR: toNum(form.maxAgenteEUR),
        minLugarEspecialEUR: toNum(form.minLugarEspecialEUR),
        maxLugarEspecialEUR: toNum(form.maxLugarEspecialEUR),
        activa: form.activa,
      };

      if (!editId) {
        const res = await fetch("/api/crm/reglas-comision-global", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json();
        if (!res.ok) return alert(j?.error ?? "Error creando regla");
      } else {
        const res = await fetch(`/api/crm/reglas-comision-global/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json();
        if (!res.ok) return alert(j?.error ?? "Error actualizando regla");
      }

      await loadAll();
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function del(id: number) {
    if (!confirm("¿Eliminar esta regla?")) return;
    const res = await fetch(`/api/crm/reglas-comision-global/${id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error ?? "Error eliminando");
    await loadAll();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold text-white mb-4">Reglas de Comisión (Global/Tenant)</h1>

      {/* FORM */}
      <div className="rounded-2xl bg-white p-4 shadow mb-6">
        <div className="flex items-center justify-between">
          <div className="font-bold text-lg">
            {editId ? `Editar regla #${editId}` : "Crear regla"}
          </div>
          <button
            onClick={resetForm}
            className="px-3 py-2 rounded-lg border text-sm"
          >
            Limpiar
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-3">
          <div>
            <div className="text-sm font-bold mb-1">adminId (vacío = global)</div>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.adminId}
              onChange={(e) => setForm((s) => ({ ...s, adminId: e.target.value }))}
              placeholder="Ej: 1"
            />
          </div>

          <div>
            <div className="text-sm font-bold mb-1">Sección</div>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.seccionId}
              onChange={(e) => setForm((s) => ({ ...s, seccionId: e.target.value, subSeccionId: "" }))}
            >
              <option value="">Selecciona…</option>
              {secciones.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm font-bold mb-1">Subsección (opcional)</div>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.subSeccionId}
              onChange={(e) => setForm((s) => ({ ...s, subSeccionId: e.target.value }))}
              disabled={!form.seccionId}
            >
              <option value="">(General)</option>
              {subsFiltradas.map((ss) => (
                <option key={ss.id} value={ss.id}>
                  {ss.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm font-bold mb-1">Nivel</div>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.nivel}
              onChange={(e) => setForm((s) => ({ ...s, nivel: e.target.value as any }))}
            >
              {niveles.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm font-bold mb-1">Tipo</div>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.tipo}
              onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value as any }))}
            >
              {tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm font-bold mb-1">Fijo EUR (si aplica)</div>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.fijoEUR}
              onChange={(e) => setForm((s) => ({ ...s, fijoEUR: e.target.value }))}
              placeholder="Ej: 30"
            />
          </div>

          <div>
            <div className="text-sm font-bold mb-1">% (si aplica)</div>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.porcentaje}
              onChange={(e) => setForm((s) => ({ ...s, porcentaje: e.target.value }))}
              placeholder="Ej: 10"
            />
          </div>

          <div>
            <div className="text-sm font-bold mb-1">Activa</div>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={form.activa}
                onChange={(e) => setForm((s) => ({ ...s, activa: e.target.checked }))}
              />
              <span>Sí</span>
            </label>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-4">
          {[
            ["minEUR", "Min total EUR"],
            ["maxEUR", "Max total EUR"],
            ["minAgenteEUR", "Min agente EUR"],
            ["maxAgenteEUR", "Max agente EUR"],
            ["minLugarEspecialEUR", "Min lugar especial EUR"],
            ["maxLugarEspecialEUR", "Max lugar especial EUR"],
          ].map(([k, label]) => (
            <div key={k}>
              <div className="text-sm font-bold mb-1">{label}</div>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={(form as any)[k]}
                onChange={(e) => setForm((s) => ({ ...s, [k]: e.target.value } as any))}
                placeholder="(opcional)"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-black text-white font-bold"
          >
            {saving ? "Guardando..." : editId ? "Guardar cambios" : "Crear regla"}
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
          <div className="font-bold text-lg">Listado</div>

          <div className="flex gap-2">
            <select
              className="border rounded-lg px-3 py-2"
              value={filterSeccionId}
              onChange={(e) => setFilterSeccionId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Todas las secciones</option>
              {secciones.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>

            <select
              className="border rounded-lg px-3 py-2"
              value={filterNivel}
              onChange={(e) => setFilterNivel(e.target.value as any)}
            >
              <option value="">Todos los niveles</option>
              {niveles.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <button
              onClick={loadAll}
              className="px-3 py-2 rounded-lg border"
            >
              Recargar
            </button>
          </div>
        </div>

        {loading ? (
          <div>Cargando…</div>
        ) : reglasFiltradas.length === 0 ? (
          <div>No hay reglas.</div>
        ) : (
          <div className="space-y-2">
            {reglasFiltradas.map((r) => (
              <div key={r.id} className="border rounded-xl p-3 flex flex-wrap gap-2 items-center justify-between">
                <div className="text-sm">
                  <div className="font-bold">
                    #{r.id} · {r.seccion?.nombre ?? `Sección ${r.seccionId}`} · {r.subSeccion?.nombre ?? "(General)"} · {r.nivel}
                    {r.adminId == null ? " · GLOBAL" : ` · adminId=${r.adminId}`}
                    {!r.activa ? " · INACTIVA" : ""}
                  </div>
                  <div>
                    Tipo: <b>{r.tipo}</b>{" "}
                    {r.porcentaje != null ? <> · %: <b>{r.porcentaje}</b></> : null}
                    {r.fijoEUR != null ? <> · Fijo: <b>{r.fijoEUR}</b></> : null}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => startEdit(r)} className="px-3 py-2 rounded-lg border">
                    Editar
                  </button>
                  <button onClick={() => del(r.id)} className="px-3 py-2 rounded-lg border text-red-700">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
