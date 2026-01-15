"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import QRCode from "react-qr-code";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

type Item = {
  id: number;
  creadoEn: string;
  tipo: "A4_QR" | "ESPECIAL";
  accion: "IMPRIMIR" | "DESCARGAR_PDF" | "DESCARGAR_PNG";

  fondoUrlSnap?: string | null;
  qrUrlSnap?: string | null;

  // ✅ archivos generados (PDF / PNG) si los guardas
  archivoUrl?: string | null;
  archivoPublicId?: string | null;
  archivoResourceType?: string | null;
  archivoMime?: string | null;

  fondo?: { id: number; nombre: string; url: string } | null;
  creadoPor?: { id: number; nombre: string; email: string; rol: Rol } | null;
  lugar?: { id: number; nombre: string; direccion: string } | null;
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatFechaEs(v: string) {
  try {
    return new Date(v).toLocaleString("es-ES");
  } catch {
    return v;
  }
}

function accionLabel(a: Item["accion"]) {
  if (a === "IMPRIMIR") return "Imprimir";
  if (a === "DESCARGAR_PDF") return "Descargar PDF";
  return "Descargar PNG";
}

function tipoLabel(t: Item["tipo"]) {
  return t === "A4_QR" ? "A4 con QR" : "Cartel Especial";
}

function badgeTipo(t: Item["tipo"]) {
  return t === "A4_QR"
    ? "bg-sky-500/15 text-sky-200 border-sky-400/30"
    : "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30";
}

function badgeAccion(a: Item["accion"]) {
  return a === "IMPRIMIR"
    ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/30"
    : a === "DESCARGAR_PDF"
    ? "bg-blue-500/15 text-blue-200 border-blue-400/30"
    : "bg-orange-500/15 text-orange-200 border-orange-400/30";
}

function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

function escapeCsv(value: any) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function guessFilename(it: Item) {
  const ext =
    it.archivoMime?.includes("pdf") ? "pdf" :
    it.archivoMime?.includes("png") ? "png" :
    "pdf";
  return `cartel_${it.id}.${ext}`;
}

export default function HistorialCartelesLugar() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";

  const puedeBorrar = isSuperadmin || isAdmin;

  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;
  const tenantMode =
    isSuperadmin &&
    typeof adminIdContext === "number" &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroTipo, setFiltroTipo] = useState<"" | "A4_QR" | "ESPECIAL">("");
  const [filtroAccion, setFiltroAccion] = useState<
    "" | "IMPRIMIR" | "DESCARGAR_PDF" | "DESCARGAR_PNG"
  >("");
  const [q, setQ] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("lugarId", String(id));
    sp.set("limit", "200");
    if (filtroTipo) sp.set("tipo", filtroTipo);
    if (filtroAccion) sp.set("accion", filtroAccion);
    if (tenantMode && adminIdContext) sp.set("adminId", String(adminIdContext));
    return `/api/carteles?${sp.toString()}`;
  }, [id, filtroTipo, filtroAccion, tenantMode, adminIdContext]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(query, { cache: "no-store" });
        const d = await r.json();
        setItems(Array.isArray(d) ? d : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  const itemsFiltrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;

    return items.filter((it) => {
      const fondoNombre = it.fondo?.nombre ?? "";
      const fecha = formatFechaEs(it.creadoEn);
      const txt = [
        it.id,
        it.tipo,
        tipoLabel(it.tipo),
        it.accion,
        accionLabel(it.accion),
        fecha,
        fondoNombre,
        it.fondoUrlSnap ?? "",
        it.qrUrlSnap ?? "",
        it.archivoUrl ?? "",
        it.archivoPublicId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return txt.includes(t);
    });
  }, [items, q]);

  const volverLugaresHref =
    tenantMode && adminIdContext ? `/lugares?adminId=${adminIdContext}` : "/lugares";

  const exportarCsv = () => {
    const rows = itemsFiltrados.map((it) => ({
      id: it.id,
      creadoEn: formatFechaEs(it.creadoEn),
      tipo: tipoLabel(it.tipo),
      accion: accionLabel(it.accion),
      fondo: it.fondo?.nombre ?? "",
      fondoUrlSnap: it.fondoUrlSnap ?? "",
      qrUrlSnap: it.qrUrlSnap ?? "",
      archivoUrl: it.archivoUrl ?? "",
      archivoPublicId: it.archivoPublicId ?? "",
    }));

    const header = Object.keys(
      rows[0] ?? {
        id: "",
        creadoEn: "",
        tipo: "",
        accion: "",
        fondo: "",
        fondoUrlSnap: "",
        qrUrlSnap: "",
        archivoUrl: "",
        archivoPublicId: "",
      }
    );

    const csv =
      header.join(",") +
      "\n" +
      rows
        .map((r) => header.map((k) => escapeCsv((r as any)[k])).join(","))
        .join("\n");

    downloadText(`historial_carteles_lugar_${id}.csv`, csv, "text/csv;charset=utf-8");
  };

  const mostrarUsuario = (it: Item) => {
    // ✅ Solo el SUPERADMIN ve el usuario que lo generó
    if (!isSuperadmin) return null;
    const actor = it.creadoPor?.nombre ?? it.creadoPor?.email ?? "—";
    return (
      <span>
        <span className="font-extrabold text-slate-200">Usuario:</span> {actor}
      </span>
    );
  };

  // ✅ DESCARGA “A PRUEBA DE POPUPS”: fetch -> blob -> download
  const descargarArchivo = async (it: Item) => {
    const url = it.archivoUrl;
    if (!url) {
      alert("Este registro aún no tiene archivo guardado.");
      return;
    }

    try {
      setDownloadingId(it.id);

      // 1) Intento descarga directa blob
      const r = await fetch(url, { method: "GET" });
      if (!r.ok) throw new Error("No se pudo descargar el archivo.");

      const blob = await r.blob();
      const filename = guessFilename(it);

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 800);
    } catch (e) {
      // 2) Fallback: abrir en pestaña (por si CORS impide blob)
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) alert("Tu navegador bloqueó la descarga. Prueba permitiendo popups o usa otro navegador.");
    } finally {
      setDownloadingId(null);
    }
  };

  const eliminarCartel = async (it: Item) => {
    if (!puedeBorrar) return;

    const ok = confirm(
      `¿Eliminar este registro #${it.id}?\n\n` +
        `Si tiene archivo (Cloudinary), también se borrará.\n` +
        `Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    try {
      setDeletingId(it.id);

      const url =
        tenantMode && adminIdContext
          ? `/api/carteles/${it.id}?adminId=${adminIdContext}`
          : `/api/carteles/${it.id}`;

      const r = await fetch(url, { method: "DELETE" });
      const d = await r.json().catch(() => ({}));

      if (!r.ok) throw new Error(d?.error || "No se pudo eliminar");

      // ✅ optimista: quita de UI
      setItems((prev) => prev.filter((x) => x.id !== it.id));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error eliminando el cartel");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 md:px-8 py-8 text-slate-50">
      <div className="w-full max-w-[1300px] mx-auto space-y-6">
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
                  Historial de carteles
                </h1>
                <p className="text-sm md:text-base text-slate-300 font-semibold">
                  Registro de impresiones y descargas para este lugar.
                </p>
                {tenantMode && (
                  <p className="text-xs md:text-sm text-emerald-300 mt-1 font-bold">
                    Modo tenant · viendo como admin #{adminIdContext}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => router.push(volverLugaresHref)}
                className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold h-10 px-5"
              >
                📍 Volver a Lugares
              </Button>

              <Button
                onClick={() => router.back()}
                className="bg-slate-200 text-slate-950 hover:bg-slate-300 font-extrabold h-10 px-5"
              >
                ⬅ Volver
              </Button>

              <Button
                onClick={exportarCsv}
                className="bg-sky-500 text-slate-950 hover:bg-sky-400 font-extrabold h-10 px-5"
                disabled={loading || itemsFiltrados.length === 0}
              >
                ⬇️ Exportar CSV
              </Button>
            </div>
          </div>
        </header>

        {/* FILTROS */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="h-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 px-3 font-bold"
              >
                <option value="">Todos los tipos</option>
                <option value="A4_QR">A4 con QR</option>
                <option value="ESPECIAL">Especial</option>
              </select>

              <select
                value={filtroAccion}
                onChange={(e) => setFiltroAccion(e.target.value as any)}
                className="h-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 px-3 font-bold"
              >
                <option value="">Todas las acciones</option>
                <option value="IMPRIMIR">Imprimir</option>
                <option value="DESCARGAR_PDF">Descargar PDF</option>
                <option value="DESCARGAR_PNG">Descargar PNG</option>
              </select>

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por acción, tipo, fecha, fondo, id…"
                className="h-10 w-full sm:w-[360px] rounded-xl bg-slate-900 border border-slate-700 text-slate-100 px-3 font-semibold placeholder:text-slate-500"
              />
            </div>

            <div className="text-sm text-slate-300 font-semibold">
              {loading ? (
                "Cargando..."
              ) : (
                <>
                  Registros:{" "}
                  <span className="font-extrabold text-emerald-300">{itemsFiltrados.length}</span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* LISTA */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6">
          {itemsFiltrados.length === 0 && !loading ? (
            <div className="text-slate-300 py-10 text-center font-semibold">
              Aún no hay registros. Se crearán cuando imprimas o descargues un cartel.
            </div>
          ) : null}

          <div className="space-y-3">
            {itemsFiltrados.map((it) => {
              const fecha = formatFechaEs(it.creadoEn);
              const fondoNombre =
                it.fondo?.nombre ?? (it.fondoUrlSnap ? "Fondo usado (snapshot)" : "—");

              const showFondoThumb = !!it.fondoUrlSnap;
              const showQrThumb = !!it.qrUrlSnap;

              return (
                <div
                  key={it.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                  {/* IZQUIERDA */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={classNames(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border",
                          badgeTipo(it.tipo)
                        )}
                      >
                        {tipoLabel(it.tipo)}
                      </span>

                      <span
                        className={classNames(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border",
                          badgeAccion(it.accion)
                        )}
                      >
                        {accionLabel(it.accion)}
                      </span>

                      <span className="text-xs text-slate-400 font-extrabold">#{it.id}</span>
                    </div>

                    <div className="text-sm text-slate-200 font-semibold">
                      <span className="font-extrabold text-slate-100">Fecha:</span> {fecha}
                      {" · "}
                      <span className="font-extrabold text-slate-100">Fondo:</span> {fondoNombre}
                      {isSuperadmin ? (
                        <>
                          {" · "}
                          {mostrarUsuario(it)}
                        </>
                      ) : null}
                    </div>

                    <div className="flex gap-2 flex-wrap pt-1">
                      {it.fondoUrlSnap ? (
                        <a
                          href={it.fondoUrlSnap}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-extrabold px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-900"
                        >
                          Ver fondo usado
                        </a>
                      ) : null}

                      {it.qrUrlSnap ? (
                        <a
                          href={it.qrUrlSnap}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-extrabold px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-900"
                        >
                          Abrir link QR
                        </a>
                      ) : null}

                      {/* ✅ DESCARGAR (FIABLE) */}
                      {it.archivoUrl ? (
                        <Button
                          onClick={() => descargarArchivo(it)}
                          disabled={downloadingId === it.id}
                          className="h-9 px-4 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                          title="Descargar archivo guardado"
                        >
                          {downloadingId === it.id ? "Descargando..." : "📄 Descargar PDF"}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold px-1">
                          (Aún sin archivo guardado)
                        </span>
                      )}

                      {/* ✅ ELIMINAR */}
                      {puedeBorrar ? (
                        <Button
                          onClick={() => eliminarCartel(it)}
                          disabled={deletingId === it.id}
                          className="h-9 px-4 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                          title="Eliminar historial (y archivo si existe)"
                        >
                          {deletingId === it.id ? "Eliminando..." : "🗑️ Eliminar"}
                        </Button>
                      ) : null}
                    </div>

                    <div className="text-[12px] text-slate-400 font-semibold pt-1">
                      Tip: el historial se genera automáticamente cuando imprimes o descargas un cartel.
                    </div>
                  </div>

                  {/* DERECHA: miniaturas */}
                  <div className="flex items-center justify-end gap-3 flex-wrap">
                    {/* Mini fondo */}
                    {showFondoThumb ? (
                      <a
                        href={it.fondoUrlSnap!}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden w-[160px] h-[90px] hover:scale-[1.02] transition"
                        title="Ver fondo usado"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.fondoUrlSnap!}
                          alt="Fondo usado"
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      </a>
                    ) : (
                      <div className="w-[160px] h-[90px] rounded-2xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-[11px] text-slate-500 font-bold">
                        Sin miniatura
                      </div>
                    )}

                    {/* QR mini (solo visual) */}
                    {showQrThumb ? (
                      <div
                        className="rounded-2xl border border-slate-800 bg-white p-2 w-[90px] h-[90px] flex items-center justify-center"
                        title="QR (preview visual)"
                      >
                        <QRCode value={it.qrUrlSnap!} size={74} />
                      </div>
                    ) : (
                      <div className="w-[90px] h-[90px] rounded-2xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-[11px] text-slate-500 font-bold">
                        —
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
