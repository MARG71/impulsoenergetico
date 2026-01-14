"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Image from "next/image";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

type Item = {
  id: number;
  creadoEn: string;
  tipo: "A4_QR" | "ESPECIAL";
  accion: "IMPRIMIR" | "DESCARGAR_PDF" | "DESCARGAR_PNG";
  fondoUrlSnap?: string | null;
  qrUrlSnap?: string | null;
  archivoUrl?: string | null;

  fondo?: { id: number; nombre: string; url: string } | null;
  creadoPor?: { id: number; nombre: string; email: string; rol: Rol } | null;
  lugar?: { id: number; nombre: string; direccion: string } | null;
};

function pillClass(tipo: Item["tipo"]) {
  return tipo === "A4_QR"
    ? "bg-sky-500/15 text-sky-200 border-sky-500/40"
    : "bg-pink-500/15 text-pink-200 border-pink-500/40";
}

function accionTxt(a: Item["accion"]) {
  return a === "IMPRIMIR" ? "Imprimir" : a === "DESCARGAR_PDF" ? "Descargar PDF" : "Descargar PNG";
}

function tipoTxt(t: Item["tipo"]) {
  return t === "A4_QR" ? "A4 con QR" : "Cartel especial";
}

function toEsDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES");
  } catch {
    return iso;
  }
}

