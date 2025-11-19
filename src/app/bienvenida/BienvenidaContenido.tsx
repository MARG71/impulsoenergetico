"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

const BienvenidaContenido: React.FC = () => {
  const router = useRouter();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modoUsuario, setModoUsuario] = useState<"cliente" | "comercial">(
    "cliente"
  );

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

        if (!res.ok) {
          throw new Error("No se pudieron cargar las ofertas");
        }

        const data = await res.json();
        const lista: Oferta[] = (data?.ofertas ?? data) || [];

        const ordenadas = [...lista].sort((a, b) => {
          const fechaA = a.creadaEn ? new Date(a.creadaEn).getTime() : 0;
          const fechaB = b.creadaEn ? new Date(b.creadaEn).getTime() : 0;
          return fechaB - fechaA;
        });

        setOfertas(ordenadas);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar las ofertas");
      } finally {
        setLoading(false);
      }
    };

    cargarOfertas();
  }, []);

  const ofertasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return ofertas;

    return ofertas.filter((o) => {
      const campos = [
        o.titulo,
        o.descripcionCorta,
        o.descripcionLarga,
        o.tipo,
        o.destacada ? "destacada" : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return campos.includes(texto);
    });
  }, [ofertas, busqueda]);

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

    for (const oferta of ofertasFiltradas) {
      if (!oferta.activa) continue;
      if (grupos[oferta.tipo]) {
        grupos[oferta.tipo].push(oferta);
      }
    }

    return grupos;
  }, [ofertasFiltradas]);

  const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return "";
    try {
      return new Date(fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const irAComparador = (tipo?: TipoOferta) => {
    if (tipo === "LUZ") router.push("/comparador?tipo=luz");
    else if (tipo === "GAS") router.push("/comparador?tipo=gas");
    else if (tipo === "TELEFONIA") router.push("/comparador?tipo=telefonia");
    else router.push("/comparador");
  };

  const irAGanaderia = () => router.push("/ganaderia");
  const irARegistro = () => router.push("/registro");
  const irALoginCRM = () => router.push("/login"); // ajusta si tu login es otra ruta

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-10 md:space-y-12">
        {/* CABECERA + HERO */}
        <header className="flex flex-col gap-6 md:gap-8">
          {/* Fila superior: logo + selector modo */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Sustituye por tu logo real del registro */}
              {/* <Image src="/LOGO-DEFINITIVO.png" alt="Impulso Energético" width={160} height={60} /> */}
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-[0.2em] text-emerald-300/80 uppercase">
                  Impulso Energético
                </span>
                <span className="text-[10px] text-slate-400">
                  Innovación energética para tu hogar y tu empresa
                </span>
              </div>
            </div>

            <div className="inline-flex items-center rounded-full bg-slate-900/60 border border-slate-700/70 p-1 text-xs">
              <button
                onClick={() => setModoUsuario("cliente")}
                className={`px-3 py-1 rounded-full font-semibold transition ${
                  modoUsuario === "cliente"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-200"
                }`}
              >
                Soy cliente
              </button>
              <button
                onClick={() => setModoUsuario("comercial")}
                className={`px-3 py-1 rounded-full font-semibold transition ${
                  modoUsuario === "comercial"
                    ? "bg-sky-500 text-slate-950"
                    : "text-slate-200"
                }`}
              >
                Soy comercial
              </button>
            </div>
          </div>

          {/* Hero principal */}
          <div className="grid gap-8 md:grid-cols-[1.8fr,1.2fr] items-center">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
                Ofertas{" "}
                <span className="text-emerald-400">
                  REALES y EXCLUSIVAS
                </span>{" "}
                para{" "}
                <span className="underline decoration-emerald-500/70 decoration-2">
                  ahorrar
                </span>{" "}
                y{" "}
                <span className="text-amber-300">ganar comisiones</span>{" "}
                desde hoy
              </h1>

              <p className="text-sm md:text-base text-slate-200/85 max-w-xl">
                Luz, gas, telefonía, solar, aerotermia, batería HERMES-IA,
                inmobiliaria, viajes, seguros, repuestos y mucho más. Desbloquea
                tus descuentos en menos de 60 segundos.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {modoUsuario === "cliente" ? (
                  <>
                    <button
                      onClick={irARegistro}
                      className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition"
                    >
                      Acceder a las ofertas
                    </button>
                    <button
                      onClick={() => irAComparador()}
                      className="px-5 py-2.5 rounded-full border border-emerald-400/60 bg-transparent text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 transition"
                    >
                      Ver ahorro estimado
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={irALoginCRM}
                      className="px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition"
                    >
                      Acceder a mi CRM
                    </button>
                    <button
                      onClick={irARegistro}
                      className="px-5 py-2.5 rounded-full border border-sky-400/60 bg-transparent text-sm font-semibold text-sky-300 hover:bg-sky-500/10 transition"
                    >
                      Invitar clientes a registrarse
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-4 pt-4 text-[11px] text-slate-300/80">
                <span>✅ Estudio gratuito</span>
                <span>✅ Ofertas negociadas y actualizadas</span>
                <span>✅ Sin compromiso</span>
              </div>
            </div>

            {/* Tarjeta lateral “elige tu sección” */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-700/80 p-5 md:p-6 shadow-2xl shadow-slate-950/80 space-y-4">
              <h2 className="text-base md:text-lg font-semibold">
                Elige tu sección y empieza a ahorrar
              </h2>
              <p className="text-xs md:text-sm text-slate-300/85">
                Selecciona la categoría que quieres optimizar. Seguimos
                añadiendo más servicios: déjanos tus datos y te avisamos de
                nuevas ofertas.
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] md:text-xs">
                <button
                  onClick={() => irAComparador("LUZ")}
                  className="rounded-xl bg-emerald-500/10 border border-emerald-500/40 px-3 py-2 text-left hover:bg-emerald-500/20 transition"
                >
                  💡 Luz
                </button>
                <button
                  onClick={() => irAComparador("GAS")}
                  className="rounded-xl bg-orange-500/10 border border-orange-500/40 px-3 py-2 text-left hover:bg-orange-500/20 transition"
                >
                  🔥 Gas
                </button>
                <button
                  onClick={() => irAComparador("TELEFONIA")}
                  className="rounded-xl bg-sky-500/10 border border-sky-500/40 px-3 py-2 text-left hover:bg-sky-500/20 transition"
                >
                  📶 Telefonía
                </button>
                <button
                  onClick={() => router.push("/solar")}
                  className="rounded-xl bg-yellow-500/10 border border-yellow-500/40 px-3 py-2 text-left hover:bg-yellow-500/20 transition"
                >
                  ☀️ Solar
                </button>
                <button
                  onClick={() => router.push("/aerotermia")}
                  className="rounded-xl bg-cyan-500/10 border border-cyan-500/40 px-3 py-2 text-left hover:bg-cyan-500/20 transition"
                >
                  🌬️ Aerotermia
                </button>
                <button
                  onClick={() => router.push("/bateria-hermes")}
                  className="rounded-xl bg-purple-500/10 border border-purple-500/40 px-3 py-2 text-left hover:bg-purple-500/20 transition"
                >
                  🔋 Batería HERMES IA
                </button>
                <button
                  onClick={() => router.push("/inmobiliaria")}
                  className="rounded-xl bg-rose-500/10 border border-rose-500/40 px-3 py-2 text-left hover:bg-rose-500/20 transition"
                >
                  🏡 Inmobiliaria
                </button>
                <button
                  onClick={() => router.push("/viajes")}
                  className="rounded-xl bg-indigo-500/10 border border-indigo-500/40 px-3 py-2 text-left hover:bg-indigo-500/20 transition"
                >
                  ✈️ Viajes
                </button>
                <button
                  onClick={() => router.push("/repuestos")}
                  className="rounded-xl bg-amber-500/10 border border-amber-500/40 px-3 py-2 text-left hover:bg-amber-500/20 transition"
                >
                  🚗 Repuestos coche
                </button>
                <button
                  onClick={() => router.push("/ferreteria")}
                  className="rounded-xl bg-lime-500/10 border border-lime-500/40 px-3 py-2 text-left hover:bg-lime-500/20 transition"
                >
                  🔩 Ferretería
                </button>
                <button
                  onClick={() => router.push("/seguros")}
                  className="rounded-xl bg-slate-500/10 border border-slate-500/40 px-3 py-2 text-left hover:bg-slate-500/20 transition"
                >
                  🛡️ Seguros
                </button>
                <div className="rounded-xl border border-dashed border-slate-600 px-3 py-2 text-[11px] text-slate-400 flex items-center">
                  Más pronto…
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                Sin trucos: precios reales, atención cercana y gestión completa
                (altas, portabilidades e instalaciones).
              </p>
            </div>
          </div>
        </header>

        {/* BUSCADOR DE OFERTAS */}
        <section className="space-y-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg md:text-xl font-semibold">
              Ofertas destacadas (bloqueadas)
            </h2>
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                placeholder="Buscar ofertas por nombre, tipo o texto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
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

        {/* ESTADO CARGA / ERROR */}
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
            {/* CARRUSEL OFERTAS DESTACADAS */}
            {ofertasDestacadas.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                    🌟 Ofertas especiales para ti
                    <span className="text-[11px] font-normal text-slate-300">
                      (visibles tras registrarte)
                    </span>
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
                            {formatearFecha(oferta.creadaEn)
                              ? `Actualizada: ${formatearFecha(
                                  oferta.creadaEn
                                )}`
                              : ""}
                          </span>
                          <button
                            onClick={irARegistro}
                            className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                          >
                            Desbloquear
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECCIONES POR TIPO */}
            <section className="space-y-6">
              {(Object.keys(ofertasPorTipo) as TipoOferta[]).map((tipo) => {
                const lista = ofertasPorTipo[tipo];
                if (!lista || lista.length === 0) return null;
                const cfg = tipoConfig[tipo];

                return (
                  <div
                    key={tipo}
                    className="rounded-2xl bg-slate-900/70 border border-slate-700 p-4 md:p-5"
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
                          Ofertas específicas de {cfg.label.toLowerCase()},
                          ordenadas de la más reciente a la más antigua.
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
                              {formatearFecha(oferta.creadaEn)
                                ? `Creada: ${formatearFecha(oferta.creadaEn)}`
                                : ""}
                            </span>
                            <button
                              onClick={() => irAComparador(tipo)}
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
              ¿Cómo desbloqueas tus descuentos?
            </h2>
            <p className="text-sm text-slate-200/85">
              Es muy sencillo. Te acompañamos en todo el proceso y nos encargamos
              de las gestiones para que solo te preocupes de ahorrar.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-3 space-y-1">
                <div className="text-emerald-400 text-sm font-bold">01</div>
                <div className="font-semibold">Regístrate</div>
                <p className="text-slate-300/85">
                  Nombre, email y teléfono. 60 segundos.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-3 space-y-1">
                <div className="text-emerald-400 text-sm font-bold">02</div>
                <div className="font-semibold">Accede a ofertas</div>
                <p className="text-slate-300/85">
                  Promos reales, negociadas y actualizadas.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-3 space-y-1">
                <div className="text-emerald-400 text-sm font-bold">03</div>
                <div className="font-semibold">Contrata fácil</div>
                <p className="text-slate-300/85">
                  Nos ocupamos de altas, portabilidades e instalaciones.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900/80 border border-slate-700 p-3 space-y-1">
                <div className="text-emerald-400 text-sm font-bold">04</div>
                <div className="font-semibold">Ahorro constante</div>
                <p className="text-slate-300/85">
                  Seguimiento y optimización continua con nuestro equipo y
                  HERMES-IA.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/40 p-5 md:p-6 space-y-3">
            <h3 className="text-lg font-semibold">
              Ahorra en tus facturas y gana dinero con tus suministros
            </h3>
            <p className="text-sm text-emerald-50/90">
              Compara ofertas de luz, gas, telefonía, seguros o energía solar.
              Y si compartes, gana comisiones por cada contrato conseguido como
              comercial o recomendador.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={irARegistro}
                className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/40 transition"
              >
                Comenzar ahora
              </button>
              <button
                onClick={irALoginCRM}
                className="px-4 py-2.5 rounded-full border border-emerald-300/70 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/10 transition"
              >
                Soy comercial, acceder al CRM
              </button>
            </div>
            <p className="text-[11px] text-emerald-100/80 pt-1">
              Al enviar aceptas recibir comunicaciones comerciales sobre nuestras
              ofertas y servicios.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pt-4 border-t border-slate-800 mt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>© 2025 Impulso Energético</span>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/ofertas")}
              className="hover:text-emerald-300 transition"
            >
              Ver ofertas
            </button>
            <button
              onClick={() => router.push("/legal")}
              className="hover:text-emerald-300 transition"
            >
              Aviso legal
            </button>
            <button
              onClick={() => router.push("/privacidad")}
              className="hover:text-emerald-300 transition"
            >
              Privacidad
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BienvenidaContenido;
