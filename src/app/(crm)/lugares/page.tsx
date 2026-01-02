"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";

// --------- Helpers ----------
const fmtPct = (v: any) => (v == null ? "—" : `${(Number(v) * 100).toFixed(1)}%`);

const toNumberOr = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const eur = (n: any) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(
    Number.isFinite(Number(n)) ? Number(n) : 0
  );

type Fondo = { id: number; nombre: string; url: string; activo?: boolean };
type Lugar = any;
type Admin = { id: number; nombre: string; email: string };
type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

type KpisLugar = {
  leads7d: number;
  comparativasMes: number;
  ahorroTotal: number;
  comisionTotal: number;
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// Normaliza respuesta de /api/lugares/[id]/detalle
function normalizeKpis(raw: any): KpisLugar {
  const src = raw?.kpisGlobal ?? raw?.kpis ?? raw?.kpi ?? raw ?? {};
  return {
    leads7d: Number(src?.leads7d ?? 0) || 0,
    comparativasMes: Number(src?.comparativasMes ?? 0) || 0,
    ahorroTotal: Number(src?.ahorroTotal ?? 0) || 0,
    comisionTotal: Number(src?.comisionTotal ?? 0) || 0,
  };
}

export default function RegistrarLugar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";
  const isAgente = role === "AGENTE";

  // ✅ tenant sólo para SUPERADMIN con ?adminId=
  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;
  const tenantMode =
    isSuperadmin &&
    typeof adminIdContext === "number" &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  const adminQuery =
    isSuperadmin && tenantMode && adminIdContext ? `?adminId=${adminIdContext}` : "";

  const withTenant = (href: string) => {
    if (!tenantMode || !adminIdContext) return href;
    if (!href.startsWith("/")) return href;
    const hasQuery = href.includes("?");
    return `${href}${hasQuery ? "&" : "?"}adminId=${adminIdContext}`;
  };

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminSeleccionado, setAdminSeleccionado] = useState<string>("");

  const [agentes, setAgentes] = useState<any[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [fondos, setFondos] = useState<Fondo[]>([]);
  const [fondoSeleccionadoId, setFondoSeleccionadoId] = useState<number | null>(
    null
  );

  const fondoSeleccionadoUrl = useMemo(() => {
    if (!fondoSeleccionadoId) return "";
    return fondos.find((f) => f.id === fondoSeleccionadoId)?.url ?? "";
  }, [fondos, fondoSeleccionadoId]);

  // Listado/búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Alta
  const [nuevoQR, setNuevoQR] = useState("");
  const [nuevo, setNuevo] = useState({
    nombre: "",
    direccion: "",
    qrCode: "",
    adminId: "", // 👈 para SUPERADMIN
    agenteId: "",
    pctCliente: "",
    pctLugar: "",
    especial: false,
    especialColor: "#FF7A3B",
    especialMensaje: "",
    aportacionAcumulada: "0",
    logoFile: null as File | null,
    especialLogoUrl: "",
    cartelFile: null as File | null,
    especialCartelUrl: "",
  });

  // Edición (modal)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [edit, setEdit] = useState<Lugar | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editCartelFile, setEditCartelFile] = useState<File | null>(null);

  // Previews en edición
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cartelPreview, setCartelPreview] = useState<string | null>(null);

  // UI pestañas modal
  const [editTab, setEditTab] = useState<"basico" | "qr" | "especial">("basico");

  // KPI modal (ficha directiva)
  const [kpisModal, setKpisModal] = useState<KpisLugar>({
    leads7d: 0,
    comparativasMes: 0,
    ahorroTotal: 0,
    comisionTotal: 0,
  });
  const [kpisModalLoading, setKpisModalLoading] = useState(false);

  const cargarKpisLugar = async (lugarId: number) => {
    try {
      setKpisModalLoading(true);
      // ✅ Endpoint de detalle
      const res = await fetch(`/api/lugares/${lugarId}/detalle${adminQuery}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Detalle no disponible (${res.status})`);
      const raw = await res.json();
      setKpisModal(normalizeKpis(raw));
    } catch (e) {
      // Silencioso pero consistente
      setKpisModal({
        leads7d: 0,
        comparativasMes: 0,
        ahorroTotal: 0,
        comisionTotal: 0,
      });
    } finally {
      setKpisModalLoading(false);
    }
  };

  // ───────────────────────────────
  // 1) Cargar admins (solo SUPERADMIN)
  // ───────────────────────────────
  useEffect(() => {
    if (!session || !isSuperadmin) return;

    (async () => {
      try {
        const res = await fetch("/api/admins", { cache: "no-store" });
        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];
        setAdmins(lista);

        if (tenantMode && adminIdContext) {
          setAdminSeleccionado(String(adminIdContext));
          setNuevo((s) => ({ ...s, adminId: String(adminIdContext) }));
        } else if (lista.length > 0) {
          setAdminSeleccionado(String(lista[0].id));
          setNuevo((s) => ({ ...s, adminId: String(lista[0].id) }));
        }
      } catch (err) {
        console.error("Error cargando admins:", err);
        setAdmins([]);
      }
    })();
  }, [session, isSuperadmin, tenantMode, adminIdContext]);

  // ───────────────────────────────
  // 2) Cargar agentes en función del rol
  // ───────────────────────────────
  useEffect(() => {
    if (!session || !role) return;

    (async () => {
      let agentesData: any[] = [];

      if (isSuperadmin) {
        if (adminSeleccionado) {
          try {
            const res = await fetch(`/api/agentes?adminId=${adminSeleccionado}`, {
              cache: "no-store",
            });
            const json = await res.json();
            agentesData = Array.isArray(json) ? json : [];
          } catch {
            agentesData = [];
          }
        } else {
          agentesData = [];
        }
      } else if (isAdmin) {
        try {
          const res = await fetch(`/api/agentes`, { cache: "no-store" });
          const json = await res.json();
          agentesData = Array.isArray(json) ? json : [];
        } catch {
          agentesData = [];
        }
      } else if (isAgente) {
        const agenteId = (session?.user as any)?.agenteId;
        const nombreAgente =
          (session?.user as any)?.name || (session?.user as any)?.nombre || "Agente";
        if (agenteId) {
          agentesData = [{ id: agenteId, nombre: nombreAgente }];
          setNuevo((s) => ({ ...s, agenteId: String(agenteId) }));
        }
      }

      setAgentes(agentesData);
    })();
  }, [session, role, isSuperadmin, isAdmin, isAgente, adminSeleccionado]);

  // ───────────────────────────────
  // 3) Cargar lugares + fondos
  // ───────────────────────────────
  useEffect(() => {
    if (!session || !role) return;

    (async () => {
      let lugaresData: any[] = [];
      try {
        const res = await fetch(`/api/lugares${adminQuery}`, { cache: "no-store" });
        const json = await res.json();
        lugaresData = Array.isArray(json) ? json : [];
      } catch {
        lugaresData = [];
      }

      let fondosData: any[] = [];
      try {
        const res = await fetch("/api/fondos", { cache: "no-store" });
        const json = await res.json();
        fondosData = Array.isArray(json) ? json : [];
      } catch {
        fondosData = [];
      }

      setLugares(lugaresData);
      setFondos(fondosData);

      const activo = fondosData.find((f: Fondo) => f.activo);
      if (activo?.id) setFondoSeleccionadoId(activo.id);
    })();
  }, [session, role, adminQuery]);

  // ---- Listado filtrado ----
  const lugaresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lugares;
    return lugares.filter((l: any) => {
      const estado = l.especial ? "especial" : "normal";
      const txt = [
        `#${l.id}`,
        l.nombre ?? "",
        l.direccion ?? "",
        l.agente?.nombre ?? "",
        fmtPct(l.pctCliente),
        fmtPct(l.pctLugar),
        estado,
      ].join(" ");
      return txt.toLowerCase().includes(q);
    });
  }, [lugares, busqueda]);

  // ---- Subida de ficheros ----
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

  // ---- Alta (nuevo) ----
  const generarQR_nuevo = () => {
    const id = uuidv4();
    setNuevo((s) => ({ ...s, qrCode: id }));
    setNuevoQR(id);
  };

  const registrarLugar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSuperadmin && !tenantMode && !adminSeleccionado) {
      alert("Selecciona un ADMIN propietario para el lugar.");
      return;
    }

    let especialLogoUrl = nuevo.especialLogoUrl;
    if (nuevo.especial && nuevo.logoFile) {
      const up = await subirFichero(nuevo.logoFile, "logos-lugares");
      if (up) especialLogoUrl = up;
    }

    let especialCartelUrl = nuevo.especialCartelUrl;
    if (nuevo.especial && nuevo.cartelFile) {
      const up = await subirFichero(nuevo.cartelFile, "carteles-especiales");
      if (up) especialCartelUrl = up;
    }

    const body: any = {
      nombre: nuevo.nombre.trim(),
      direccion: nuevo.direccion.trim(),
      qrCode: nuevo.qrCode.trim(),
      agenteId: nuevo.agenteId,
      pctCliente: nuevo.pctCliente,
      pctLugar: nuevo.pctLugar,
      especial: nuevo.especial,
      especialLogoUrl,
      especialColor: nuevo.especialColor,
      especialMensaje: nuevo.especialMensaje,
      aportacionAcumulada: toNumberOr(nuevo.aportacionAcumulada, 0),
    };

    if (isSuperadmin && !tenantMode && adminSeleccionado) {
      body.adminSeleccionado = adminSeleccionado;
    }

    if (especialCartelUrl && especialCartelUrl.trim()) {
      body.especialCartelUrl = especialCartelUrl.trim();
    }

    let queryForPost = "";
    if (isSuperadmin) {
      if (tenantMode && adminIdContext) queryForPost = `?adminId=${adminIdContext}`;
      else if (!tenantMode && adminSeleccionado) queryForPost = `?adminId=${adminSeleccionado}`;
    }

    const r = await fetch(`/api/lugares${queryForPost}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const d = await r.json();
    if (!r.ok) {
      alert(d?.error || "Error al crear lugar");
      return;
    }

    setLugares((arr) => [d, ...arr]);

    setNuevo({
      nombre: "",
      direccion: "",
      qrCode: "",
      adminId: isSuperadmin ? nuevo.adminId : "",
      agenteId: "",
      pctCliente: "",
      pctLugar: "",
      especial: false,
      especialColor: "#FF7A3B",
      especialMensaje: "",
      aportacionAcumulada: "0",
      logoFile: null,
      especialLogoUrl: "",
      cartelFile: null,
      especialCartelUrl: "",
    });
    setNuevoQR("");
  };

  // ---- Edición ----
  const abrirEdicion = (l: Lugar) => {
    setEditLogoFile(null);
    setEditCartelFile(null);
    setLogoPreview(null);
    setCartelPreview(null);
    setEditTab("basico");

    setEdit({
      ...l,
      especial: !!l.especial,
      especialColor: l.especialColor ?? "#FF7A3B",
      especialMensaje: l.especialMensaje ?? "",
      aportacionAcumulada: l.aportacionAcumulada ?? 0,
      especialCartelUrl: l.especialCartelUrl ?? "",
      especialLogoUrl: l.especialLogoUrl ?? "",
    });

    setModalAbierto(true);

    // ✅ Cargar KPIs del lugar al abrir modal
    if (l?.id) cargarKpisLugar(Number(l.id));
  };

  const generarQR_edit = () => {
    if (!edit) return;
    const id = uuidv4();
    setEdit({ ...edit, qrCode: id });
  };

  const guardarEdicion = async () => {
    if (!edit) return;

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
      agenteId: edit.agenteId,
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

    setLugares((arr) => arr.map((x) => (x.id === d.id ? d : x)));
    setModalAbierto(false);
  };

  const eliminarLugar = async (id: number) => {
    if (!confirm("¿Eliminar lugar (se ocultará para el admin)?")) return;
    const r = await fetch(`/api/lugares/${id}${adminQuery}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(d?.error || "Error al eliminar lugar");
      return;
    }
    setLugares((arr) => arr.filter((x) => x.id !== id));
  };

  const seleccionarFondo = async (id: number) => {
    const r = await fetch("/api/fondos/seleccionar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert(d?.error || "No se pudo seleccionar el fondo");
      return;
    }

    setFondoSeleccionadoId(id);

    // refrescar flags activo
    try {
      const res = await fetch("/api/fondos", { cache: "no-store" });
      const json = await res.json();
      setFondos(Array.isArray(json) ? json : []);
    } catch {}
  };

  // ───────────────────────────────
  // RENDER
  // ───────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 md:px-8 py-8 text-slate-50">
      {/* ⬇️ Tipografía general más grande y más “director” */}
      <div className="w-full max-w-[1700px] mx-auto space-y-8 text-[15px] md:text-[16px] font-semibold">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-fuchsia-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-6 md:px-8 py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4">
              <Image
                src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                alt="Impulso Energético"
                width={150}
                height={44}
                className="hidden md:block"
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                  Gestión de lugares
                </h1>
                <p className="text-sm md:text-base text-slate-300 max-w-2xl font-semibold">
                  Crea, edita y controla todos los lugares vinculados a tus agentes y códigos QR.
                </p>
                {tenantMode && (
                  <p className="text-xs md:text-sm text-emerald-300 mt-1 font-bold">
                    Modo tenant · viendo lugares del admin #{adminIdContext}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-2">
              <div className="text-sm text-slate-300 font-semibold">
                Total lugares:{" "}
                <span className="font-extrabold text-emerald-300">{lugares.length}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Input
                  placeholder="Buscar por ID, nombre, dirección, agente, % o estado…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full sm:w-[360px] bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm h-10 font-semibold"
                />
                <Button
                  onClick={() => router.push(withTenant("/dashboard"))}
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold px-5 h-10"
                >
                  🏠 Volver al dashboard
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* ALTA DE LUGAR */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6">
          <h2 className="text-xl font-extrabold mb-4">Crear nuevo lugar</h2>

          <form onSubmit={registrarLugar} className="space-y-4">
            {/* SUPERADMIN: selector de ADMIN propietario */}
            {isSuperadmin && (
              <div className="mb-4">
                <label className="text-xs text-slate-300 font-extrabold">
                  Admin propietario del lugar
                </label>
                <select
                  className="mt-1 w-full lg:w-1/2 border rounded-lg p-2 bg-slate-900 border-slate-700 text-slate-100 text-sm h-10 font-semibold"
                  value={adminSeleccionado}
                  onChange={(e) => {
                    setAdminSeleccionado(e.target.value);
                    setNuevo((s) => ({ ...s, adminId: e.target.value }));
                  }}
                  disabled={tenantMode}
                >
                  <option value="">Selecciona un admin…</option>
                  {admins.map((ad) => (
                    <option key={ad.id} value={ad.id}>
                      {ad.nombre} ({ad.email})
                    </option>
                  ))}
                </select>
                {tenantMode && adminSeleccionado && (
                  <p className="text-[11px] text-emerald-300 mt-1 font-bold">
                    Fijado por modo tenant (admin #{adminSeleccionado})
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-slate-300 font-extrabold">Nombre</label>
                <Input
                  value={nuevo.nombre}
                  onChange={(e) => setNuevo((s) => ({ ...s, nombre: e.target.value }))}
                  placeholder="Nombre del lugar"
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-10 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-extrabold">Dirección</label>
                <Input
                  value={nuevo.direccion}
                  onChange={(e) => setNuevo((s) => ({ ...s, direccion: e.target.value }))}
                  placeholder="Dirección"
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-10 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-extrabold">
                  % Cliente (ej. 15 o 0.15)
                </label>
                <Input
                  inputMode="decimal"
                  value={nuevo.pctCliente}
                  onChange={(e) => setNuevo((s) => ({ ...s, pctCliente: e.target.value }))}
                  placeholder="15  ó  0.15"
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-10 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-extrabold">
                  % Lugar (ej. 10 o 0.10)
                </label>
                <Input
                  inputMode="decimal"
                  value={nuevo.pctLugar}
                  onChange={(e) => setNuevo((s) => ({ ...s, pctLugar: e.target.value }))}
                  placeholder="10  ó  0.10"
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-10 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-extrabold">Código QR</label>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mt-1">
                  <Input
                    value={nuevo.qrCode}
                    onChange={(e) => setNuevo((s) => ({ ...s, qrCode: e.target.value }))}
                    placeholder="Se genera automáticamente si lo prefieres"
                    className="bg-slate-900 border-slate-700 text-slate-100 h-10 font-semibold"
                  />
                  <Button
                    type="button"
                    onClick={generarQR_nuevo}
                    className="bg-sky-500 text-slate-950 hover:bg-sky-400 font-extrabold h-10 px-5"
                  >
                    Generar QR
                  </Button>

                  {nuevoQR && (
                    <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 px-3">
                      <QRCode value={`https://impulsoenergetico.es/registro`} size={44} />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                  (El QR definitivo se usa desde el lugar ya creado con el botón “Landing”.)
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-extrabold">Agente</label>
                <select
                  className="mt-1 w-full border rounded-lg p-2 bg-slate-900 border-slate-700 text-slate-100 text-sm h-10 font-semibold"
                  value={nuevo.agenteId}
                  onChange={(e) => setNuevo((s) => ({ ...s, agenteId: e.target.value }))}
                  required
                  disabled={isAgente}
                >
                  <option value="">
                    {isAgente ? "Tu usuario de agente" : "Selecciona un agente…"}
                  </option>
                  {agentes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* LUGAR ESPECIAL */}
            <fieldset className="mt-6 border border-emerald-700/40 rounded-2xl p-5 bg-emerald-900/20">
              <legend className="px-2 text-xs font-extrabold text-emerald-300 uppercase tracking-wide">
                Lugar especial (club, asociación, evento…)
              </legend>

              <div className="flex items-center gap-3 mb-4">
                <input
                  id="nuevo-especial"
                  type="checkbox"
                  checked={nuevo.especial}
                  onChange={(e) => setNuevo((s) => ({ ...s, especial: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-500 bg-slate-900"
                />
                <label htmlFor="nuevo-especial" className="text-sm text-slate-200 font-bold">
                  Marcar como lugar especial
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-extrabold">
                    Logo del club / asociación
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNuevo((s) => ({ ...s, logoFile: e.target.files?.[0] || null }))
                    }
                    className="mt-2 text-xs text-slate-200 font-semibold"
                  />
                  {nuevo.logoFile && (
                    <p className="text-[11px] text-emerald-300 mt-1 font-bold">
                      Se subirá al guardar
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-extrabold">
                    Cartel especial (reemplazar)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNuevo((s) => ({ ...s, cartelFile: e.target.files?.[0] || null }))
                    }
                    className="mt-2 text-xs text-slate-200 font-semibold"
                  />
                  {nuevo.cartelFile && (
                    <p className="text-[11px] text-emerald-300 mt-1 font-bold">
                      Se subirá al guardar
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-extrabold">Color de acento</label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      value={nuevo.especialColor}
                      onChange={(e) => setNuevo((s) => ({ ...s, especialColor: e.target.value }))}
                      className="h-10 w-16 rounded border border-slate-700"
                    />
                    <Input
                      value={nuevo.especialColor}
                      onChange={(e) => setNuevo((s) => ({ ...s, especialColor: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-slate-100 h-10 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-extrabold">Aportación acumulada (€)</label>
                  <Input
                    inputMode="numeric"
                    value={nuevo.aportacionAcumulada}
                    onChange={(e) => setNuevo((s) => ({ ...s, aportacionAcumulada: e.target.value }))}
                    placeholder="0"
                    className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-10 font-semibold"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="text-xs text-slate-300 font-extrabold">Mensaje / gancho</label>
                  <Input
                    value={nuevo.especialMensaje}
                    onChange={(e) => setNuevo((s) => ({ ...s, especialMensaje: e.target.value }))}
                    placeholder='Ej.: "AYUDA A TU CLUB"'
                    className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-10 font-semibold"
                  />
                </div>
              </div>
            </fieldset>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-8 h-11"
              >
                Registrar lugar
              </Button>
            </div>
          </form>
        </section>

        {/* LISTADO */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <h2 className="text-xl font-extrabold">Lugares registrados</h2>
            <div className="text-sm text-slate-300 font-semibold">
              Mostrando:{" "}
              <span className="font-extrabold text-slate-100">{lugaresFiltrados.length}</span>{" "}
              / {lugares.length}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-[14px] md:text-[15px]">
              <thead className="bg-slate-900/80 text-slate-200">
                <tr className="font-extrabold">
                  <th className="px-3 py-3 text-left">ID</th>
                  <th className="px-3 py-3 text-left">Nombre</th>
                  <th className="px-3 py-3 text-left">Dirección</th>
                  <th className="px-3 py-3 text-left">Agente</th>
                  <th className="px-3 py-3 text-left">% Cliente</th>
                  <th className="px-3 py-3 text-left">% Lugar</th>
                  <th className="px-3 py-3 text-left">Estado</th>
                  <th className="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {lugaresFiltrados.map((l: any) => {
                  const especial = !!l.especial;

                  return (
                    <tr
                      key={l.id}
                      className="border-t border-slate-800/70 hover:bg-slate-900/70"
                    >
                      <td className="px-3 py-4 font-mono text-xs md:text-sm text-slate-400 font-extrabold">
                        #{l.id}
                      </td>

                      <td className="px-3 py-4">
                        <div className="text-slate-50 font-extrabold leading-tight">
                          {l.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-semibold">
                          QR:{" "}
                          <span className="font-mono">
                            {String(l.qrCode || "").slice(0, 10)}…
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-slate-200 font-semibold">{l.direccion}</td>

                      <td className="px-3 py-4 text-slate-200">
                        <div className="font-extrabold">{l.agente?.nombre || "—"}</div>
                        {l.agente?.email && (
                          <div className="text-[11px] text-slate-400 font-semibold">
                            {l.agente.email}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 text-emerald-300 font-extrabold">
                        {fmtPct(l.pctCliente)}
                      </td>
                      <td className="px-3 py-4 text-emerald-300 font-extrabold">
                        {fmtPct(l.pctLugar)}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={classNames(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border",
                            especial
                              ? "bg-pink-500/15 text-pink-200 border-pink-500/40"
                              : "bg-slate-700/30 text-slate-200 border-slate-500/40"
                          )}
                        >
                          {especial ? "⭐ Especial" : "Normal"}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex justify-end">
                          {/* ✅ grid fijo para que nunca se “apriete” raro */}
                          <div className="grid grid-cols-2 gap-2 w-[320px]">
                            {(isAdmin || isSuperadmin) && (
                              <Button
                                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold h-9"
                                onClick={() => abrirEdicion(l)}
                                size="sm"
                              >
                                ✏️ Editar
                              </Button>
                            )}

                            <Button
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-9"
                              onClick={() => router.push(withTenant(`/lugares/${l.id}/detalle`))}
                              size="sm"
                            >
                              👁️ Ver
                            </Button>

                            <Button
                              className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold h-9"
                              onClick={() => router.push(withTenant(`/lugares/cartel/${l.id}`))}
                              size="sm"
                            >
                              🖨️ Cartel A4
                            </Button>

                            <Button
                              className={classNames(
                                "font-extrabold h-9",
                                especial
                                  ? "bg-teal-500 hover:bg-teal-400 text-slate-950"
                                  : "bg-teal-700/30 text-slate-400 border border-slate-700 cursor-not-allowed"
                              )}
                              disabled={!especial}
                              onClick={() => router.push(withTenant(`/lugares/cartel-especial/${l.id}`))}
                              size="sm"
                              title={especial ? "Abrir cartel especial" : "Solo para lugares especiales"}
                            >
                              🧩 Cartel especial
                            </Button>

                            <Button
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-9"
                              onClick={() =>
                                window.open(`/registro?agenteId=${l.agenteId}&lugarId=${l.id}`, "_blank")
                              }
                              size="sm"
                            >
                              🔗 Landing
                            </Button>

                            {(isAdmin || isSuperadmin) ? (
                              <Button
                                className="bg-red-600 hover:bg-red-700 text-white font-extrabold h-9"
                                onClick={() => eliminarLugar(l.id)}
                                size="sm"
                              >
                                🗑️ Eliminar
                              </Button>
                            ) : (
                              <div />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {lugaresFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm font-semibold">
                      No hay lugares para los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Fondo global */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-lg font-extrabold mb-3">🎨 Fondo global actual para carteles</h3>

            {isAdmin ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {fondos.map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => seleccionarFondo(f.id)}
                      className={classNames(
                        "text-left cursor-pointer border-2 rounded-xl overflow-hidden transition-all hover:scale-[1.02]",
                        f.id === fondoSeleccionadoId ? "border-emerald-500" : "border-slate-800"
                      )}
                      title="Seleccionar como fondo global"
                    >
                      <Image
                        src={f.url}
                        alt={f.nombre}
                        width={500}
                        height={260}
                        className="w-full h-44 object-cover"
                      />
                      <div className="bg-slate-950/80 py-2 px-3">
                        <div className="font-extrabold text-slate-100 text-sm">{f.nombre}</div>
                        {f.activo && (
                          <div className="text-[11px] text-emerald-300 font-extrabold mt-0.5">
                            Activo
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {!!fondoSeleccionadoUrl && (
                  <div className="mt-5">
                    <p className="font-extrabold mb-2">Vista previa del fondo activo:</p>
                    <Image
                      src={fondoSeleccionadoUrl}
                      alt="Fondo seleccionado"
                      width={900}
                      height={560}
                      className="rounded-lg border border-slate-700"
                    />
                  </div>
                )}
              </>
            ) : (
              !!fondoSeleccionadoUrl && (
                <div className="text-center">
                  <Image
                    src={fondoSeleccionadoUrl}
                    alt="Fondo"
                    width={900}
                    height={560}
                    className="rounded-lg border border-slate-700 mx-auto"
                  />
                </div>
              )
            )}
          </div>
        </section>
      </div>

      {/* MODAL EDICIÓN — con los 3 tabs completos */}
      <Dialog
        open={modalAbierto}
        onOpenChange={(v) => {
          setModalAbierto(v);
          if (!v) {
            setEdit(null);
            setEditLogoFile(null);
            setEditCartelFile(null);
            setLogoPreview(null);
            setCartelPreview(null);
            setEditTab("basico");
          }
        }}
      >
        <DialogContent className="w-[96vw] max-w-[1200px] p-0 overflow-hidden max-h-[90vh]">
          <DialogHeader className="bg-slate-950 border-b border-slate-800">
            <DialogTitle className="px-6 py-4 text-slate-50 flex items-center justify-between">
              <span className="text-base md:text-lg font-extrabold">Editar lugar</span>
              {edit?.id ? (
                <span className="text-xs md:text-sm text-slate-400 font-mono font-extrabold">
                  #{edit.id}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {!!edit && (
            <div className="bg-slate-950 text-slate-50 text-[15px] md:text-[16px] font-semibold">
              {/* ✅ FICHA DIRECTIVA (KPIs) — dentro del modal */}
              <div className="px-6 pt-5">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-white">
                        Ficha directiva del lugar
                      </h3>
                      <p className="text-sm font-semibold text-slate-300">
                        KPIs ejecutivos (7 días / mes / acumulado)
                      </p>
                    </div>

                    {/* Logo del CRM (seguro, sin solape) */}
                    <div className="relative z-20">
                      <Image
                        src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                        alt="Impulso Energético"
                        width={140}
                        height={40}
                        className="h-10 w-auto object-contain opacity-95"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                        Leads (7 días)
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-white">
                        {kpisModalLoading ? "…" : kpisModal.leads7d}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        Captación reciente
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                        Comparativas (mes)
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-white">
                        {kpisModalLoading ? "…" : kpisModal.comparativasMes}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        Actividad mensual
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                        Ahorro total
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-white">
                        {kpisModalLoading ? "…" : eur(kpisModal.ahorroTotal)}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        Acumulado (€)
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                        Comisión total
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-white">
                        {kpisModalLoading ? "…" : eur(kpisModal.comisionTotal)}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        Acumulado (€)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-4">
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
              </div>

              {/* Body scroll */}
              <div className="overflow-y-auto px-6 py-5 max-h-[70vh]">
                {/* TAB: BASICO */}
                {editTab === "basico" && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
                      <h3 className="text-sm font-extrabold text-slate-200 mb-4">
                        Información principal
                      </h3>

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
                          <label className="text-xs text-slate-300 font-extrabold">
                            % Cliente (ej. 15 o 0.15)
                          </label>
                          <Input
                            inputMode="decimal"
                            value={edit.pctCliente ?? ""}
                            onChange={(e) => setEdit({ ...edit, pctCliente: e.target.value })}
                            className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 font-extrabold">
                            % Lugar (ej. 10 o 0.10)
                          </label>
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
                            value={edit.agenteId}
                            onChange={(e) => setEdit({ ...edit, agenteId: Number(e.target.value) })}
                          >
                            <option value="">Selecciona un agente…</option>
                            {agentes.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.nombre}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                            Recomendación: asigna el agente correcto para trazabilidad de leads y comparativas.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
                      <h3 className="text-sm font-extrabold text-slate-200 mb-4">Resumen visual</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                          <div className="text-xs text-slate-400 font-extrabold">Estado</div>
                          <div className="mt-1">
                            <span
                              className={classNames(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border",
                                edit.especial
                                  ? "bg-pink-500/15 text-pink-200 border-pink-500/40"
                                  : "bg-slate-700/30 text-slate-200 border-slate-500/40"
                              )}
                            >
                              {edit.especial ? "⭐ Especial" : "Normal"}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                          <div className="text-xs text-slate-400 font-extrabold">% Cliente</div>
                          <div className="mt-1 text-emerald-300 font-extrabold text-lg">
                            {fmtPct(edit.pctCliente)}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                          <div className="text-xs text-slate-400 font-extrabold">% Lugar</div>
                          <div className="mt-1 text-emerald-300 font-extrabold text-lg">
                            {fmtPct(edit.pctLugar)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: QR */}
                {editTab === "qr" && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
                      <h3 className="text-sm font-extrabold text-slate-200 mb-4">Código QR</h3>

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
                              onClick={generarQR_edit}
                              className="bg-sky-500 text-slate-950 hover:bg-sky-400 font-extrabold h-11 px-5"
                            >
                              Generar QR nuevo
                            </Button>
                          </div>

                          <p className="text-[11px] text-slate-400 mt-2 font-semibold">
                            Esto identifica el lugar. Si lo cambias, el QR antiguo dejará de apuntar a este lugar.
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
                              window.open(
                                `/registro?agenteId=${edit.agenteId}&lugarId=${edit.id}`,
                                "_blank"
                              )
                            }
                          >
                            Abrir Landing
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: ESPECIAL */}
                {editTab === "especial" && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-emerald-700/40 bg-emerald-900/15 p-5">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <h3 className="text-sm font-extrabold text-emerald-100">Lugar especial</h3>

                        <label className="flex items-center gap-2 text-sm text-slate-100 font-extrabold">
                          <input
                            id="edit-especial"
                            type="checkbox"
                            checked={!!edit.especial}
                            onChange={(e) => setEdit({ ...edit, especial: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-500 bg-slate-900"
                          />
                          Activar modo especial
                        </label>
                      </div>

                      {/* ✅ Grid estable */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                        {/* LOGO (cuadrado fijo) */}
                        <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                          <label className="text-xs text-slate-300 font-extrabold">
                            Logo (subir para actualizar)
                          </label>

                          <div className="mt-3 flex flex-col sm:flex-row sm:items-start gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                setEditLogoFile(f);
                                setLogoPreview(f ? URL.createObjectURL(f) : null);
                              }}
                              className="text-xs text-slate-200 font-semibold"
                            />

                            <div className="sm:ml-auto">
                              <div className="text-[11px] text-slate-400 font-extrabold mb-2">
                                Vista previa
                              </div>

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

                          {editLogoFile && (
                            <p className="text-[11px] text-emerald-300 mt-2 font-extrabold">
                              Se subirá al guardar
                            </p>
                          )}
                        </div>

                        {/* CARTEL (frame vertical tipo A4) — FIX SOLAPE */}
                        <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                          <label className="text-xs text-slate-300 font-extrabold">
                            Cartel especial (reemplazar)
                          </label>

                          <div className="mt-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                setEditCartelFile(f);
                                setCartelPreview(f ? URL.createObjectURL(f) : null);
                              }}
                              className="text-xs text-slate-200 font-semibold"
                            />
                          </div>

                          <div className="mt-3">
                            <div className="text-[11px] text-slate-400 font-extrabold mb-2">
                              Vista previa
                            </div>

                            {/* ✅ Contenedor relativo + “zona segura” superior para evitar solapes */}
                            <div className="relative rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden">
                              {/* Zona segura (evita que cualquier overlay quede por encima visualmente) */}
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
                                  <div className="text-xs text-slate-500 font-semibold">
                                    Sin cartel
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {editCartelFile && (
                            <p className="text-[11px] text-emerald-300 mt-2 font-extrabold">
                              Se subirá al guardar
                            </p>
                          )}
                        </div>

                        {/* Color */}
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

                        {/* Aportación */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                          <label className="text-xs text-slate-300 font-extrabold">
                            Aportación acumulada (€)
                          </label>
                          <Input
                            inputMode="numeric"
                            value={String(edit.aportacionAcumulada ?? 0)}
                            onChange={(e) => setEdit({ ...edit, aportacionAcumulada: e.target.value })}
                            className="mt-2 bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                          />
                        </div>

                        {/* Mensaje */}
                        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                          <label className="text-xs text-slate-300 font-extrabold">Mensaje / gancho</label>
                          <Input
                            value={edit.especialMensaje ?? ""}
                            onChange={(e) => setEdit({ ...edit, especialMensaje: e.target.value })}
                            placeholder='Ej.: "AYUDA A TU CLUB"'
                            className="mt-2 bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                          />
                          <p className="text-[11px] text-slate-400 mt-2 font-semibold">
                            Consejo: corto y directo (ej. “Apoya al club con tu ahorro”).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer fijo */}
              <div className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="text-[12px] text-slate-400 font-semibold">
                  Tip: si algo está “apretado”, dime tu resolución/zoom y lo ajustamos fino.
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold h-10 px-5"
                    onClick={() => setModalAbierto(false)}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    onClick={guardarEdicion}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-10 px-6"
                  >
                    Guardar cambios
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