function includesQ(haystack: string, q: string) {
  return haystack.toLowerCase().includes(q.toLowerCase());
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  // CSV RFC-ish: wrap with quotes if needed and escape quotes
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function HistorialCartelesLugar() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";

  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;
  const tenantMode =
    isSuperadmin &&
    typeof adminIdContext === "number" &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  const withTenant = (href: string) => {
    if (!tenantMode || !adminIdContext) return href;
    if (!href.startsWith("/")) return href;
    const hasQuery = href.includes("?");
    return `${href}${hasQuery ? "&" : "?"}adminId=${adminIdContext}`;
  };

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros “server” (API)
  const [filtroTipo, setFiltroTipo] = useState<"" | "A4_QR" | "ESPECIAL">("");
  const [filtroAccion, setFiltroAccion] = useState<
    "" | "IMPRIMIR" | "DESCARGAR_PDF" | "DESCARGAR_PNG"
  >("");

  // filtro “client” (texto)
  const [q, setQ] = useState("");

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
    const txt = q.trim().toLowerCase();
    if (!txt) return items;

    return items.filter((it) => {
      const fecha = toEsDateTime(it.creadoEn);
      const fondoNombre = it.fondo?.nombre ?? "";
      const tipo = tipoTxt(it.tipo);
      const accion = accionTxt(it.accion);

      // buscamos por: tipo, acción, fecha, nombre del fondo, id, y (si eres superadmin) actor
      const actor = isSuperadmin ? (it.creadoPor?.nombre ?? it.creadoPor?.email ?? "") : "";

      const hay = [
        `#${it.id}`,
        fecha,
        tipo,
        accion,
        fondoNombre,
        it.fondoUrlSnap ?? "",
        it.qrUrlSnap ?? "",
        actor,
      ].join(" ");

      return includesQ(hay, txt);
    });
  }, [items, q, isSuperadmin]);

  const exportarCSV = () => {
    const rows = itemsFiltrados.map((it) => {
      const fecha = toEsDateTime(it.creadoEn);
      const fondoNombre = it.fondo?.nombre ?? "";
      const actor = isSuperadmin ? (it.creadoPor?.nombre ?? it.creadoPor?.email ?? "") : ""; // oculto para no superadmin

      return {
        id: it.id,
        fecha,
        tipo: tipoTxt(it.tipo),
        accion: accionTxt(it.accion),
        fondo: fondoNombre,
        fondoUrl: it.fondoUrlSnap ?? "",
        qrUrl: it.qrUrlSnap ?? "",
        usuario: actor, // quedará vacío si no es superadmin
      };
    });

    const headers = ["id", "fecha", "tipo", "accion", "fondo", "fondoUrl", "qrUrl", "usuario"];
    const csv =
      headers.join(";") +
      "\n" +
      rows
        .map((r) => headers.map((h) => csvEscape((r as any)[h])).join(";"))
        .join("\n");

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTextFile(`historial_carteles_lugar_${id}_${stamp}.csv`, csv);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-6 md:px-8 py-8 text-slate-50">
      <div className="w-full max-w-[1200px] mx-auto space-y-6 text-[15px] md:text-[16px] font-semibold">
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
                <p className="text-sm md:text-base text-slate-300 max-w-2xl font-semibold">
                  Registro de impresiones y descargas para este lugar.
                </p>
                {tenantMode && (
                  <p className="text-xs md:text-sm text-emerald-300 mt-1 font-bold">
                    Modo tenant · viendo como admin #{adminIdContext}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end">
              <Button
                onClick={() => router.push(withTenant("/lugares"))}
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
                onClick={exportarCSV}
                className="bg-sky-500 text-slate-950 hover:bg-sky-400 font-extrabold h-10 px-5"
                disabled={loading || itemsFiltrados.length === 0}
                title={itemsFiltrados.length === 0 ? "No hay registros para exportar" : "Exportar a CSV"}
              >
                ⬇️ Exportar CSV
              </Button>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6 space-y-4">
          {/* FILTROS */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="border rounded-xl px-3 py-2 bg-slate-900 border-slate-700 text-slate-100 text-sm h-10 font-semibold"
              >
                <option value="">Todos los tipos</option>
                <option value="A4_QR">A4 con QR</option>
                <option value="ESPECIAL">Especial</option>
              </select>

              <select
                value={filtroAccion}
                onChange={(e) => setFiltroAccion(e.target.value as any)}
                className="border rounded-xl px-3 py-2 bg-slate-900 border-slate-700 text-slate-100 text-sm h-10 font-semibold"
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
                className="border rounded-xl px-3 py-2 bg-slate-900 border-slate-700 text-slate-100 text-sm h-10 font-semibold w-full sm:w-[340px] placeholder:text-slate-500"
              />

              {q.trim() ? (
                <Button
                  onClick={() => setQ("")}
                  className="bg-slate-200 text-slate-950 hover:bg-slate-300 font-extrabold h-10 px-4"
                >
                  ✖ Limpiar
                </Button>
              ) : null}
            </div>

            <div className="text-sm text-slate-300 font-semibold">
              {loading ? "Cargando..." : "Registros:"}{" "}
              <span className="font-extrabold text-emerald-300">
                {loading ? "…" : itemsFiltrados.length}
              </span>
              {!loading && itemsFiltrados.length !== items.length ? (
                <span className="text-slate-400 font-semibold">
                  {" "}
                  (filtrado de {items.length})
                </span>
              ) : null}
            </div>
          </div>

          {itemsFiltrados.length === 0 && !loading ? (
            <div className="text-slate-300 py-10 text-center font-semibold">
              No hay registros con estos filtros.
            </div>
          ) : null}

          {/* LISTA */}
          <div className="space-y-3">
            {itemsFiltrados.map((it) => {
              const fecha = toEsDateTime(it.creadoEn);
              const fondoNombre =
                it.fondo?.nombre ?? (it.fondoUrlSnap ? "Fondo (snapshot)" : "—");

              const t = tipoTxt(it.tipo);
              const a = accionTxt(it.accion);

              return (
                <div
                  key={it.id}
                  className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                  {/* IZQUIERDA */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${pillClass(
                          it.tipo
                        )}`}
                      >
                        {t}
                      </span>
                      <span className="text-slate-100 font-extrabold">— {a}</span>
                      <span className="text-xs font-extrabold text-slate-500">
                        #{it.id}
                      </span>
                    </div>

                    <div className="text-sm text-slate-300">
                      <span className="font-extrabold text-slate-200">Fecha:</span> {fecha}
                      {" · "}
                      <span className="font-extrabold text-slate-200">Fondo:</span>{" "}
                      {fondoNombre}
                      {/* ✅ Usuario: solo SUPERADMIN lo ve; para otros, oculto del todo */}
                      {isSuperadmin && it.creadoPor ? (
                        <>
                          {" · "}
                          <span className="font-extrabold text-slate-200">Usuario:</span>{" "}
                          {it.creadoPor.nombre || it.creadoPor.email}
                        </>
                      ) : null}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {it.fondoUrlSnap ? (
                        <a
                          href={it.fondoUrlSnap}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-extrabold px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-900"
                        >
                          Ver fondo usado
                        </a>
                      ) : null}

                      {it.archivoUrl ? (
                        <a
                            href={it.archivoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-extrabold px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-900"
                        >
                            📄 Ver / Descargar PDF
                        </a>
                      ) : null}


                      {it.qrUrlSnap ? (
                        <a
                          href={it.qrUrlSnap}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-extrabold px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-900"
                        >
                          Abrir link QR
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {/* DERECHA: miniaturas (Fondo + QR) */}
                  <div className="flex gap-3 flex-wrap justify-start lg:justify-end">
                    {/* Fondo */}
                    {it.fondoUrlSnap ? (
                      <a
                        href={it.fondoUrlSnap}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0"
                        title="Ver fondo usado"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.fondoUrlSnap}
                          alt="Miniatura fondo"
                          className="w-40 h-24 object-cover rounded-xl border border-slate-800 shadow"
                          crossOrigin="anonymous"
                        />
                      </a>
                    ) : (
                      <div className="shrink-0 w-40 h-24 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-xs text-slate-500 font-extrabold">
                        Sin fondo
                      </div>
                    )}

                    {/* QR preview */}
                    {it.qrUrlSnap ? (
                      <a
                        href={it.qrUrlSnap}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0"
                        title="Abrir link QR"
                      >
                        <div className="w-24 h-24 rounded-xl border border-slate-800 bg-white flex items-center justify-center shadow">
                          {/* usamos un servicio de QR por URL para preview rápido */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                              it.qrUrlSnap
                            )}`}
                            alt="QR preview"
                            className="w-[84px] h-[84px] object-contain"
                          />
                        </div>
                      </a>
                    ) : (
                      <div className="shrink-0 w-24 h-24 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-xs text-slate-500 font-extrabold">
                        Sin QR
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nota */}
          <div className="text-[12px] text-slate-400 font-semibold pt-2">
            Tip: El historial se genera automáticamente cuando imprimes o descargas un cartel.
          </div>
        </section>
      </div>
    </div>
  );
}
