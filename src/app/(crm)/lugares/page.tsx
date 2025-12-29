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
const fmtPct = (v: any) =>
  v == null ? "—" : `${(Number(v) * 100).toFixed(1)}%`;
const toNumberOr = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

type Fondo = { id: number; nombre: string; url: string; activo?: boolean };
type Lugar = any;
type Admin = { id: number; nombre: string; email: string };

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

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
    isSuperadmin && tenantMode && adminIdContext
      ? `?adminId=${adminIdContext}`
      : "";

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
  const [fondoSeleccionado, setFondoSeleccionado] = useState<string>("");

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
            const res = await fetch(
              `/api/agentes?adminId=${adminSeleccionado}`,
              { cache: "no-store" }
            );
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
          (session?.user as any)?.name ||
          (session?.user as any)?.nombre ||
          "Agente";
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
        const res = await fetch(`/api/lugares${adminQuery}`, {
          cache: "no-store",
        });
        const json = await res.json();
        lugaresData = Array.isArray(json) ? json : [];
      } catch {
        lugaresData = [];
      }

      let fondosData: any[] = [];
      try {
        const res = await fetch("/api/fondos");
        const json = await res.json();
        fondosData = Array.isArray(json) ? json : [];
      } catch {
        fondosData = [];
      }

      setLugares(lugaresData);
      setFondos(fondosData);

      const activo = fondosData.find((f: Fondo) => f.activo);
      if (activo) setFondoSeleccionado(activo.url);
    })();
  }, [session, role, adminQuery]);

  // ---- Listado filtrado (por cualquier campo visible) ----
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

  // ---- Subida de ficheros (upload genérico) ----
  async function subirFichero(file: File, folder: string): Promise<string | null> {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const r = await fetch("/api/uploads", { method: "POST", body: form });
      if (!r.ok) {
        const msg = await r.text().catch(() => "");
        alert(
          `Error al subir fichero (${r.status}): ${msg || "sin detalle"}`
        );
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

    // 🔴 Validación SUPERADMIN GLOBAL (no tenant)
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

    // (opcional, no molesta aunque el backend no lo use)
    if (isSuperadmin && !tenantMode && adminSeleccionado) {
      body.adminSeleccionado = adminSeleccionado;
    }

    if (especialCartelUrl && especialCartelUrl.trim()) {
      body.especialCartelUrl = especialCartelUrl.trim();
    }

    // 👇 AQUÍ VIENE LA CLAVE: construimos la query ?adminId=...
    let queryForPost = "";

    if (isSuperadmin) {
      if (tenantMode && adminIdContext) {
        // SUPERADMIN en modo tenant -> usamos el admin del tenant
        queryForPost = `?adminId=${adminIdContext}`;
      } else if (!tenantMode && adminSeleccionado) {
        // SUPERADMIN global creando desde el desplegable
        queryForPost = `?adminId=${adminSeleccionado}`;
      }
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

    // reset
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

  // ---- Edición (modal) ----
  const abrirEdicion = (l: Lugar) => {
    setEditLogoFile(null);
    setEditCartelFile(null);
    setLogoPreview(null);
    setCartelPreview(null);

    setEdit({
      ...l,
      especial: !!l.especial,
      especialColor: l.especialColor ?? "#FF7A3B",
      especialMensaje: l.especialMensaje ?? "",
      aportacionAcumulada: l.aportacionAcumulada ?? 0,
      especialCartelUrl: l.especialCartelUrl ?? "",
    });
    setModalAbierto(true);
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
    const r = await fetch(`/api/lugares/${id}${adminQuery}`, {
      method: "DELETE",
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      alert(d?.error || "Error al eliminar lugar");
      return;
    }
    setLugares((arr) => arr.filter((x) => x.id !== id));
  };

  const seleccionarFondo = async (id: number, url: string) => {
    await fetch("/api/fondos/seleccionar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setFondoSeleccionado(url);
  };

  // ───────────────────────────────
  // RENDER
  // ───────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-8 py-10 text-slate-50">
      <div className="w-full max-w-[1700px] mx-auto space-y-8">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-fuchsia-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Image
                src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                alt="Impulso Energético"
                width={140}
                height={40}
                className="hidden md:block"
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                  Gestión de lugares
                </h1>
                <p className="text-sm md:text-base text-slate-300 max-w-2xl font-medium">
                  Crea, edita y controla todos los lugares vinculados a tus
                  agentes y códigos QR.
                </p>
                {tenantMode && (
                  <p className="text-xs md:text-sm text-emerald-300 mt-1 font-semibold">
                    Modo tenant · viendo lugares del admin #{adminIdContext}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 text-xs md:text-sm">
              <span className="text-slate-400 font-semibold">
                Total lugares:{" "}
                <span className="font-bold text-emerald-300">
                  {lugares.length}
                </span>
              </span>
              <Input
                placeholder="Buscar por ID, nombre, dirección, agente, % o estado…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-80 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm"
              />
              <Button
                onClick={() => router.push(withTenant("/dashboard"))}
                className="mt-1 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold px-5 py-2"
              >
                🏠 Volver al dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* ALTA DE LUGAR */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-8 py-6">
          <h2 className="text-xl font-bold mb-4">Crear nuevo lugar</h2>

          <form onSubmit={registrarLugar} className="space-y-4">
            {/* SUPERADMIN: selector de ADMIN propietario */}
            {isSuperadmin && (
              <div className="mb-4">
                <label className="text-xs text-slate-300 font-semibold">
                  Admin propietario del lugar
                </label>
                <select
                  className="mt-1 w-full md:w-1/2 border rounded-lg p-2 bg-slate-900 border-slate-700 text-slate-100 text-sm"
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
                  <p className="text-[11px] text-emerald-300 mt-1">
                    Fijado por modo tenant (admin #{adminSeleccionado})
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Nombre
                </label>
                <Input
                  value={nuevo.nombre}
                  onChange={(e) =>
                    setNuevo((s) => ({ ...s, nombre: e.target.value }))
                  }
                  placeholder="Nombre del lugar"
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Dirección
                </label>
                <Input
                  value={nuevo.direccion}
                  onChange={(e) =>
                    setNuevo((s) => ({ ...s, direccion: e.target.value }))
                  }
                  placeholder="Dirección"
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  % Cliente (ej. 15 o 0.15)
                </label>
                <Input
                  inputMode="decimal"
                  value={nuevo.pctCliente}
                  onChange={(e) =>
                    setNuevo((s) => ({ ...s, pctCliente: e.target.value }))
                  }
                  placeholder="15  ó  0.15"
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  % Lugar (ej. 10 o 0.10)
                </label>
                <Input
                  inputMode="decimal"
                  value={nuevo.pctLugar}
                  onChange={(e) =>
                    setNuevo((s) => ({ ...s, pctLugar: e.target.value }))
                  }
                  placeholder="10  ó  0.10"
                  className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Código QR
                </label>
                <div className="flex gap-3 items-center mt-1">
                  <Input
                    value={nuevo.qrCode}
                    onChange={(e) =>
                      setNuevo((s) => ({ ...s, qrCode: e.target.value }))
                    }
                    placeholder="Se genera automáticamente si lo prefieres"
                    className="bg-slate-900 border-slate-700 text-slate-100"
                  />
                  <Button
                    type="button"
                    onClick={generarQR_nuevo}
                    className="bg-sky-500 text-slate-950 hover:bg-sky-400 font-semibold"
                  >
                    Generar QR
                  </Button>
                  {nuevoQR && (
                    <QRCode
                      value={`https://impulsoenergetico.es/registro?agenteId=${nuevo.agenteId}&lugarId=__ID__`}
                      size={44}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Agente
                </label>
                <select
                  className="mt-1 w-full border rounded-lg p-2 bg-slate-900 border-slate-700 text-slate-100 text-sm"
                  value={nuevo.agenteId}
                  onChange={(e) =>
                    setNuevo((s) => ({ ...s, agenteId: e.target.value }))
                  }
                  required
                  disabled={isAgente}
                >
                  <option value="">
                    {isAgente
                      ? "Tu usuario de agente"
                      : "Selecciona un agente…"}
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
            <fieldset className="mt-6 border border-emerald-700/40 rounded-2xl p-4 bg-emerald-900/20">
              <legend className="px-2 text-xs font-bold text-emerald-300 uppercase tracking-wide">
                Lugar especial (club, asociación, evento…)
              </legend>

              <div className="flex items-center gap-3 mb-3">
                <input
                  id="nuevo-especial"
                  type="checkbox"
                  checked={nuevo.especial}
                  onChange={(e) =>
                    setNuevo((s) => ({ ...s, especial: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-500 bg-slate-900"
                />
                <label
                  htmlFor="nuevo-especial"
                  className="text-sm text-slate-200"
                >
                  Marcar como lugar especial
                </label>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">
                    Logo del club / asociación
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNuevo((s) => ({
                        ...s,
                        logoFile: e.target.files?.[0] || null,
                      }))
                    }
                    className="mt-1 text-xs text-slate-200"
                  />
                  {nuevo.logoFile && (
                    <p className="text-[11px] text-emerald-300 mt-1">
                      Se subirá al guardar
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold">
                    Cartel especial (reemplazar)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNuevo((s) => ({
                        ...s,
                        cartelFile: e.target.files?.[0] || null,
                      }))
                    }
                    className="mt-1 text-xs text-slate-200"
                  />
                  {nuevo.cartelFile && (
                    <p className="text-[11px] text-emerald-300 mt-1">
                      Se subirá al guardar
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold">
                    Color de acento
                  </label>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      type="color"
                      value={nuevo.especialColor}
                      onChange={(e) =>
                        setNuevo((s) => ({
                          ...s,
                          especialColor: e.target.value,
                        }))
                      }
                      className="h-10 w-16 rounded border border-slate-700"
                    />
                    <Input
                      value={nuevo.especialColor}
                      onChange={(e) =>
                        setNuevo((s) => ({
                          ...s,
                          especialColor: e.target.value,
                        }))
                      }
                      className="bg-slate-900 border-slate-700 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold">
                    Aportación acumulada (€)
                  </label>
                  <Input
                    inputMode="numeric"
                    value={nuevo.aportacionAcumulada}
                    onChange={(e) =>
                      setNuevo((s) => ({
                        ...s,
                        aportacionAcumulada: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-slate-300 font-semibold">
                    Mensaje / gancho
                  </label>
                  <Input
                    value={nuevo.especialMensaje}
                    onChange={(e) =>
                      setNuevo((s) => ({
                        ...s,
                        especialMensaje: e.target.value,
                      }))
                    }
                    placeholder='Ej.: "AYUDA A TU CLUB"'
                    className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                  />
                </div>
              </div>
            </fieldset>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-8 py-2"
              >
                Registrar lugar
              </Button>
            </div>
          </form>
        </section>


        {/* LISTADO */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-8 py-6 space-y-4">
          <h2 className="text-xl font-bold mb-2">Lugares registrados</h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-[13px] md:text-[15px]">
              <thead className="bg-slate-900/80 text-slate-300">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold">ID</th>
                  <th className="px-3 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-3 py-3 text-left font-semibold">
                    Dirección
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Agente</th>
                  <th className="px-3 py-3 text-left font-semibold">
                    % Cliente
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">
                    % Lugar
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">
                    Estado
                  </th>
                  <th className="px-3 py-3 text-right font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {lugaresFiltrados.map((l: any) => (
                  <tr
                    key={l.id}
                    className="border-t border-slate-800/70 hover:bg-slate-900/80"
                  >
                    <td className="px-3 py-3 font-mono text-xs md:text-sm text-slate-400 font-semibold">
                      #{l.id}
                    </td>
                    <td className="px-3 py-3 text-slate-50 font-semibold">
                      {l.nombre}
                    </td>
                    <td className="px-3 py-3 text-slate-200">
                      {l.direccion}
                    </td>
                    <td className="px-3 py-3 text-slate-200">
                      {l.agente?.nombre || "—"}
                    </td>
                    <td className="px-3 py-3 text-emerald-300 font-semibold">
                      {fmtPct(l.pctCliente)}
                    </td>
                    <td className="px-3 py-3 text-emerald-300 font-semibold">
                      {fmtPct(l.pctLugar)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${
                          l.especial
                            ? "bg-pink-500/20 text-pink-200 border border-pink-500/40"
                            : "bg-slate-700/40 text-slate-200 border border-slate-500/40"
                        }`}
                        title={l.especial ? "Lugar especial" : "Lugar normal"}
                      >
                        {l.especial ? "Especial" : "Normal"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end flex-wrap gap-2">
                        {(isAdmin || isSuperadmin) && (
                          <Button
                            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold px-3 py-1"
                            onClick={() => abrirEdicion(l)}
                            size="sm"
                          >
                            Editar
                          </Button>
                        )}
                        <Button
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1"
                          onClick={() =>
                            router.push(
                              withTenant(`/lugares/${l.id}/detalle`)
                            )
                          }
                          size="sm"
                        >
                          Ver
                        </Button>
                        <Button
                          className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold px-3 py-1"
                          onClick={() =>
                            router.push(withTenant(`/lugares/cartel/${l.id}`))
                          }
                          size="sm"
                        >
                          Cartel A4
                        </Button>
                        <Button
                          className={`text-slate-50 ${
                            l.especial
                              ? "bg-teal-500 hover:bg-teal-400"
                              : "bg-teal-700/40 cursor-not-allowed"
                          } font-semibold px-3 py-1`}
                          disabled={!l.especial}
                          onClick={() =>
                            router.push(
                              withTenant(`/lugares/cartel-especial/${l.id}`)
                            )
                          }
                          size="sm"
                          title={
                            l.especial
                              ? "Abrir cartel especial"
                              : "Sólo para lugares especiales"
                          }
                        >
                          Cartel especial
                        </Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1"
                          onClick={() =>
                            window.open(
                              `/registro?agenteId=${l.agenteId}&lugarId=${l.id}`,
                              "_blank"
                            )
                          }
                          size="sm"
                        >
                          Landing
                        </Button>
                        {(isAdmin || isSuperadmin) && (
                          <Button
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1"
                            onClick={() => eliminarLugar(l.id)}
                            size="sm"
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {lugaresFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-slate-400 text-sm"
                    >
                      No hay lugares para los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Fondo actual (solo ADMIN, como ya tenías) */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-lg font-bold mb-3">
              🎨 Fondo global actual para carteles
            </h3>
            {isAdmin ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {fondos.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => seleccionarFondo(f.id, f.url)}
                      className={`cursor-pointer border-4 rounded-xl overflow-hidden transition-all hover:scale-105 ${
                        f.url === fondoSeleccionado
                          ? "border-emerald-500"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        src={f.url}
                        alt={f.nombre}
                        width={400}
                        height={200}
                        className="w-full h-40 object-cover"
                      />
                      <div className="bg-slate-950/80 py-1 text-center font-medium text-slate-100 text-sm">
                        {f.nombre}
                      </div>
                    </div>
                  ))}
                </div>
                {fondoSeleccionado && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">
                      Vista previa del fondo activo:
                    </p>
                    <Image
                      src={fondoSeleccionado}
                      alt="Fondo seleccionado"
                      width={700}
                      height={460}
                      className="rounded-lg border border-slate-700"
                    />
                  </div>
                )}
              </>
            ) : (
              fondoSeleccionado && (
                <div className="text-center">
                  <Image
                    src={fondoSeleccionado}
                    alt="Fondo"
                    width={700}
                    height={460}
                    className="rounded-lg border border-slate-700 mx-auto"
                  />
                </div>
              )
            )}
          </div>
        </section>
      </div>

      {/* MODAL EDICIÓN */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="w-[95vw] max-w-[1100px] p-0">
          <DialogHeader className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800">
            <DialogTitle className="p-4 text-slate-50">
              Editar lugar
            </DialogTitle>
          </DialogHeader>

          {!!edit && (
            <div className="max-h-[82vh] overflow-y-auto p-6 text-slate-50 bg-slate-950">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6">
                  <label className="text-xs text-slate-300 font-semibold">
                    Nombre
                  </label>
                  <Input
                    value={edit.nombre}
                    onChange={(e) =>
                      setEdit({ ...edit, nombre: e.target.value })
                    }
                    className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className="text-xs text-slate-300 font-semibold">
                    Dirección
                  </label>
                  <Input
                    value={edit.direccion}
                    onChange={(e) =>
                      setEdit({ ...edit, direccion: e.target.value })
                    }
                    className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                  />
                </div>

                <div className="col-span-6">
                  <label className="text-xs text-slate-300 font-semibold">
                    % Cliente (ej. 15 o 0.15)
                  </label>
                  <Input
                    inputMode="decimal"
                    value={edit.pctCliente ?? ""}
                    onChange={(e) =>
                      setEdit({ ...edit, pctCliente: e.target.value })
                    }
                    className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                  />
                </div>

                <div className="col-span-6">
                  <label className="text-xs text-slate-300 font-semibold">
                    % Lugar (ej. 10 o 0.10)
                  </label>
                  <Input
                    inputMode="decimal"
                    value={edit.pctLugar ?? ""}
                    onChange={(e) =>
                      setEdit({ ...edit, pctLugar: e.target.value })
                    }
                    className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                  />
                </div>

                <div className="col-span-12">
                  <label className="text-xs text-slate-300 font-semibold">
                    Código QR
                  </label>
                  <div className="flex items-center gap-3 mt-1">
                    <Input
                      value={edit.qrCode ?? ""}
                      onChange={(e) =>
                        setEdit({ ...edit, qrCode: e.target.value })
                      }
                      className="bg-slate-900 border-slate-700 text-slate-100"
                    />
                    <Button
                      type="button"
                      onClick={generarQR_edit}
                      className="bg-sky-500 text-slate-950 hover:bg-sky-400 font-semibold"
                    >
                      Generar QR
                    </Button>
                    {edit.qrCode && (
                      <QRCode
                        value={`https://impulsoenergetico.es/registro?agenteId=${edit.agenteId}&lugarId=${edit.id}`}
                        size={44}
                      />
                    )}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className="text-xs text-slate-300 font-semibold">
                    Agente
                  </label>
                  <select
                    className="mt-1 w-full border rounded-lg p-2 bg-slate-900 border-slate-700 text-slate-100 text-sm"
                    value={edit.agenteId}
                    onChange={(e) =>
                      setEdit({ ...edit, agenteId: Number(e.target.value) })
                    }
                  >
                    <option value="">Selecciona un agente…</option>
                    {agentes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ESPECIAL */}
              <fieldset className="border border-emerald-700/40 rounded-2xl p-4 bg-emerald-900/20 mt-5">
                <legend className="px-2 text-xs font-bold text-emerald-300 uppercase tracking-wide">
                  Lugar especial
                </legend>

                <div className="flex items-center gap-3 mb-4">
                  <input
                    id="edit-especial"
                    type="checkbox"
                    checked={!!edit.especial}
                    onChange={(e) =>
                      setEdit({ ...edit, especial: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-500 bg-slate-900"
                  />
                  <label htmlFor="edit-especial" className="text-sm">
                    Marcar como especial
                  </label>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-4">
                    <label className="text-xs text-slate-300 font-semibold">
                      Logo (subir para actualizar)
                    </label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setEditLogoFile(f);
                          setLogoPreview(f ? URL.createObjectURL(f) : null);
                        }}
                        className="text-xs text-slate-200"
                      />
                      {(logoPreview || edit.especialLogoUrl) && (
                        <Image
                          src={logoPreview || edit.especialLogoUrl}
                          alt="logo"
                          width={56}
                          height={56}
                          className="rounded border border-slate-600"
                        />
                      )}
                    </div>
                    {editLogoFile && (
                      <p className="text-[11px] text-emerald-300 mt-1">
                        Se subirá al guardar
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <label className="text-xs text-slate-300 font-semibold">
                      Cartel especial (reemplazar)
                    </label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setEditCartelFile(f);
                          setCartelPreview(f ? URL.createObjectURL(f) : null);
                        }}
                        className="text-xs text-slate-200"
                      />
                    </div>
                    {(cartelPreview || edit.especialCartelUrl) && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cartelPreview || edit.especialCartelUrl}
                          alt="cartel"
                          className="w-40 h-24 object-cover rounded border border-slate-600"
                        />
                      </div>
                    )}
                    {editCartelFile && (
                      <p className="text-[11px] text-emerald-300 mt-1">
                        Se subirá al guardar
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <label className="text-xs text-slate-300 font-semibold">
                      Color de acento
                    </label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="color"
                        value={edit.especialColor ?? "#FF7A3B"}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            especialColor: e.target.value,
                          })
                        }
                        className="h-10 w-16 rounded border border-slate-700"
                      />
                      <Input
                        value={edit.especialColor ?? ""}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            especialColor: e.target.value,
                          })
                        }
                        className="bg-slate-900 border-slate-700 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <label className="text-xs text-slate-300 font-semibold">
                      Aportación acumulada (€)
                    </label>
                    <Input
                      inputMode="numeric"
                      value={String(edit.aportacionAcumulada ?? 0)}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          aportacionAcumulada: e.target.value,
                        })
                      }
                      className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-8">
                    <label className="text-xs text-slate-300 font-semibold">
                      Mensaje / gancho
                    </label>
                    <Input
                      value={edit.especialMensaje ?? ""}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          especialMensaje: e.target.value,
                        })
                      }
                      placeholder='Ej.: "AYUDA A TU CLUB"'
                      className="mt-1 bg-slate-900 border-slate-700 text-slate-100"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={guardarEdicion}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
                >
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

