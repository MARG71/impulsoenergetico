"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type TipoOferta = "LUZ" | "GAS" | "TELEFONIA";

interface Oferta {
  id: string;
  titulo: string;
  descripcionCorta: string;
  descripcionLarga: string;
  tipo: TipoOferta | string; // en la práctica puede venir en minúsculas
  destacada: boolean;
  activa: boolean;
  creadaEn?: string | null;
}

const tipoConfig: Record<
  TipoOferta,
  { label: string; bgPill: string; btn: string; border: string }
> = {
  LUZ: {
    label: "Luz",
    bgPill: "bg-emerald-100 text-emerald-800",
    btn: "bg-emerald-600 hover:bg-emerald-500",
    border: "border-emerald-200",
  },
  GAS: {
    label: "Gas",
    bgPill: "bg-orange-100 text-orange-800",
    btn: "bg-orange-500 hover:bg-orange-400",
    border: "border-orange-200",
  },
  TELEFONIA: {
    label: "Telefonía",
    bgPill: "bg-sky-100 text-sky-800",
    btn: "bg-sky-600 hover:bg-sky-500",
    border: "border-sky-200",
  },
};

// Normaliza cualquier valor de tipo a LUZ | GAS | TELEFONIA
function normalizarTipoOferta(raw: string | undefined | null): TipoOferta {
  const v = String(raw || "").toUpperCase();
  if (v === "GAS") return "GAS";
  if (v === "TELEFONIA" || v === "TELÉFONIA") return "TELEFONIA";
  return "LUZ";
}

