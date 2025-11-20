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
  const searchParams = useSearchParams();

  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modoUsuario, setModoUsuario] = useState<"cliente" | "comercial">("cliente");

  // -----------------------------
  // 🔥 NUEVO: nombre + trazabilidad QR
  // -----------------------------
  const [nombre, setNombre] = useState<string | null>(null);
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);

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
  }, [searchParams]);

  // Construye el querystring para mantener la trazabilidad
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

  // -----------------------------
  // 🔥 Cargar ofertas desde API
  // -----------------------------
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

  // -----------------------------
  // FILTROS Y MEMOS
  // -----------------------------
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
    const g = { LUZ: [], GAS: [], TELEFONIA: [] } as Record<TipoOferta, Oferta[]>;
    ofertasFiltradas.forEach((o) => o.activa && g[o.tipo]?.push(o));
    return g;
  }, [ofertasFiltradas]);

  const formFecha = (f?: string | null) => {
    if (!f) return "";

    try {
      const d = new Date(f);
      if (isNaN(d.getTime())) return ""; // fecha inválida, no pintamos nada

      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // -----------------------------
  // NAVEGACIÓN
  // -----------------------------
  const irARegistro = () => router.push(`/registro${buildQuery()}`);
  const irALoginCRM = () => router.push(`/login${buildQuery()}`);

  const irAComparador = (tipo?: TipoOferta) => {
    if (tipo === "LUZ") router.push(`/comparador${buildQuery({ tipo: "luz" })}`);
    else if (tipo === "GAS") router.push(`/comparador${buildQuery({ tipo: "gas" })}`);
    else if (tipo === "TELEFONIA") router.push(`/comparador${buildQuery({ tipo: "telefonia" })}`);
    else router.push(`/comparador${buildQuery()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-10 md:space-y-12">
        {/* ---------------------------------------------------- */}
        {/* 🔥 CABECERA + HERO CON SALUDO Y TRAZABILIDAD QR */}
        {/* ---------------------------------------------------- */}
        <header className="flex flex-col gap-6 md:gap-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-[0.3em] text-emerald-300 uppercase">
                IMPULSO ENERGÉTICO
              </span>
              <span className="block text-[10px] text-slate-400">
                Plataforma de ahorro y comisiones
              </span>
            </div>

            {/* Selector modo */}
            <div className="inline-flex rounded-full bg-slate-900/60 border border-slate-700 p-1 text-xs">
              <button
                onClick={() => setModoUsuario("cliente")}
                className={`px-3 py-1 rounded-full font-semibold ${
                  modoUsuario === "cliente" ? "bg-emerald-500 text-black" : "text-slate-200"
                }`}
              >
                Soy cliente
              </button>
              <button
                onClick={() => setModoUsuario("comercial")}
                className={`px-3 py-1 rounded-full font-semibold ${
                  modoUsuario === "comercial" ? "bg-sky-500 text-black" : "text-slate-200"
                }`}
              >
                Soy comercial
              </button>
            </div>
          </div>

          {/* ------------------------ */}
          {/* HERO PRINCIPAL */}
          {/* ------------------------ */}
          <div className="grid md:grid-cols-[1.8fr,1.2fr] gap-8 items-center">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                {nombre ? (
                  <>
                    Hola, <span className="text-emerald-400">{nombre}</span> 👋
                    <br />
                  </>
                ) : null}
                Ahorra en tus facturas y{" "}
                <span className="text-amber-300">gana comisiones</span>{" "}
                desde hoy.
              </h1>

              <p className="text-sm text-slate-300 max-w-xl">
                Luz, gas, telefonía, solar, aerotermia, batería HERMES-IA,
                inmobiliaria, viajes, seguros, repuestos y mucho más.
              </p>

              {(agenteId || lugarId) && (
                <p className="text-xs text-slate-400">
                  QR detectado •{" "}
                  {agenteId && <span>Agente: <b>{agenteId}</b></span>}{" "}
                  {lugarId && <span>· Lugar: <b>{lugarId}</b></span>}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={irARegistro}
                  className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 font-semibold text-black shadow shadow-emerald-500/40"
                >
                  Acceder a las ofertas
                </button>

                <button
                  onClick={() => irAComparador()}
                  className="px-5 py-2.5 rounded-full border border-emerald-300 text-emerald-200 hover:bg-emerald-500/10"
                >
                  Ver ahorro estimado
                </button>
              </div>
            </div>

            {/* ------------------------------ */}
            {/* TARJETA LATERAL DE SERVICIOS */}
            {/* ------------------------------ */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-700 p-5 space-y-4 shadow-xl">
              <h2 className="text-lg font-semibold">Elige tu sección</h2>
              <p className="text-xs text-slate-300">
                Selecciona la categoría que quieres optimizar.
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => irAComparador("LUZ")}
                  className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 hover:bg-emerald-500/20"
                >
                  💡 Luz
                </button>
                <button
                  onClick={() => irAComparador("GAS")}
                  className="rounded-xl bg-orange-500/10 border border-orange-500/30 px-3 py-2 hover:bg-orange-500/20"
                >
                  🔥 Gas
                </button>
                <button
                  onClick={() => irAComparador("TELEFONIA")}
                  className="rounded-xl bg-sky-500/10 border border-sky-500/30 px-3 py-2 hover:bg-sky-500/20"
                >
                  📶 Telefonía
                </button>
                <div className="rounded-xl border border-dashed border-slate-600 px-3 py-2 text-slate-400">
                  Más pronto…
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ------------------------------------------------ */}
        {/* BUSCADOR */}
        {/* ------------------------------------------------ */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Ofertas destacadas (bloqueadas)</h2>

          <div className="relative w-full md:w-80">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ofertas..."
              className="w-full rounded-full bg-slate-900/60 border border-slate-700 px-4 py-2 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          </div>
        </section>

        {/* ------------------------------------------------ */}
        {/* ESTADOS */}
        {/* ------------------------------------------------ */}
        {loading && (
          <div className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-center text-sm">
            Cargando ofertas…
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-xl text-center text-sm">
            {error}
          </div>
        )}

        {/* ------------------------------------------------ */}
        {/* CARRUSEL DESTACADAS */}
        {/* ------------------------------------------------ */}
        {!loading && !error && ofertasDestacadas.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">🌟 Ofertas especiales para ti</h3>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {ofertasDestacadas.map((o) => {
                // Fallback por si viene un tipo inesperado desde la API
                const cfg = tipoConfig[o.tipo as TipoOferta] ?? tipoConfig.LUZ;

                return (
                  <div
                    key={o.id}
                    className={`min-w-[260px] bg-slate-900/80 border ${cfg.border} rounded-2xl p-4`}
                  >
                    <div className="flex justify-between">
                      <span className={`px-2 py-1 rounded-full text-[10px] ${cfg.bgPill}`}>
                        {cfg.label}
                      </span>

                      <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-300 text-[10px] border border-yellow-500/30">
                        Destacada
                      </span>
                    </div>

                    <h4 className="mt-2 text-sm font-bold">{o.titulo}</h4>
                    <p className="text-xs text-slate-300">{o.descripcionCorta}</p>

                    <div className="mt-3 flex justify-between text-[11px]">
                      <span>{formFecha(o.creadaEn)}</span>
                      <button
                        onClick={irARegistro}
                        className="px-3 py-1 rounded-full bg-emerald-500 text-black font-semibold"
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

        {/* ------------------------------------------------ */}
        {/* SECCIONES POR TIPO */}
        {/* ------------------------------------------------ */}
        <section className="space-y-6">
          {(["LUZ", "GAS", "TELEFONIA"] as TipoOferta[]).map((tipo) => {
            const lista = ofertasPorTipo[tipo];
            if (!lista?.length) return null;
            const cfg = tipoConfig[tipo];

            return (
              <div key={tipo} className="rounded-2xl bg-slate-900/70 border border-slate-700 p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {cfg.label}{" "}
                      <span className="text-slate-400 text-sm">
                        ({lista.length} ofertas)
                      </span>
                    </h3>
                  </div>

                  <button
                    onClick={() => irAComparador(tipo)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold text-white ${cfg.btn}`}
                  >
                    Ir al comparador de {cfg.label}
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2">
                  {lista.map((o) => (
                    <div
                      key={o.id}
                      className="min-w-[240px] rounded-2xl bg-slate-950/70 border border-slate-700 p-4"
                    >
                      <div className="flex justify-between">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] ${cfg.bgPill}`}
                        >
                          {cfg.label}
                        </span>

                        {o.destacada && (
                          <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-300 text-[10px] border border-yellow-500/30">
                            Destacada
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2 text-sm font-bold text-slate-50">{o.titulo}</h4>
                      <p className="text-xs text-slate-300">{o.descripcionCorta}</p>

                      <div className="mt-3 flex justify-between text-[11px] text-slate-400">
                        <span>{formFecha(o.creadaEn)}</span>
                        <button
                          onClick={() => irAComparador(tipo)}
                          className={`px-3 py-1 rounded-full text-[11px] text-white ${cfg.btn}`}
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

        {/* ------------------------------------------------ */}
        {/* BLOQUE “¿CÓMO DESBLOQUEAS TUS DESCUENTOS?” */}
        {/* ------------------------------------------------ */}
        <section className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold">¿Cómo desbloqueas tus descuentos?</h2>
            <p className="text-sm text-slate-300">
              Te acompañamos en todo el proceso y hacemos por ti todas las gestiones.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                ["01", "Regístrate", "Nombre, email y teléfono."],
                ["02", "Accede a ofertas", "Promos reales y actualizadas."],
                ["03", "Contrata fácil", "Nos ocupamos de las gestiones."],
                ["04", "Ahorro constante", "Optimización continua."],
              ].map(([num, titulo, desc]) => (
                <div
                  key={num}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700"
                >
                  <div className="text-emerald-400 font-bold">{num}</div>
                  <div className="font-semibold">{titulo}</div>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/40 space-y-3">
            <h3 className="text-lg font-semibold">
              Ahorra y gana dinero con tus suministros
            </h3>
            <p className="text-sm text-emerald-100">
              Compara ofertas reales y gana comisiones si recomiendas nuestros servicios.
            </p>

            <div className="flex gap-3">
              <button
                onClick={irARegistro}
                className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
              >
                Comenzar ahora
              </button>

              <button
                onClick={irALoginCRM}
                className="px-4 py-2 rounded-full border border-emerald-300 text-emerald-100 hover:bg-emerald-500/10"
              >
                Soy comercial
              </button>
            </div>

            <p className="text-xs text-emerald-100/70">
              Aceptas recibir comunicaciones comerciales.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------ */}
        {/* FOOTER */}
        {/* ------------------------------------------------ */}
        <footer className="pt-6 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
          <span>© 2025 Impulso Energético</span>

          <div className="flex gap-4">
            <a className="hover:text-emerald-300 cursor-pointer">Ver ofertas</a>
            <a className="hover:text-emerald-300 cursor-pointer">Aviso legal</a>
            <a className="hover:text-emerald-300 cursor-pointer">Privacidad</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BienvenidaContenido;
