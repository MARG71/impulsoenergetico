"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";
type Lugar = any;

type KpisLugar = {
  leads7d: number;
  comparativasMes: number;
  ahorroTotal: number;
  comisionTotal: number;
};

const eur = (n: any) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
    Number.isFinite(Number(n)) ? Number(n) : 0
  );

const fmtPct = (v: any) => (v == null ? "—" : `${(Number(v) * 100).toFixed(1)}%`);

const toNumberOr = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function normalizeKpis(raw: any): KpisLugar {
  const src = raw?.kpisGlobal ?? raw?.kpis ?? raw?.kpi ?? raw ?? {};
  return {
    leads7d: Number(src?.leads7d ?? 0) || 0,
    comparativasMes: Number(src?.comparativasMes ?? 0) || 0,
    ahorroTotal: Number(src?.ahorroTotal ?? 0) || 0,
    comisionTotal: Number(src?.comisionTotal ?? 0) || 0,
  };
}

export default function EditarLugarContenido({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";
  const canEdit = isAdmin || isSuperadmin;

  // tenant (si vienes como SUPERADMIN con ?adminId=)
  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;
  const tenantMode =
    isSuperadmin &&
    typeof adminIdContext === "number" &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  const adminQuery =
    isSuperadmin && tenantMode && adminIdContext ? `?adminId=${adminIdContext}` : "";

  const [agentes, setAgentes] = useState<any[]>([]);

  const [edit, setEdit] = useState<Lugar | null>(null);
  const [editTab, setEditTab] = useState<"basico" | "qr" | "especial">("basico");

  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editCartelFile, setEditCartelFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cartelPreview, setCartelPreview] = useState<string | null>(null);

  // ✅ cleanup de URLs (evita fugas de memoria)
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (cartelPreview) URL.revokeObjectURL(cartelPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [kpis, setKpis] = useState<KpisLugar>({
    leads7d: 0,
    comparativasMes: 0,
    ahorroTotal: 0,
    comisionTotal: 0,
  });
  const [kpisLoading, setKpisLoading] = useState(false);

  // 1) cargar agentes (para el select)
  useEffect(() => {
    if (!session || !role) return;

    (async () => {
      try {
        const res = await fetch(`/api/agentes${adminQuery}`, { cache: "no-store" });
        const json = await res.json();
        setAgentes(Array.isArray(json) ? json : []);
      } catch {
        setAgentes([]);
      }
    })();
  }, [session, role, adminQuery]);

  // 2) cargar lugar a editar
  useEffect(() => {
    if (!session || !role) return;

    (async () => {
      try {
        const res = await fetch(`/api/lugares/${id}${adminQuery}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo cargar el lugar");

        setEdit({
          ...data,
          especial: !!data.especial,
          especialColor: data.especialColor ?? "#FF7A3B",
          especialMensaje: data.especialMensaje ?? "",
          aportacionAcumulada: data.aportacionAcumulada ?? 0,
          especialCartelUrl: data.especialCartelUrl ?? "",
          especialLogoUrl: data.especialLogoUrl ?? "",
          // ✅ normaliza agenteId a string para el select
          agenteId: data.agenteId ? String(data.agenteId) : "",
          pctCliente: data.pctCliente ?? "",
          pctLugar: data.pctLugar ?? "",
        });
      } catch (e: any) {
        alert(e?.message || "Error cargando lugar");
        router.push(`/lugares`);
      }
    })();
  }, [session, role, id, adminQuery, router]);

  // 3) cargar KPIs
  useEffect(() => {
    if (!session || !role) return;

    (async () => {
      try {
        setKpisLoading(true);
        const res = await fetch(`/api/lugares/${id}/detalle${adminQuery}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const raw = await res.json();
        setKpis(normalizeKpis(raw));
      } catch {
        setKpis({ leads7d: 0, comparativasMes: 0, ahorroTotal: 0, comisionTotal: 0 });
      } finally {
        setKpisLoading(false);
      }
    })();
  }, [session, role, id, adminQuery]);

  async function subirFichero(file: File, folder: string): Promise<string | null> {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);

      const r = await fetch("/api/uploads", { method: "POST", body: form });
      if (!r.ok) {
        const msg = await r.text().catch(() => "");
        alert(`Error al subir fichero (${r.status}): ${msg || "sin detalle"}`);
        return null;
      }
      const data = await r.json();
      const url = data?.url?.toString() ?? "";
      if (!/^https?:\/\//i.test(url)) {
        alert("La subida no devolvió una URL válida.");
        return null;
      }
      return url;
    } catch (e: any) {
      alert(`Excepción subiendo fichero: ${e?.message || e}`);
      return null;
    }
  }

  const generarQR = () => {
    if (!edit) return;
    setEdit({ ...edit, qrCode: uuidv4() });
  };

  const guardar = async () => {
    if (!edit) return;
    if (!canEdit) {
      alert("No tienes permisos para editar.");
      return;
    }

    let especialLogoUrl = edit.especialLogoUrl ?? "";
    if (edit.especial && editLogoFile) {
      const up = await subirFichero(editLogoFile, "logos-lugares");
      if (up) especialLogoUrl = up;
    }

    let especialCartelUrl = edit.especialCartelUrl ?? "";
    if (edit.especial && editCartelFile) {
      const up = await subirFichero(editCartelFile, "carteles-especiales");
      if (up) especialCartelUrl = up;
    }

    const payload: any = {
      nombre: edit.nombre,
      direccion: edit.direccion,
      qrCode: edit.qrCode,
      agenteId: edit.agenteId ? Number(edit.agenteId) : null,
      pctCliente: edit.pctCliente,
      pctLugar: edit.pctLugar,
      especial: !!edit.especial,
      especialLogoUrl,
      especialColor: edit.especialColor,
      especialMensaje: edit.especialMensaje,
      aportacionAcumulada: toNumberOr(edit.aportacionAcumulada, 0),
    };

    if (especialCartelUrl && especialCartelUrl.trim()) {
      payload.especialCartelUrl = especialCartelUrl.trim();
    }

    const r = await fetch(`/api/lugares/${edit.id}${adminQuery}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const d = await r.json();
    if (!r.ok) {
      alert(d?.error || "Error al guardar");
      return;
    }

    alert("✅ Lugar actualizado");
    router.push(`/lugares${adminQuery}`); // vuelve al listado respetando tenant
  };

  if (!edit) {
    return <div className="p-6 text-slate-200">Cargando lugar…</div>;
  }

  // ✅ ID único para el checkbox (evita colisiones si algún día reusas componente)
  const idEspecial = `edit-especial-${edit.id}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 md:px-8 py-8 text-slate-50">
      <div className="w-full max-w-[1200px] mx-auto space-y-6 text-[15px] md:text-[16px] font-semibold">
        {/* Cabecera */}
        <header className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
              alt="Impulso Energético"
              width={150}
              height={44}
              className="hidden md:block"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Editar lugar</h1>
              <p className="text-slate-300 font-semibold">
                #{edit.id} · {edit.nombre}
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold h-10 px-5"
              onClick={() => router.back()}
            >
              ← Volver
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-10 px-6"
              onClick={guardar}
            >
              Guardar cambios
            </Button>
          </div>
        </header>

        {/* KPIs */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
          <h3 className="text-base font-extrabold">Ficha directiva</h3>
          <p className="text-sm text-slate-300 font-semibold">KPIs ejecutivos</p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                Leads (7 días)
              </div>
              <div className="mt-2 text-2xl font-extrabold">
                {kpisLoading ? "…" : kpis.leads7d}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                Comparativas (mes)
              </div>
              <div className="mt-2 text-2xl font-extrabold">
                {kpisLoading ? "…" : kpis.comparativasMes}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                Ahorro total
              </div>
              <div className="mt-2 text-2xl font-extrabold">
                {kpisLoading ? "…" : eur(kpis.ahorroTotal)}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                Comisión total
              </div>
              <div className="mt-2 text-2xl font-extrabold">
                {kpisLoading ? "…" : eur(kpis.comisionTotal)}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditTab("basico")}
            className={classNames(
              "px-3 h-9 rounded-xl text-sm font-extrabold border transition",
              editTab === "basico"
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900/40"
            )}
          >
            🧾 Datos básicos
          </button>

          <button
            type="button"
            onClick={() => setEditTab("qr")}
            className={classNames(
              "px-3 h-9 rounded-xl text-sm font-extrabold border transition",
              editTab === "qr"
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900/40"
            )}
          >
            🔳 QR
          </button>

          <button
            type="button"
            onClick={() => setEditTab("especial")}
            className={classNames(
              "px-3 h-9 rounded-xl text-sm font-extrabold border transition",
              editTab === "especial"
                ? "bg-emerald-900/25 border-emerald-700/40 text-emerald-100"
                : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900/40"
            )}
          >
            ⭐ Lugar especial
          </button>
        </div>

        {/* Contenido tabs */}
        {editTab === "basico" && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-extrabold">Nombre</label>
                <Input
                  value={edit.nombre}
                  onChange={(e) => setEdit({ ...edit, nombre: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-extrabold">Dirección</label>
                <Input
                  value={edit.direccion}
                  onChange={(e) => setEdit({ ...edit, direccion: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-extrabold">% Cliente</label>
                <Input
                  inputMode="decimal"
                  value={edit.pctCliente ?? ""}
                  onChange={(e) => setEdit({ ...edit, pctCliente: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-extrabold">% Lugar</label>
                <Input
                  inputMode="decimal"
                  value={edit.pctLugar ?? ""}
                  onChange={(e) => setEdit({ ...edit, pctLugar: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="text-xs text-slate-300 font-extrabold">Agente</label>
                <select
                  className="mt-1 w-full border rounded-lg px-3 bg-slate-900 border-slate-700 text-slate-100 text-sm h-11 font-semibold"
                  value={String(edit.agenteId ?? "")}
                  onChange={(e) => setEdit({ ...edit, agenteId: e.target.value })}
                >
                  <option value="">Selecciona un agente…</option>
                  {agentes.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 text-sm text-slate-300 font-semibold">
              % Cliente: <span className="font-extrabold text-emerald-300">{fmtPct(edit.pctCliente)}</span>{" "}
              · % Lugar: <span className="font-extrabold text-emerald-300">{fmtPct(edit.pctLugar)}</span>
            </div>
          </section>
        )}

        {editTab === "qr" && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-2">
                <label className="text-xs text-slate-300 font-extrabold">Código QR (texto)</label>
                <div className="mt-1 flex flex-col sm:flex-row gap-3">
                  <Input
                    value={edit.qrCode ?? ""}
                    onChange={(e) => setEdit({ ...edit, qrCode: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                  />
                  <Button
                    type="button"
                    onClick={generarQR}
                    className="bg-sky-500 text-slate-950 hover:bg-sky-400 font-extrabold h-11 px-5"
                  >
                    Generar QR nuevo
                  </Button>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 font-semibold">
                  Si lo cambias, el QR antiguo dejará de apuntar a este lugar.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col items-center">
                <div className="text-xs text-slate-400 font-extrabold mb-3">QR de Landing</div>
                <div className="rounded-xl border border-slate-800 bg-white p-3">
                  <QRCode
                    value={`https://impulsoenergetico.es/registro?agenteId=${edit.agenteId}&lugarId=${edit.id}`}
                    size={120}
                  />
                </div>
                <Button
                  type="button"
                  className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-10 px-4"
                  onClick={() =>
                    window.open(`/registro?agenteId=${edit.agenteId}&lugarId=${edit.id}`, "_blank")
                  }
                >
                  Abrir Landing
                </Button>
              </div>
            </div>
          </section>
        )}

        {editTab === "especial" && (
          <section className="rounded-3xl border border-emerald-700/40 bg-emerald-900/15 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-extrabold text-emerald-100">Lugar especial</h3>

              {/* ✅ FIX: id único + label htmlFor correcto */}
              <label htmlFor={idEspecial} className="flex items-center gap-2 text-sm text-slate-100 font-extrabold">
                <input
                  id={idEspecial}
                  type="checkbox"
                  checked={!!edit.especial}
                  onChange={(e) => setEdit({ ...edit, especial: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-500 bg-slate-900"
                />
                Activar modo especial
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <label className="text-xs text-slate-300 font-extrabold">Logo (subir para actualizar)</label>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-start gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setEditLogoFile(f);
                      if (logoPreview) URL.revokeObjectURL(logoPreview);
                      setLogoPreview(f ? URL.createObjectURL(f) : null);
                    }}
                    className="text-xs text-slate-200 font-semibold"
                  />

                  <div className="sm:ml-auto">
                    <div className="text-[11px] text-slate-400 font-extrabold mb-2">Vista previa</div>
                    <div className="w-32 h-32 rounded-2xl border border-slate-700 bg-slate-900/60 overflow-hidden grid place-items-center">
                      {logoPreview || edit.especialLogoUrl ? (
                        <Image
                          src={(logoPreview || edit.especialLogoUrl) as string}
                          alt="logo"
                          width={160}
                          height={160}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="text-xs text-slate-500 font-semibold">Sin logo</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <label className="text-xs text-slate-300 font-extrabold">Cartel especial (reemplazar)</label>
                <div className="mt-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setEditCartelFile(f);
                      if (cartelPreview) URL.revokeObjectURL(cartelPreview);
                      setCartelPreview(f ? URL.createObjectURL(f) : null);
                    }}
                    className="text-xs text-slate-200 font-semibold"
                  />
                </div>

                <div className="mt-3">
                  <div className="text-[11px] text-slate-400 font-extrabold mb-2">Vista previa</div>
                  <div className="relative rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-slate-950 to-transparent z-20" />
                    <div className="w-full aspect-[3/4] bg-slate-950 grid place-items-center relative z-10">
                      {cartelPreview || edit.especialCartelUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(cartelPreview || edit.especialCartelUrl) as string}
                          alt="cartel"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-slate-500 font-semibold">Sin cartel</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <label className="text-xs text-slate-300 font-extrabold">Color de acento</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={edit.especialColor ?? "#FF7A3B"}
                    onChange={(e) => setEdit({ ...edit, especialColor: e.target.value })}
                    className="h-11 w-20 rounded border border-slate-700"
                  />
                  <Input
                    value={edit.especialColor ?? ""}
                    onChange={(e) => setEdit({ ...edit, especialColor: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <label className="text-xs text-slate-300 font-extrabold">Aportación acumulada (€)</label>
                <Input
                  inputMode="numeric"
                  value={String(edit.aportacionAcumulada ?? 0)}
                  onChange={(e) => setEdit({ ...edit, aportacionAcumulada: e.target.value })}
                  className="mt-2 bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                />
              </div>

              <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <label className="text-xs text-slate-300 font-extrabold">Mensaje / gancho</label>
                <Input
                  value={edit.especialMensaje ?? ""}
                  onChange={(e) => setEdit({ ...edit, especialMensaje: e.target.value })}
                  className="mt-2 bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
