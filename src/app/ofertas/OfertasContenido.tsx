"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Oferta = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  descripcionCorta?: string | null;
  tipo: string; // "LUZ" | "GAS" | "TELEFONIA" o string libre
  destacada: boolean;
  activa: boolean;
  creadaEn: string;
};

type Props = {
  qs: string; // querystring ya construido (agenteId/lugarId/qr)
  lugarNombre: string | null;
  fondoUrl: string | null;
};

function tipoBadge(tipo: string) {
  const t = (tipo || "").toLowerCase();
  if (t.includes("luz") || t.includes("electric")) return { emoji: "💡", label: "Luz", cls: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25" };
  if (t.includes("gas")) return { emoji: "🔥", label: "Gas", cls: "bg-orange-500/15 text-orange-200 border-orange-500/25" };
  if (t.includes("tele") || t.includes("móvil") || t.includes("fibra")) return { emoji: "📶", label: "Telefonía", cls: "bg-sky-500/15 text-sky-200 border-sky-500/25" };
  return { emoji: "⭐", label: tipo || "Oferta", cls: "bg-slate-500/15 text-slate-200 border-slate-500/25" };
}

export default function OfertasContenido({ qs, lugarNombre, fondoUrl }: Props) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<"ALL" | "LUZ" | "GAS" | "TELEFONIA">("ALL");
  const [loading, setLoading] = useState(true);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [error, setError] = useState<string | null>(null);

  const registroHref = useMemo(() => `/registro${qs ? `?${qs}` : ""}`, [qs]);
  const comparadorHref = useMemo(
    () => `/comparador${qs ? `?${qs}` : ""}`,
    [qs]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Tu endpoint ya devuelve activas ordenadas por creadaEn desc
        const res = await fetch("/api/ofertas", { cache: "no-store" });
        const data = await res.json();

        const list: Oferta[] = Array.isArray(data?.ofertas) ? data.ofertas : [];
        if (!alive) return;

        setOfertas(list);
      } catch (e: any) {
        if (!alive) return;
        setError("No se pudieron cargar las ofertas.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtradas = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return ofertas.filter((o) => {
      const t = String(o.tipo || "").toUpperCase();
      const matchTipo =
        tipo === "ALL" ||
        (tipo === "LUZ" && t.includes("LUZ")) ||
        (tipo === "GAS" && t.includes("GAS")) ||
        (tipo === "TELEFONIA" && (t.includes("TELEFONIA") || t.includes("TEL")));

      if (!matchTipo) return false;

      if (!qq) return true;

      const hay =
        (o.titulo || "").toLowerCase().includes(qq) ||
        (o.descripcionCorta || "").toLowerCase().includes(qq) ||
        (o.descripcion || "").toLowerCase().includes(qq) ||
        (o.tipo || "").toLowerCase().includes(qq);

      return hay;
    });
  }, [ofertas, q, tipo]);

  const destacadas = useMemo(() => filtradas.filter((o) => o.destacada), [filtradas]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* HERO (móvil primero) */}
      <section className="relative">
        {/* Fondo */}
        <div className="absolute inset-0">
          {fondoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fondoUrl}
              alt="Impulso Energético"
              className="h-full w-full object-cover opacity-35"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-slate-900 to-slate-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/70 to-slate-950" />
        </div>

        {/* Contenido */}
        <div className="relative max-w-6xl mx-auto px-4 pt-7 pb-7 sm:pt-10 sm:pb-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/LOGO-DEFINITIVO-IMPULSO-ENERGETICO.png"
                alt="Impulso Energético"
                width={64}
                height={64}
                className="h-10 w-auto sm:h-12"
              />
              <div className="leading-tight">
                <div className="text-[11px] sm:text-xs tracking-[0.22em] uppercase text-emerald-300 font-extrabold">
                  Impulso Energético
                </div>
                <div className="text-xs sm:text-sm text-slate-200 font-semibold">
                  Ahorra en Luz, Gas y Telefonía · Atención rápida
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/40 px-4 py-2 text-xs font-bold hover:bg-slate-900/70"
            >
              Acceder al CRM
            </Link>
          </div>

          <div className="mt-7 sm:mt-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-xs font-extrabold text-slate-100">
              ⚡ Acceso desde enlace autorizado
              {lugarNombre ? (
                <span className="text-emerald-300">· {lugarNombre}</span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl font-black leading-tight">
              Ahorra en tu factura{" "}
              <span className="text-emerald-300">en 1 minuto</span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-200 font-semibold">
              Te buscamos la mejor opción y gestionamos el cambio por ti.
              <span className="text-emerald-200"> Sin compromiso</span>.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href={registroHref}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-4 text-base"
              >
                ✅ Registrarme ahora (1 minuto)
              </Link>

              <Link
                href={comparadorHref}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 text-white font-extrabold px-5 py-4 text-base"
              >
                Ver comparador
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/35 px-4 py-3 font-bold">
                ✅ Estudio gratuito
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/35 px-4 py-3 font-bold">
                ✅ Ahorro real
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/35 px-4 py-3 font-bold">
                ✅ Ventajas por contratar
              </div>
            </div>

            <p className="mt-3 text-[11px] sm:text-xs text-slate-300 font-semibold">
              Tu acceso queda asociado al lugar/agente para atención prioritaria y trazabilidad.
            </p>
          </div>
        </div>
      </section>

      {/* LISTADO */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/30 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold">
                Ofertas disponibles
              </h2>
              <p className="text-slate-300 text-sm font-semibold mt-1">
                Elige una oferta o regístrate y te llamamos para cerrarlo contigo.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href={registroHref}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-3 text-sm"
              >
                Ir a registro
              </Link>
              <Link
                href={comparadorHref}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 text-white font-extrabold px-4 py-3 text-sm"
              >
                Comparador
              </Link>
            </div>
          </div>

          {/* Buscador + filtros */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar ofertas (luz, gas, telefonía, compañía...)"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500"
            />

            <div className="grid grid-cols-4 gap-2">
              {(["ALL", "LUZ", "GAS", "TELEFONIA"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={[
                    "rounded-2xl px-3 py-3 text-xs font-extrabold border transition",
                    tipo === t
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-slate-950/30 text-slate-200 border-slate-700 hover:bg-slate-900/50",
                  ].join(" ")}
                >
                  {t === "ALL" ? "Todo" : t === "LUZ" ? "Luz" : t === "GAS" ? "Gas" : "Tel"}
                </button>
              ))}
            </div>
          </div>

          {/* Estados */}
          {loading ? (
            <div className="mt-6 text-slate-300 font-semibold">
              Cargando ofertas...
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 font-extrabold">
              {error}
            </div>
          ) : filtradas.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 font-extrabold">
              No hay ofertas con esos filtros ahora mismo.
            </div>
          ) : (
            <>
              {/* Destacadas */}
              {destacadas.length > 0 ? (
                <div className="mt-6">
                  <div className="text-sm font-extrabold text-emerald-200">
                    ⭐ Destacadas
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {destacadas.map((o) => {
                      const b = tipoBadge(o.tipo);
                      return (
                        <div
                          key={o.id}
                          className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${b.cls}`}>
                              <span>{b.emoji}</span>
                              <span>{b.label}</span>
                              <span className="text-slate-300">· destacada</span>
                            </div>
                          </div>

                          <div className="mt-3 text-lg font-extrabold">
                            {o.titulo}
                          </div>

                          {o.descripcionCorta ? (
                            <div className="mt-2 text-sm text-slate-200 font-semibold">
                              {o.descripcionCorta}
                            </div>
                          ) : null}

                          {o.descripcion ? (
                            <div className="mt-2 text-xs text-slate-300 font-semibold line-clamp-4">
                              {o.descripcion}
                            </div>
                          ) : null}

                          <div className="mt-4 grid grid-cols-1 gap-2">
                            <Link
                              href={registroHref}
                              className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-3 text-sm"
                            >
                              ✅ Quiero esta oferta (me registro)
                            </Link>
                            <Link
                              href={comparadorHref}
                              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 text-white font-extrabold px-4 py-3 text-sm"
                            >
                              Ver comparador
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Todas */}
              <div className="mt-7">
                <div className="text-sm font-extrabold text-slate-200">
                  Todas las ofertas
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filtradas.map((o) => {
                    const b = tipoBadge(o.tipo);
                    return (
                      <div
                        key={o.id}
                        className="rounded-3xl border border-slate-800 bg-slate-950/25 p-5 hover:bg-slate-950/40 transition"
                      >
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${b.cls}`}>
                          <span>{b.emoji}</span>
                          <span>{b.label}</span>
                        </div>

                        <div className="mt-3 text-base font-extrabold">
                          {o.titulo}
                        </div>

                        {o.descripcionCorta ? (
                          <div className="mt-2 text-sm text-slate-200 font-semibold">
                            {o.descripcionCorta}
                          </div>
                        ) : null}

                        {o.descripcion ? (
                          <div className="mt-2 text-xs text-slate-300 font-semibold line-clamp-4">
                            {o.descripcion}
                          </div>
                        ) : null}

                        <div className="mt-4 grid grid-cols-1 gap-2">
                          <Link
                            href={registroHref}
                            className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-3 text-sm"
                          >
                            ✅ Me interesa (registrarme)
                          </Link>
                          <Link
                            href={comparadorHref}
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 text-white font-extrabold px-4 py-3 text-sm"
                          >
                            Comparador
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer mini */}
        <div className="mt-6 text-center text-[11px] text-slate-400 font-semibold">
          Impulso Energético · Estudio gratuito · Gestión completa de altas y portabilidades
        </div>
      </section>
    </main>
  );
}
