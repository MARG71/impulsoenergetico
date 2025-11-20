"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

type TipoOferta = "LUZ" | "GAS" | "TELEFONIA";

interface Oferta {
  id: string;
  titulo: string;
  descripcionCorta: string;
  descripcionLarga: string;
  tipo: TipoOferta | string;
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

function normalizarTipoOferta(raw: string | undefined | null): TipoOferta {
  const v = String(raw || "").toUpperCase();
  if (v === "GAS") return "GAS";
  if (v === "TELEFONIA" || v === "TELÉFONIA") return "TELEFONIA";
  return "LUZ";
}

export default function BienvenidaContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clubNombre = searchParams.get("club");

  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modoUsuario, setModoUsuario] = useState<"cliente" | "comercial">(
    "cliente"
  );

  const [nombre, setNombre] = useState<string | null>(null);
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);
  const [leadOK, setLeadOK] = useState(false);

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

  // 🔹 Config de secciones para los botones tipo tarjeta (neón)
  const secciones = [
    {
      id: "luz",
      label: "Luz",
      icon: "💡",
      bgClass:
        "bg-gradient-to-br from-emerald-500/30 via-emerald-500/10 to-slate-950/90",
      ringClass: "ring-emerald-400/70 group-hover:ring-emerald-200/90",
      onClick: () => irAComparador("LUZ" as TipoOferta),
    },
    {
      id: "gas",
      label: "Gas",
      icon: "🔥",
      bgClass:
        "bg-gradient-to-br from-orange-500/30 via-orange-500/10 to-slate-950/90",
      ringClass: "ring-orange-400/70 group-hover:ring-orange-200/90",
      onClick: () => irAComparador("GAS" as TipoOferta),
    },
    {
      id: "telefonia",
      label: "Telefonía",
      icon: "📶",
      bgClass:
        "bg-gradient-to-br from-sky-500/30 via-sky-500/10 to-slate-950/90",
      ringClass: "ring-sky-400/70 group-hover:ring-sky-200/90",
      onClick: () => irAComparador("TELEFONIA" as TipoOferta),
    },
    {
      id: "solar",
      label: "Solar",
      icon: "☀️",
      bgClass:
        "bg-gradient-to-br from-amber-400/35 via-amber-400/10 to-slate-950/90",
      ringClass: "ring-amber-300/70 group-hover:ring-amber-100/90",
      onClick: () => router.push(`/solar${buildQuery()}`),
    },
    {
      id: "aerotermia",
      label: "Aerotermia",
      icon: "🌬️",
      bgClass:
        "bg-gradient-to-br from-cyan-400/30 via-cyan-400/10 to-slate-950/90",
      ringClass: "ring-cyan-300/70 group-hover:ring-cyan-100/90",
      onClick: () => router.push(`/aerotermia${buildQuery()}`),
    },
    {
      id: "hermes",
      label: "Batería HERMES IA",
      icon: "🔋",
      bgClass:
        "bg-gradient-to-br from-purple-500/35 via-purple-500/10 to-slate-950/90",
      ringClass: "ring-purple-400/70 group-hover:ring-purple-200/90",
      onClick: () => router.push(`/bateria-hermes${buildQuery()}`),
    },
    {
      id: "ferreteria",
      label: "Ferretería",
      icon: "🔩",
      bgClass:
        "bg-gradient-to-br from-lime-400/35 via-lime-400/10 to-slate-950/90",
      ringClass: "ring-lime-300/70 group-hover:ring-lime-100/90",
      onClick: () => router.push(`/ferreteria${buildQuery()}`),
    },
    {
      id: "inmobiliaria",
      label: "Inmobiliaria",
      icon: "🏡",
      bgClass:
        "bg-gradient-to-br from-rose-500/35 via-rose-500/10 to-slate-950/90",
      ringClass: "ring-rose-400/70 group-hover:ring-rose-200/90",
      onClick: () => router.push(`/inmobiliaria${buildQuery()}`),
    },
    {
      id: "viajes",
      label: "Viajes",
      icon: "✈️",
      bgClass:
        "bg-gradient-to-br from-indigo-500/35 via-indigo-500/10 to-slate-950/90",
      ringClass: "ring-indigo-400/70 group-hover:ring-indigo-200/90",
      onClick: () => router.push(`/viajes${buildQuery()}`),
    },
    {
      id: "repuestos",
      label: "Repuestos coche",
      icon: "🚗",
      bgClass:
        "bg-gradient-to-br from-orange-400/35 via-orange-400/10 to-slate-950/90",
      ringClass: "ring-orange-300/70 group-hover:ring-orange-100/90",
      onClick: () => router.push(`/repuestos${buildQuery()}`),
    },
    {
      id: "seguros",
      label: "Seguros",
      icon: "🛡️",
      bgClass:
        "bg-gradient-to-br from-slate-400/35 via-slate-400/10 to-slate-950/90",
      ringClass: "ring-slate-300/70 group-hover:ring-slate-100/90",
      onClick: () => router.push(`/seguros${buildQuery()}`),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      {/* ancho TOTAL de pantalla, con padding lateral mínimo */}
      <div className="w-screen px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-6 md:py-8">
        {/* GRID PRINCIPAL: sidebar izquierda + contenido derecha */}
        <div className="grid gap-8 md:grid-cols-[340px,1fr] lg:grid-cols-[360px,1fr] items-start">
          {/* SIDEBAR IZQUIERDO */}
          <aside className="space-y-6">
            {/* Bloque logos */}
            <div className="rounded-3xl bg-slate-950/95 border border-emerald-500/50 p-6 flex flex-col gap-5 shadow-xl shadow-emerald-500/30">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-64 md:h-20 md:w-72">
                  <Image
                    src="/logo-impulso.png"
                    alt="Impulso Energético"
                    fill
                    className="object-contain drop-shadow-[0_0_24px_rgba(16,231,152,0.75)]"
                    priority
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-base md:text-lg font-bold text-slate-50">
                  Plataforma de ahorro y comisiones
                </p>
                <p className="text-[11px] md:text-xs tracking-[0.22em] uppercase text-emerald-300 font-semibold">
                  Servicios y ventajas para socios
                </p>
              </div>

              {clubNombre && (
                <div className="mt-1 rounded-2xl bg-emerald-500/15 border border-emerald-500/50 px-3 py-2.5 text-xs text-emerald-100 w-full">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-300 font-semibold">
                    Club / Asociación
                  </div>
                  <div className="font-bold text-sm md:text-base">
                    {clubNombre}
                  </div>
                </div>
              )}
            </div>

            {/* 🔸 SECCIONES: botones tipo tarjeta neón */}
            <nav className="rounded-3xl bg-slate-950/90 border border-slate-700/80 p-5 shadow-[0_0_40px_rgba(15,23,42,0.9)] space-y-4">
              <p className="text-sm md:text-lg font-extrabold text-slate-50 uppercase tracking-[0.22em] flex items-center gap-2">
                <span className="h-[2px] w-4 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                Secciones
              </p>

              {/* Grid de tarjetas redondeadas */}
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                {secciones.map((s) => (
                  <button
                    key={s.id}
                    onClick={s.onClick}
                    className={`group relative overflow-hidden rounded-3xl px-3 py-3 md:px-4 md:py-4 text-left text-xs md:text-sm font-semibold text-slate-50 shadow-lg shadow-black/40 ring-1 transition 
                      ${s.bgClass} ${s.ringClass}
                      hover:translate-y-[-1px] hover:shadow-[0_0_22px_rgba(15,23,42,0.9)]`}
                  >
                    {/* brillo suave en la esquina */}
                    <span className="pointer-events-none absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition" />

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 text-lg shadow-[0_0_18px_rgba(255,255,255,0.25)]">
                        {s.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-slate-200/80">
                          Servicio
                        </span>
                        <span className="text-xs md:text-sm font-bold">
                          {s.label}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          {/* COLUMNA DERECHA: bienvenida + buscador + ofertas */}
          <main className="space-y-8 md:space-y-10">
            {/* CABECERA ALINEADA A LA ALTURA DEL LOGO */}
            <header className="space-y-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="text-xs md:text-sm font-semibold tracking-[0.28em] text-emerald-300 uppercase">
                    IMPULSO ENERGÉTICO
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
                    {nombre && (
                      <>
                        Hola,{" "}
                        <span className="text-emerald-400 font-extrabold">
                          {nombre}
                        </span>{" "}
                        👋
                        <br />
                      </>
                    )}
                    Ahorra en tus facturas y{" "}
                    <span className="text-amber-300 font-extrabold">
                      gana comisiones
                    </span>{" "}
                    desde hoy.
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
            <section className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 md:p-5 space-y-3">
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
              <section className="space-y-4 rounded-2xl bg-slate-950/80 border border-slate-800 p-4 md:p-5">
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

            {/* BLOQUES POR TIPO */}
            {!loading && !error && (
              <section className="space-y-6">
                {(["LUZ", "GAS", "TELEFONIA"] as TipoOferta[]).map((tipo) => {
                  const lista = ofertasPorTipo[tipo];
                  if (!lista || lista.length === 0) return null;
                  const cfg = tipoConfig[tipo];

                  const bgSection =
                    tipo === "LUZ"
                      ? "bg-emerald-950/60 border-emerald-800/80"
                      : tipo === "GAS"
                      ? "bg-orange-950/40 border-orange-800/70"
                      : "bg-sky-950/50 border-sky-800/70";

                  return (
                    <div
                      key={tipo}
                      className={`rounded-2xl ${bgSection} border p-5`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                            {cfg.label}
                            <span className="text-[11px] font-normal text-slate-200/80">
                              ({lista.length} oferta(s) activas)
                            </span>
                          </h3>
                        </div>
                        <button
                          onClick={() => irAComparador(tipo)}
                          className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold text-white ${cfg.btn} shadow-md shadow-slate-950/50`}
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

            <footer className="pt-4 border-top border-slate-800 mt-2 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
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
}
