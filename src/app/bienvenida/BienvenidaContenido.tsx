"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type TipoOferta = "LUZ" | "GAS" | "TELEFONIA";

interface Oferta {
  id: string;
  titulo: string;
  descripcionCorta: string;
  descripcionLarga: string;
  tipo: TipoOferta;
  destacada: boolean;
  activa: boolean;
  creadaEn?: string | null;
}

type SpecialPlace = {
  id: string;
  nombre: string;
  logo?: string;
  mensajeCorto?: string;
};

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

const BienvenidaContenido: React.FC = () => 
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- estado principal ---
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modoUsuario, setModoUsuario] = useState<"cliente" | "comercial">(
    "cliente"
  );

  // --- datos del cliente / trazabilidad QR ---
  const [nombre, setNombre] = useState<string | null>(null);
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);
  const [leadOK, setLeadOK] = useState(false);

  // club / asociación (si el lugar es especial)
  const [club, setClub] = useState<SpecialPlace | null>(null);

  // ==========================
  // 1) LEER QUERY + LOCALSTORAGE
  // ==========================
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
      } catch {}
    } else {
      try {
        const storedAgente = localStorage.getItem("agenteId");
        const storedLugar = localStorage.getItem("lugarId");
        if (storedAgente) setAgenteId(storedAgente);
        if (storedLugar) setLugarId(storedLugar);
      } catch {}
    }

    try {
      setLeadOK(localStorage.getItem("leadOK") === "1");
    } catch {}
  }, [searchParams]);

  // helper para mantener trazabilidad en las URLs
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

  // ==========================
  // 2) CARGAR DATOS DEL LUGAR (CLUB / ONG)
  // ==========================
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!lugarId) return;
      try {
        const res = await fetch(`/api/lugares-public/${lugarId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancel) return;
        if (data?.especial) {
          setClub({
            id: String(lugarId),
            nombre: data.nombre || `Lugar ${lugarId}`,
            logo: data.logo || undefined,
            mensajeCorto: data.mensajeCorto || "Ayuda a tu club",
          });
        }
      } catch {
        // si falla, simplemente no mostramos club
      }
    })();
    return () => {
      cancel = true;
    };
  }, [lugarId]);

  // ==========================
  // 3) CARGAR OFERTAS DESDE LA API
  // ==========================
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
        const lista: Oferta[] = data?.ofertas ?? data ?? [];

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

  // ==========================
  // 4) FILTROS Y MEMOS
  // ==========================
  const ofertasFiltradas = useMemo(() => {
    const txt = busqueda.trim().toLowerCase();
    if (!txt) return ofertas;

    return ofertas.filter((o) => {
      const t = (
        o.titulo +
        " " +
        o.descripcionCorta +
        " " +
        o.descripcionLarga +
        " " +
        o.tipo +
        " " +
        (o.destacada ? "destacada" : "")
      )
        .toLowerCase()
        .trim();

      return t.includes(txt);
    });
  }, [busqueda, ofertas]);

  const ofertasDestacadas = useMemo(
    () => ofertasFiltradas.filter((o) => o.destacada && o.activa),
    [ofertasFiltradas]
  );

  const ofertasPorTipo = useMemo(() => {
    const g = {
      LUZ: [] as Oferta[],
      GAS: [] as Oferta[],
      TELEFONIA: [] as Oferta[],
    };
    ofertasFiltradas.forEach((o) => o.activa && g[o.tipo]?.push(o));
    return g;
  }, [ofertasFiltradas]);

  const formFecha = (f?: string | null) =>
    !f
      ? ""
      : new Date(f).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

  // ==========================
  // 5) NAVEGACIÓN
  // ==========================
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
    // dejamos preparado ofertaId por si luego el comparador usa esa info
    if (tipo === "LUZ")
      router.push(
        `/comparador${buildQuery({ tipo: "luz", ofertaId: String(ofertaId) })}`
      );
    else if (tipo === "GAS")
      router.push(
        `/comparador${buildQuery({ tipo: "gas", ofertaId: String(ofertaId) })}`
      );
    else if (tipo === "TELEFONIA")
      router.push(
        `/comparador${buildQuery({
          tipo: "telefonia",
          ofertaId: String(ofertaId),
        })}`
      );
  };

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* GRID PRINCIPAL: SIDEBAR + CONTENIDO */}
        <div className="grid gap-8 md:grid-cols-[260px,1fr] items-start">
          {/* ====================== */}
          {/*  SIDEBAR LATERAL      */}
          {/* ====================== */}
          <aside className="space-y-6">
            {/* Logo Impulso + club */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-700 p-4 space-y-4 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-3">
                {/* Logo neón principal (usa el mismo que en el resto del proyecto) */}
                <div
                  className="rounded-2xl p-2"
                  style={{
                    boxShadow:
                      "0 0 0 2px rgba(255,122,59,0.7), 0 0 18px rgba(255,122,59,0.9)",
                    background: "rgba(0,0,0,0.4)",
                  }}
                >
                  <img
                    src="/logo-impulso.png"
                    alt="Impulso Energético"
                    className="h-10 md:h-12 w-auto"
                  />
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold tracking-[0.25em] text-emerald-300 uppercase">
                    Impulso Energético
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Plataforma de ahorro y comisiones
                  </span>
                </div>
              </div>

              {/* Club / asociación, si existe */}
              {club && (
                <div className="mt-2 flex items-center gap-3 rounded-2xl bg-slate-950/80 border border-emerald-600/60 px-3 py-2">
                  {club.logo && (
                    <img
                      src={club.logo}
                      alt={club.nombre}
                      className="h-9 w-9 rounded-full object-contain bg-slate-900"
                    />
                  )}
                  <div className="text-xs">
                    <div className="font-semibold text-emerald-300 uppercase tracking-wide">
                      {club.mensajeCorto || "Ayuda a tu club"}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {club.nombre}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menú lateral de secciones */}
            <nav className="rounded-3xl bg-slate-900/85 border border-slate-700/80 p-4 space-y-3 shadow-xl shadow-black/40">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Tu panel de ahorro</h2>
                <span className="text-[10px] text-slate-400">
                  Elige una sección
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <button
                  onClick={() => irAComparador("LUZ")}
                  className="flex items-center justify-between rounded-2xl px-3 py-2 bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/20 transition"
                >
                  <span className="flex items-center gap-2">
                    <span>💡</span>
                    <span className="font-semibold">Luz</span>
                  </span>
                  <span className="text-[10px] text-emerald-200">
                    Ver comparador
                  </span>
                </button>

                <button
                  onClick={() => irAComparador("GAS")}
                  className="flex items-center justify-between rounded-2xl px-3 py-2 bg-orange-500/10 border border-orange-500/40 hover:bg-orange-500/20 transition"
                >
                  <span className="flex items-center gap-2">
                    <span>🔥</span>
                    <span className="font-semibold">Gas</span>
                  </span>
                  <span className="text-[10px] text-orange-200">
                    Próximamente
                  </span>
                </button>

                <button
                  onClick={() => irAComparador("TELEFONIA")}
                  className="flex items-center justify-between rounded-2xl px-3 py-2 bg-sky-500/10 border border-sky-500/40 hover:bg-sky-500/20 transition"
                >
                  <span className="flex items-center gap-2">
                    <span>📶</span>
                    <span className="font-semibold">Telefonía</span>
                  </span>
                  <span className="text-[10px] text-sky-200">
                    Próximamente
                  </span>
                </button>

                <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="rounded-2xl border border-dashed border-slate-600 px-3 py-2">
                    ☀️ Solar / Autoconsumo
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-600 px-3 py-2">
                    🔋 Batería HERMES-IA
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-600 px-3 py-2">
                    🏡 Inmobiliaria
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-600 px-3 py-2">
                    ✈️ Viajes y más…
                  </div>
                </div>
              </nav>
          </aside>

          {/* ====================== */}
          {/*  ZONA PRINCIPAL        */}
          {/* ====================== */}
          <main className="space-y-10 md:space-y-12">
            {/* CABECERA / HERO */}
            <header className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
                    {nombre && (
                      <>
                        Hola,{" "}
                        <span className="text-emerald-400">{nombre}</span> 👋
                        <br />
                      </>
                    )}
                    Ahorra en tus facturas y{" "}
                    <span className="text-amber-300">gana comisiones</span>{" "}
                    desde hoy.
                  </h1>

                  <p className="text-sm md:text-base text-slate-200/85 max-w-xl">
                    Gracias por registrarte en Impulso Energético. Ya tienes tu
                    área de ahorro activa con todas las ofertas preparadas para
                    ti.
                  </p>

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

                {/* Selector cliente / comercial */}
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
                      Actualizar mis datos
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

            {/* BUSCADOR DE OFERTAS */}
            <section className="space-y-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-lg md:text-xl font-semibold">
                  Ofertas destacadas{" "}
                  {leadOK ? "(desbloqueadas)" : "(bloqueadas)"}
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

            {!loading && !error && (
              <>
                {/* CARRUSEL DESTACADAS */}
                {ofertasDestacadas.length > 0 && (
                  <section className="space-y-4" id="ofertas-destacadas">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                        🌟 Ofertas especiales para ti
                        {!leadOK && (
                          <span className="text-[11px] font-normal text-slate-300">
                            (visibles tras registrarte)
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {ofertasDestacadas.map((oferta) => {
                        const cfg = tipoConfig[oferta.tipo];
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
                              {oferta.descripcionLarga && (
                                <p className="mt-1 text-[11px] text-slate-300/85 line-clamp-4">
                                  {oferta.descripcionLarga}
                                </p>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                              <span>
                                {formFecha(oferta.creadaEn)
                                  ? `Actualizada: ${formFecha(
                                      oferta.creadaEn
                                    )}`
                                  : ""}
                              </span>
                              {leadOK ? (
                                <button
                                  onClick={() =>
                                    irAComparadorConOferta(
                                      oferta.tipo,
                                      String(oferta.id)
                                    )
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
                <section className="space-y-6">
                  {(["LUZ", "GAS", "TELEFONIA"] as TipoOferta[]).map((tipo) => {
                    const lista = ofertasPorTipo[tipo];
                    if (!lista?.length) return null;
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
                            <p className="text-[11px] md:text-xs text-slate-300/85">
                              Ofertas específicas de{" "}
                              {cfg.label.toLowerCase()}, ordenadas de la más
                              reciente a la más antigua.
                            </p>
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
                                {oferta.descripcionLarga && (
                                  <p className="mt-1 text-[11px] text-slate-300/85 line-clamp-4">
                                    {oferta.descripcionLarga}
                                  </p>
                                )}
                              </div>

                              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                <span>
                                  {formFecha(oferta.creadaEn)
                                    ? `Creada: ${formFecha(oferta.creadaEn)}`
                                    : ""}
                                </span>
                                <button
                                  onClick={() =>
                                    irAComparadorConOferta(
                                      oferta.tipo,
                                      String(oferta.id)
                                    )
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
              </>
            )}

            {/* BLOQUE “¿CÓMO DESBLOQUEAS TUS DESCUENTOS?” */}
            <section className="grid gap-6 md:grid-cols-[1.3fr,1fr] items-center">
              <div className="space-y-3">
                <h2 className="text-lg md:text-xl font-semibold">
                  ¿Cómo funciona tu zona de ahorro?
                </h2>
                <p className="text-sm text-slate-200/85">
                  Te acompañamos en todo el proceso y hacemos por ti todas las
                  gestiones, para que solo te preocupes de ahorrar.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    ["01", "Regístrate", "Nombre, email y teléfono."],
                    ["02", "Accede a ofertas", "Promos reales y actualizadas."],
                    ["03", "Contrata fácil", "Nos ocupamos de las gestiones."],
                    ["04", "Ahorro constante", "Optimización continua."],
                  ].map(([num, titulo, desc]) => (
                    <div
                      key={num}
                      className="rounded-2xl bg-slate-900/80 border border-slate-700 p-3 space-y-1"
                    >
                      <div className="text-emerald-400 text-sm font-bold">
                        {num}
                      </div>
                      <div className="font-semibold">{titulo}</div>
                      <p className="text-slate-300/85">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/40 p-5 md:p-6 space-y-3">
                <h3 className="text-lg font-semibold">
                  Ahorra y gana dinero con tus suministros
                </h3>
                <p className="text-sm text-emerald-50/90">
                  Compara ofertas de luz, gas, telefonía, seguros o energía
                  solar. Y si compartes, gana comisiones por cada contrato
                  conseguido como comercial o recomendador.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => irAComparador("LUZ")}
                    className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/40 transition"
                  >
                    Empezar con luz
                  </button>
                  <button
                    onClick={irALoginCRM}
                    className="px-4 py-2.5 rounded-full border border-emerald-300/70 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/10 transition"
                  >
                    Soy comercial, acceder al CRM
                  </button>
                </div>
                <p className="text-[11px] text-emerald-100/80 pt-1">
                  Al enviar aceptas recibir comunicaciones comerciales sobre
                  nuestras ofertas y servicios.
                </p>
              </div>
            </section>

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
          </main>
        </div>
      </div>
    </div>
  );
};

export default BienvenidaContenido;