export default function BienvenidaContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado básico
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modoUsuario, setModoUsuario] = useState<"cliente" | "comercial">(
    "cliente"
  );

  // Datos de cliente / QR
  const [nombre, setNombre] = useState<string | null>(null);
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);
  const [leadOK, setLeadOK] = useState(false);

  // Leer parámetros de la URL + localStorage
  useEffect(() => {
    const nombreURL = searchParams.get("nombre");
    const agenteURL = searchParams.get("agenteId");
    const lugarURL = searchParams.get("lugarId");

    if (nombreURL) setNombre(nombreURL);

    if (agenteURL && lugarURL) {
      setAgenteId(agenteURL);
      setLugarId(lugarURL);
      try {
        localStorage.setItem("agenteId", agenteURL);
        localStorage.setItem("lugarId", lugarURL);
      } catch {
        // ignore
      }
    } else {
      try {
        const storedAgente = localStorage.getItem("agenteId");
        const storedLugar = localStorage.getItem("lugarId");
        if (storedAgente) setAgenteId(storedAgente);
        if (storedLugar) setLugarId(storedLugar);
      } catch {
        // ignore
      }
    }

    try {
      setLeadOK(localStorage.getItem("leadOK") === "1");
    } catch {
      // ignore
    }
  }, [searchParams]);

  // Construir querystring para mantener trazabilidad
  const buildQuery = (extra?: Record<string, string>) => {
    const p = new URLSearchParams();
    if (nombre) p.set("nombre", nombre);
    if (agenteId) p.set("agenteId", agenteId);
    if (lugarId) p.set("lugarId", lugarId);
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    }
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  };

  // Cargar ofertas
  useEffect(() => {
    const cargarOfertas = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/ofertas", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) throw new Error("No se pudieron cargar las ofertas");

        const data = await res.json();
        const listaRaw: Oferta[] = (data?.ofertas ?? data ?? []) as Oferta[];

        // Normalizamos tipos aquí
        const lista = (listaRaw || []).map((o) => ({
          ...o,
          tipo: normalizarTipoOferta(o.tipo as string),
        }));

        const ordenadas = [...lista].sort((a, b) => {
          const fechaA = a.creadaEn ? new Date(a.creadaEn).getTime() : 0;
          const fechaB = b.creadaEn ? new Date(b.creadaEn).getTime() : 0;
          return fechaB - fechaA;
        });

        setOfertas(ordenadas);
      } catch (err: any) {
        setError(err.message || "Error al cargar ofertas");
      } finally {
        setLoading(false);
      }
    };

    cargarOfertas();
  }, []);

  // Filtros
  const ofertasFiltradas = useMemo(() => {
    const txt = busqueda.trim().toLowerCase();
    if (!txt) return ofertas;

    return ofertas.filter((o) => {
      const t =
        (o.titulo || "") +
        " " +
        (o.descripcionCorta || "") +
        " " +
        (o.descripcionLarga || "") +
        " " +
        (o.tipo || "") +
        " " +
        (o.destacada ? "destacada" : "");

      return t.toLowerCase().includes(txt);
    });
  }, [busqueda, ofertas]);

  const ofertasDestacadas = useMemo(
    () => ofertasFiltradas.filter((o) => o.destacada && o.activa),
    [ofertasFiltradas]
  );

  const ofertasPorTipo = useMemo(() => {
    const grupos: Record<TipoOferta, Oferta[]> = {
      LUZ: [],
      GAS: [],
      TELEFONIA: [],
    };
    (ofertasFiltradas || []).forEach((o) => {
      if (!o.activa) return;
      const key = normalizarTipoOferta(o.tipo as string);
      grupos[key].push(o);
    });
    return grupos;
  }, [ofertasFiltradas]);

  const formFecha = (f?: string | null) =>
    !f
      ? ""
      : new Date(f).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

  // Navegación
  const irARegistro = () => router.push(`/registro${buildQuery()}`);
  const irALoginCRM = () => router.push(`/login${buildQuery()}`);

  const irAComparador = (tipo?: TipoOferta) => {
    if (tipo === "LUZ") router.push(`/comparador${buildQuery({ tipo: "luz" })}`);
    else if (tipo === "GAS")
      router.push(`/comparador${buildQuery({ tipo: "gas" })}`);
    else if (tipo === "TELEFONIA")
      router.push(`/comparador${buildQuery({ tipo: "telefonia" })}`);
    else router.push(`/comparador${buildQuery()}`);
  };

  const irAComparadorConOferta = (tipo: TipoOferta, ofertaId: string) => {
    const extra: Record<string, string> = {
      ofertaId: String(ofertaId),
    };

    const key = normalizarTipoOferta(tipo);
    if (key === "LUZ") extra.tipo = "luz";
    else if (key === "GAS") extra.tipo = "gas";
    else if (key === "TELEFONIA") extra.tipo = "telefonia";

    router.push(`/comparador${buildQuery(extra)}`);
  };

  // RENDER
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-10 md:space-y-12">
        {/* CABECERA */}
        <header className="space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-[0.25em] text-emerald-300 uppercase">
                IMPULSO ENERGÉTICO
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
                {nombre && (
                  <>
                    Hola, <span className="text-emerald-400">{nombre}</span> 👋
                    <br />
                  </>
                )}
                Ahorra en tus facturas y{" "}
                <span className="text-amber-300">gana comisiones</span> desde
                hoy.
              </h1>
              {(agenteId || lugarId) && (
                <p className="text-[11px] text-slate-400">
                  QR detectado ·{" "}
                  {agenteId && (
                    <>
                      Agente: <b>{agenteId}</b>{" "}
                    </>
                  )}
                  {lugarId && (
                    <>
                      · Lugar: <b>{lugarId}</b>
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="inline-flex rounded-full bg-slate-900/70 border border-slate-700/80 p-1 text-[11px]">
              <button
                onClick={() => setModoUsuario("cliente")}
                className={`px-3 py-1 rounded-full font-semibold ${
                  modoUsuario === "cliente"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-200"
                }`}
              >
                Soy cliente
              </button>
              <button
                onClick={() => setModoUsuario("comercial")}
                className={`px-3 py-1 rounded-full font-semibold ${
                  modoUsuario === "comercial"
                    ? "bg-sky-500 text-slate-950"
                    : "text-slate-200"
                }`}
              >
                Soy comercial
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {modoUsuario === "cliente" ? (
              <>
                <button
                  onClick={irARegistro}
                  className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 font-semibold text-slate-950 shadow shadow-emerald-500/40 text-sm"
                >
                  Acceder / actualizar mis datos
                </button>
                <button
                  onClick={() => irAComparador("LUZ")}
                  className="px-5 py-2.5 rounded-full border border-emerald-300 text-emerald-200 hover:bg-emerald-500/10 text-sm"
                >
                  Ir al comparador de luz
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={irALoginCRM}
                  className="px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 font-semibold text-slate-950 shadow shadow-sky-500/40 text-sm"
                >
                  Acceder al CRM
                </button>
                <button
                  onClick={irARegistro}
                  className="px-5 py-2.5 rounded-full border border-sky-300 text-sky-100 hover:bg-sky-500/10 text-sm"
                >
                  Invitar clientes a registrarse
                </button>
              </>
            )}
          </div>
        </header>

        {/* BUSCADOR */}
        <section className="space-y-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg md:text-xl font-semibold">
              Ofertas destacadas {leadOK ? "(desbloqueadas)" : "(bloqueadas)"}
            </h2>
            <div className="relative w-full md:w-80">
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar ofertas por nombre, tipo o texto..."
                className="w-full rounded-full bg-slate-900/70 border border-slate-700 px-4 py-2 pr-9 text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                🔍
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-300/80">
            {loading
              ? "Cargando ofertas…"
              : error
              ? `Error: ${error}`
              : ofertasFiltradas.length === 0
              ? "No hay ofertas que coincidan con tu búsqueda."
              : `${ofertasFiltradas.length} oferta(s) encontradas.`}
          </p>
        </section>

        {/* ESTADOS */}
        {loading && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
            Cargando ofertas, un momento…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-700 bg-red-950/60 p-6 text-center text-sm text-red-200">
            {error}
          </div>
        )}

        {/* CARRUSEL DESTACADAS */}
        {!loading && !error && ofertasDestacadas.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
              🌟 Ofertas especiales para ti
            </h3>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {ofertasDestacadas.map((oferta) => {
                const tipoNorm = normalizarTipoOferta(oferta.tipo as string);
                const cfg = tipoConfig[tipoNorm];

                return (
                  <div
                    key={oferta.id}
                    className={`min-w-[260px] max-w-xs rounded-2xl border ${cfg.border} bg-slate-900/85 p-4 shadow-lg shadow-slate-900/70 flex flex-col justify-between`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cfg.bgPill}`}
                        >
                          {cfg.label}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-yellow-400/15 text-yellow-300 border border-yellow-400/30">
                          Destacada
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-50">
                        {oferta.titulo}
                      </h4>
                      <p className="text-xs text-slate-200/85">
                        {oferta.descripcionCorta}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {formFecha(oferta.creadaEn)
                          ? `Actualizada: ${formFecha(oferta.creadaEn)}`
                          : ""}
                      </span>
                      {leadOK ? (
                        <button
                          onClick={() =>
                            irAComparadorConOferta(tipoNorm, oferta.id)
                          }
                          className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                        >
                          Ver en comparador
                        </button>
                      ) : (
                        <button
                          onClick={irARegistro}
                          className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                        >
                          Desbloquear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECCIONES POR TIPO */}
        {!loading && !error && (
          <section className="space-y-6">
            {(["LUZ", "GAS", "TELEFONIA"] as TipoOferta[]).map((tipo) => {
              const lista = ofertasPorTipo[tipo];
              if (!lista || lista.length === 0) return null;
              const cfg = tipoConfig[tipo];

              return (
                <div
                  key={tipo}
                  className="rounded-2xl bg-slate-900/70 border border-slate-700 p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                        {cfg.label}
                        <span className="text-[11px] font-normal text-slate-300">
                          ({lista.length} oferta(s) activas)
                        </span>
                      </h3>
                    </div>
                    <button
                      onClick={() => irAComparador(tipo)}
                      className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold text-white ${cfg.btn} shadow-md shadow-slate-900/40`}
                    >
                      Ir al comparador de {cfg.label}
                    </button>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-1">
                    {lista.map((oferta) => (
                      <div
                        key={oferta.id}
                        className="min-w-[240px] max-w-xs rounded-2xl bg-slate-950/80 border border-slate-700 p-4 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cfg.bgPill}`}
                            >
                              {cfg.label}
                            </span>
                            {oferta.destacada && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-yellow-50/10 text-yellow-300 border border-yellow-200/40">
                                Destacada
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-50">
                            {oferta.titulo}
                          </h4>
                          <p className="text-xs text-slate-200/80">
                            {oferta.descripcionCorta}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{formFecha(oferta.creadaEn)}</span>
                          <button
                            onClick={() =>
                              irAComparadorConOferta(tipo, oferta.id)
                            }
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold text-white ${cfg.btn}`}
                          >
                            Ver en comparador
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* FOOTER */}
        <footer className="pt-4 border-t border-slate-800 mt-2 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>© 2025 Impulso Energético</span>
          <div className="flex gap-4">
            <button className="hover:text-emerald-300 transition">
              Ver ofertas
            </button>
            <button className="hover:text-emerald-300 transition">
              Aviso legal
            </button>
            <button className="hover:text-emerald-300 transition">
              Privacidad
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
