"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TipoComparador = "luz" | "gas" | "telefonia";

export default function ComparadorContenido() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tipoURL = searchParams.get("tipo"); // luz | gas | telefonia
  const ofertaId = searchParams.get("ofertaId"); // id de la oferta (opcional)
  const ofertaNombre = searchParams.get("ofertaNombre"); // nombre de la oferta (opcional)

  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);

  const comparativaId = searchParams.get("id");
  const idAgenteQR = searchParams.get("idAgente");
  const idLugarQR = searchParams.get("idLugar");

  const [tipoComparador, setTipoComparador] =
    useState<TipoComparador>("luz");
  const [nombreAgente, setNombreAgente] = useState("");
  const [nombreLugar, setNombreLugar] = useState("");
  const [tipoCliente, setTipoCliente] = useState("particular");
  const [tipoTarifa, setTipoTarifa] = useState("fija");
  const [nombreTarifa, setNombreTarifa] = useState("2.0TD");
  const [cups, setCups] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [consumoPeriodos, setConsumoPeriodos] = useState<
    Record<string, string>
  >({ P1: "", P2: "", P3: "", P4: "", P5: "", P6: "" });
  const [potencias, setPotencias] = useState<Record<string, string>>({
    P1: "",
    P2: "",
    P3: "",
    P4: "",
    P5: "",
    P6: "",
  });
  const [consumoAnual, setConsumoAnual] = useState("");
  const [importeFactura, setImporteFactura] = useState("");
  const [iva, setIva] = useState("21");
  const [reactiva, setReactiva] = useState("");
  const [exceso, setExceso] = useState("");
  const [alquiler, setAlquiler] = useState("");
  const [otros, setOtros] = useState("");
  const [mostrarGrafica, setMostrarGrafica] = useState(false);

  const [nombreCliente, setNombreCliente] = useState("");
  const [direccionCliente, setDireccionCliente] = useState("");
  const [impuestoElectricidad, setImpuestoElectricidad] =
    useState("5.113");
  const [territorio, setTerritorio] = useState("peninsula");
  const [resultados, setResultados] = useState<any[]>([]);
  const [orden, setOrden] = useState<"compañia" | "ahorro" | "comision">(
    "ahorro"
  );

  const ordenarResultados = (
    criterio: "compañia" | "ahorro" | "comision"
  ) => {
    const resultadosOrdenados = [...resultados].sort((a, b) => {
      if (criterio === "compañia")
        return a.compañia.localeCompare(b.compañia);
      if (criterio === "ahorro") return b.ahorro - a.ahorro;
      if (criterio === "comision") return b.comision - a.comision;
      return 0;
    });
    setResultados(resultadosOrdenados);
    setOrden(criterio);
  };

  const isTarifa20TD = nombreTarifa === "2.0TD";
  const periodosConsumo = isTarifa20TD
    ? ["P1", "P2", "P3"]
    : ["P1", "P2", "P3", "P4", "P5", "P6"];
  const periodosPotencia = isTarifa20TD
    ? ["P1", "P2"]
    : ["P1", "P2", "P3", "P4", "P5", "P6"];

  // 🔁 Ajustar tipo de comparador según la URL (viene desde bienvenida)
  useEffect(() => {
    if (!tipoURL) return;
    if (
      tipoURL === "luz" ||
      tipoURL === "gas" ||
      tipoURL === "telefonia"
    ) {
      setTipoComparador(tipoURL as TipoComparador);
    }
  }, [tipoURL]);

  // 🔁 Cargar / persistir agenteId y lugarId desde URL o localStorage
  useEffect(() => {
    const urlAgente = searchParams.get("agenteId");
    const urlLugar = searchParams.get("lugarId");

    if (urlAgente && urlLugar) {
      try {
        localStorage.setItem("agenteId", urlAgente);
        localStorage.setItem("lugarId", urlLugar);
      } catch {
        // ignore
      }
      setAgenteId(urlAgente);
      setLugarId(urlLugar);
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
  }, [searchParams]);

  // 🔁 Recalcular consumo anual
  useEffect(() => {
    const suma = periodosConsumo.reduce(
      (acc, p) =>
        acc +
        (parseFloat(
          consumoPeriodos[p as keyof typeof consumoPeriodos] || "0"
        ) || 0),
      0
    );
    const anual = suma * 12;
    setConsumoAnual(anual.toFixed(2));
  }, [consumoPeriodos, nombreTarifa]);

  // 🔁 Cargar comparativa existente (por ID)
  useEffect(() => {
    if (!comparativaId) return;
    const cargarComparativa = async () => {
      try {
        const res = await fetch(`/api/comparativas/${comparativaId}`);
        const data = await res.json();
        setNombreAgente(data.agente?.nombre || "");
        setNombreLugar(data.lugar?.nombre || "");
        setTipoTarifa(data.tipoTarifa);
        setNombreTarifa(data.nombreTarifa);
        setConsumoAnual(data.consumoAnual);
        setImporteFactura(data.importeFactura);
        setNombreCliente(data.cliente?.nombre || "");
        setDireccionCliente(data.cliente?.direccion || "");
        setResultados(data.resultados || []);
        const df = data.datosFactura || {};
        setTipoCliente(df.tipoCliente || "particular");
        setCups(df.cups || "");
        setFechaInicio(df.fechaInicio || "");
        setFechaFin(df.fechaFin || "");
        setConsumoPeriodos(df.consumoPeriodos || {});
        setPotencias(df.potencias || {});
        setIva(df.iva || "21");
        setImpuestoElectricidad(df.impuestoElectricidad || "5.113");
        setTerritorio(df.territorio || "peninsula");
        setReactiva(df.reactiva || "");
        setExceso(df.exceso || "");
        setAlquiler(df.alquiler || "");
        setOtros(df.otros || "");
      } catch (error) {
        console.error("Error cargando comparativa:", error);
      }
    };
    cargarComparativa();
  }, [comparativaId]);

  // 🔁 Si venimos de QR sin comparativa guardada: cargar nombres de agente / lugar
  useEffect(() => {
    if (!comparativaId && idAgenteQR && idLugarQR) {
      const fetchAgenteYLugar = async () => {
        try {
          const [resAgente, resLugar] = await Promise.all([
            fetch(`/api/agentes/${idAgenteQR}`),
            fetch(`/api/lugares/${idLugarQR}`),
          ]);
          const agente = await resAgente.json();
          const lugar = await resLugar.json();
          setNombreAgente(agente.nombre || "");
          setNombreLugar(lugar.nombre || "");
        } catch (error) {
          console.error(
            "Error cargando agente o lugar desde QR:",
            error
          );
        }
      };
      fetchAgenteYLugar();
    }
  }, [comparativaId, idAgenteQR, idLugarQR]);

  // 🔁 Reset si no hay comparativa cargada
  useEffect(() => {
    if (!comparativaId) {
      setTipoCliente("particular");
      setTipoTarifa("fija");
      setNombreTarifa("2.0TD");
      setCups("");
      setFechaInicio("");
      setFechaFin("");
      setConsumoPeriodos({
        P1: "",
        P2: "",
        P3: "",
        P4: "",
        P5: "",
        P6: "",
      });
      setPotencias({ P1: "", P2: "", P3: "", P4: "", P5: "", P6: "" });
      setConsumoAnual("");
      setImporteFactura("");
      setIva("21");
      setImpuestoElectricidad("5.113");
      setTerritorio("peninsula");
      setReactiva("");
      setExceso("");
      setAlquiler("");
      setOtros("");
      setNombreCliente("");
      setDireccionCliente("");
      setResultados([]);
    }
  }, [comparativaId]);

  const handlePeriodoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    setConsumoPeriodos({ ...consumoPeriodos, [key]: e.target.value });
  };

  const handlePotenciaChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    setPotencias({ ...potencias, [key]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const consumoTotal = periodosConsumo.reduce(
      (sum, key) => sum + (parseFloat(consumoPeriodos[key]) || 0),
      0
    );
    const facturaNum = parseFloat(importeFactura) || 0;

    if (consumoTotal <= 0 || facturaNum <= 0) {
      alert("Introduce consumo y factura válidos.");
      return;
    }

    const tarifas = [
      {
        id: 1,
        compañia: "AUDAX",
        tarifa: "CLASSIC P1-P6",
        precio_kwh: 0.14,
        comision_kwh: 0.003,
      },
      {
        id: 2,
        compañia: "IBERDROLA",
        tarifa: "PLAN ESTABLE",
        precio_kwh: 0.132,
        comision_kwh: 0.004,
      },
      {
        id: 3,
        compañia: "AXPO",
        tarifa: "INDEXADO FLEX",
        precio_kwh: 0.128,
        comision_kwh: 0.0025,
      },
    ];

    const resultadosCalculados = tarifas.map((t) => {
      const coste = consumoTotal * t.precio_kwh;
      const ahorro = facturaNum - coste;
      const ahorroPct = (ahorro / facturaNum) * 100;
      const comision =
        (parseFloat(consumoAnual) || 0) * t.comision_kwh;
      return {
        ...t,
        consumoTotal,
        coste,
        ahorro,
        ahorroPct,
        comision,
      };
    });

    setResultados(resultadosCalculados);

    try {
      const res = await fetch("/api/comparativas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: {
            nombre: nombreCliente,
            direccion: direccionCliente,
          },
          agenteId: parseInt(idAgenteQR || agenteId || "1", 10),
          lugarId: parseInt(idLugarQR || lugarId || "1", 10),
          datosFactura: {
            tipoCliente,
            tipoTarifa,
            nombreTarifa,
            cups,
            fechaInicio,
            fechaFin,
            consumoPeriodos,
            potencias,
            consumoAnual,
            importeFactura,
            iva,
            impuestoElectricidad,
            territorio,
            reactiva,
            exceso,
            alquiler,
            otros,
          },
          resultados: resultadosCalculados,
          tipo: tipoComparador,
          ofertaId: ofertaId ? Number(ofertaId) : undefined,
        }),
      });
      const data = await res.json();
      console.log("Comparativa guardada con éxito:", data);
    } catch (error) {
      console.error("Error al guardar la comparativa:", error);
    }
  };

  const tituloComparador =
    tipoComparador === "luz"
      ? "Comparador de luz"
      : tipoComparador === "gas"
      ? "Comparador de gas"
      : "Comparador de telefonía";

  // 🔙 Construir la query para volver a bienvenida (manteniendo nombre + IDs)
  const buildBackQuery = () => {
    const params = new URLSearchParams();

    const nombre = searchParams.get("nombre");
    const agenteFromUrl = searchParams.get("agenteId");
    const lugarFromUrl = searchParams.get("lugarId");

    const agente = agenteFromUrl || idAgenteQR || agenteId || "";
    const lugar = lugarFromUrl || idLugarQR || lugarId || "";

    if (nombre) params.set("nombre", nombre);
    if (agente) params.set("agenteId", agente);
    if (lugar) params.set("lugarId", lugar);

    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-4 py-6 md:px-8 md:py-8">
      {/* CABECERA IMPULSO: LOGO + TITULO + INFO QR/OFER + BOTÓN VOLVER */}
      <div className="w-full mb-6 rounded-3xl bg-slate-950/95 border border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.45)] p-5 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo + título */}
            <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
              <div className="relative h-16 w-56 md:h-20 md:w-64 flex-shrink-0">
                <Image
                  src="/logo-impulso.png"
                  alt="Impulso Energético"
                  fill
                  className="object-contain drop-shadow-[0_0_24px_rgba(16,231,152,0.75)]"
                  priority
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] md:text-xs font-semibold tracking-[0.28em] text-emerald-300 uppercase">
                  ESTUDIO PERSONALIZADO
                </p>
                <h1 className="text-xl md:text-3xl font-extrabold leading-tight">
                  {tituloComparador}
                </h1>
                {ofertaNombre && (
                  <p className="mt-1 text-xs md:text-sm text-amber-200">
                    Oferta seleccionada:{" "}
                    <span className="font-semibold text-amber-300">
                      {ofertaNombre}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Info de trazabilidad (agente / lugar / oferta) */}
            <div className="w-full md:w-auto text-xs md:text-sm text-slate-300 text-left md:text-right space-y-1">
              {(agenteId || lugarId) && (
                <>
                  {agenteId && (
                    <div>
                      <span className="font-semibold text-slate-100">
                        Agente ID:
                      </span>{" "}
                      {agenteId}
                    </div>
                  )}
                  {lugarId && (
                    <div>
                      <span className="font-semibold text-slate-100">
                        Lugar ID:
                      </span>{" "}
                      {lugarId}
                    </div>
                  )}
                </>
              )}
              {ofertaId && (
                <div>
                  <span className="font-semibold text-slate-100">
                    Oferta ID:
                  </span>{" "}
                  {ofertaId}
                </div>
              )}
              <div className="pt-2 text-[10px] opacity-80">
                Datos de QR y oferta guardados para trazabilidad de
                clientes y comisiones.
              </div>
            </div>
          </div>

          {/* Botón volver dentro de la cabecera */}
          <div className="flex justify-center md:justify-start">
            <button
              type="button"
              onClick={() =>
                router.push(`/bienvenida${buildBackQuery()}`)
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs md:text-sm font-semibold shadow-md shadow-emerald-500/40"
            >
              <span>⬅</span>
              <span>Volver a la pantalla de bienvenida</span>
            </button>
          </div>
        </div>
      </div>

      {/* SELECTOR DE TIPO DE COMPARATIVA */}
      <div className="w-full mb-6 rounded-3xl bg-slate-900/90 border border-slate-700/80 p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_0_32px_rgba(15,23,42,0.9)]">
        <div className="flex flex-wrap gap-2 md:gap-3">
          {(["luz", "gas", "telefonia"] as TipoComparador[]).map(
            (tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoComparador(tipo)}
                className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold shadow transition-all 
                ${
                  tipoComparador === tipo
                    ? "bg-emerald-400 text-slate-900 shadow-emerald-400/60"
                    : "bg-slate-800/80 text-slate-100 hover:bg-slate-700"
                }`}
              >
                {tipo === "luz" && "⚡ Luz"}
                {tipo === "gas" && "🔥 Gas"}
                {tipo === "telefonia" && "📞 Telefonía"}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] md:text-sm text-slate-200">
          <span className="hidden md:inline-block animate-bounce text-xl">
            ⬅️
          </span>
          <span>
            Elige el tipo de estudio que quieres hacer con tu factura.
          </span>
        </div>
      </div>

      {/* CONTENIDO SEGÚN TIPO */}
      {tipoComparador === "luz" && (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FORMULARIO */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-slate-950/90 border border-emerald-500/60 text-slate-50 p-5 md:p-6 shadow-[0_0_32px_rgba(16,185,129,0.55)] space-y-4">
            <div className="flex flex-col items-center justify-center mb-2 space-y-2">
              <Image
                src="/logo-impulso.png"
                alt="Impulso Energético"
                width={140}
                height={140}
                className="drop-shadow-[0_0_16px_rgba(16,231,152,0.75)]"
              />
              <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-100 font-semibold">
                Datos de la factura
              </p>
            </div>

            <h2 className="text-lg font-bold">
              Introduce los datos para tu comparativa
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-3 text-xs md:text-sm"
            >
              <div className="space-y-2">
                <div>
                  <label className="block font-semibold mb-1">
                    Nombre del cliente
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Dirección completa
                  </label>
                  <input
                    type="text"
                    placeholder="Calle, número, ciudad, CP..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                    value={direccionCliente}
                    onChange={(e) =>
                      setDireccionCliente(e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Tipo de cliente
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                    value={tipoCliente}
                    onChange={(e) =>
                      setTipoCliente(e.target.value)
                    }
                  >
                    <option value="particular">Particular</option>
                    <option value="autonomo">Autónomo</option>
                    <option value="empresa">Empresa</option>
                    <option value="comunidad">Comunidad</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block font-semibold mb-1">
                    Tipo de tarifa
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                    value={tipoTarifa}
                    onChange={(e) =>
                      setTipoTarifa(e.target.value)
                    }
                  >
                    <option value="fija">Fija</option>
                    <option value="indexada">Indexada</option>
                    <option value="ambas">Ambas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Nombre de tarifa
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                    value={nombreTarifa}
                    onChange={(e) =>
                      setNombreTarifa(e.target.value)
                    }
                  >
                    <option value="2.0TD">2.0TD</option>
                    <option value="3.0TD">3.0TD</option>
                    <option value="6.1TD">6.1TD</option>
                    <option value="6.2TD">6.2TD</option>
                  </select>
                </div>
              </div>

              <input
                type="text"
                placeholder="CUPS (opcional)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                value={cups}
                onChange={(e) => setCups(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                  value={fechaInicio}
                  onChange={(e) =>
                    setFechaInicio(e.target.value)
                  }
                />
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Consumo por periodos (kWh)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {periodosConsumo.map((p) => (
                    <div key={p} className="space-y-1">
                      <span className="text-[11px] text-emerald-100">
                        Periodo {p}
                      </span>
                      <input
                        type="number"
                        className="w-full px-2 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                        value={consumoPeriodos[p]}
                        onChange={(e) =>
                          handlePeriodoChange(e, p)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <input
                type="text"
                readOnly
                placeholder="Consumo anual (kWh)"
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-emerald-100 text-sm"
                value={consumoAnual}
              />

              <div>
                <label className="block font-semibold mb-1">
                  Potencia contratada (kW)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {periodosPotencia.map((p) => (
                    <div key={p} className="space-y-1">
                      <span className="text-[11px] text-emerald-100">
                        Periodo {p}
                      </span>
                      <input
                        type="number"
                        className="w-full px-2 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                        value={potencias[p]}
                        onChange={(e) =>
                          handlePotenciaChange(e, p)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <select
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                value={impuestoElectricidad}
                onChange={(e) =>
                  setImpuestoElectricidad(e.target.value)
                }
              >
                <option value="5.113">
                  Impuesto Electricidad: 5,113%
                </option>
                <option value="3.8">3,8%</option>
                <option value="2.5">2,5%</option>
                <option value="0.5">0,5%</option>
              </select>

              <select
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                value={territorio}
                onChange={(e) =>
                  setTerritorio(e.target.value)
                }
              >
                <option value="peninsula">
                  Territorio: Península
                </option>
                <option value="baleares">Baleares</option>
                <option value="canarias">Canarias</option>
                <option value="melilla">Melilla</option>
                <option value="ceuta">Ceuta</option>
              </select>

              <input
                type="number"
                placeholder="Importe total factura (€)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                value={importeFactura}
                onChange={(e) =>
                  setImporteFactura(e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Reactiva (€)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                value={reactiva}
                onChange={(e) => setReactiva(e.target.value)}
              />
              <input
                type="number"
                placeholder="Exceso de potencia (€)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                value={exceso}
                onChange={(e) => setExceso(e.target.value)}
              />
              <input
                type="number"
                placeholder="Alquiler contador (€)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                value={alquiler}
                onChange={(e) => setAlquiler(e.target.value)}
              />
              <input
                type="number"
                placeholder="Otros conceptos (€)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                value={otros}
                onChange={(e) => setOtros(e.target.value)}
              />

              <button
                type="submit"
                className="w-full mt-1 rounded-full bg-emerald-400 text-slate-950 py-2.5 text-sm font-bold shadow-[0_0_24px_rgba(16,185,129,0.7)] hover:bg-emerald-300 transition"
              >
                Ver ofertas y comisiones
              </button>
            </form>
          </div>

          {/* RESULTADOS */}
          <div className="md:col-span-2 rounded-3xl bg-slate-950/90 border border-slate-800 p-4 md:p-6 shadow-[0_0_28px_rgba(15,23,42,0.9)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-emerald-300">
                  Resultados de tu estudio
                </h2>
                <p className="text-xs text-slate-400">
                  Comparamos coste de factura, ahorro estimado y comisión
                  para Impulso Energético.
                </p>
              </div>

              {(nombreCliente ||
                direccionCliente ||
                nombreAgente ||
                nombreLugar) && (
                <div className="text-[11px] md:text-xs text-slate-200 md:text-right space-y-0.5">
                  {nombreCliente && (
                    <div>
                      <span className="font-semibold">
                        Cliente:
                      </span>{" "}
                      {nombreCliente}
                    </div>
                  )}
                  {direccionCliente && (
                    <div>
                      <span className="font-semibold">
                        Dirección:
                      </span>{" "}
                      {direccionCliente}
                    </div>
                  )}
                  {nombreAgente && (
                    <div>
                      <span className="font-semibold">
                        Agente:
                      </span>{" "}
                      {nombreAgente}
                    </div>
                  )}
                  {nombreLugar && (
                    <div>
                      <span className="font-semibold">
                        Lugar:
                      </span>{" "}
                      {nombreLugar}
                    </div>
                  )}
                  {agenteId && (
                    <div className="text-[10px] text-slate-400">
                      ID Agente: {agenteId}
                    </div>
                  )}
                  {lugarId && (
                    <div className="text-[10px] text-slate-400">
                      ID Lugar: {lugarId}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BOTONES DE ORDENACIÓN + GRÁFICA */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  onClick={() => ordenarResultados("compañia")}
                  className={`px-3 py-1.5 rounded-full border text-xs ${
                    orden === "compañia"
                      ? "bg-emerald-400 text-slate-900 border-emerald-300"
                      : "bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  Ordenar por compañía
                </button>
                <button
                  onClick={() => ordenarResultados("ahorro")}
                  className={`px-3 py-1.5 rounded-full border text-xs ${
                    orden === "ahorro"
                      ? "bg-emerald-400 text-slate-900 border-emerald-300"
                      : "bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  Ordenar por ahorro
                </button>
                <button
                  onClick={() => ordenarResultados("comision")}
                  className={`px-3 py-1.5 rounded-full border text-xs ${
                    orden === "comision"
                      ? "bg-emerald-400 text-slate-900 border-emerald-300"
                      : "bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  Ordenar por comisión
                </button>
              </div>

              <button
                onClick={() => setMostrarGrafica(!mostrarGrafica)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-slate-950 text-xs md:text-sm font-semibold shadow-[0_0_18px_rgba(16,185,129,0.6)] hover:bg-emerald-400"
              >
                📊 {mostrarGrafica ? "Ocultar gráfica" : "Ver gráfica"}
              </button>
            </div>

            {mostrarGrafica && (
              <div className="mb-6 rounded-2xl bg-slate-900/90 border border-slate-700 p-4">
                <h3 className="text-sm md:text-base font-semibold text-emerald-200 mb-3 text-center">
                  Comparativa visual de ahorro y comisión
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={resultados}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <XAxis dataKey="compañia" stroke="#e5e7eb" />
                      <YAxis stroke="#e5e7eb" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid #4ade80",
                          borderRadius: "0.75rem",
                          fontSize: "0.75rem",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="ahorro" name="Ahorro (€)" />
                      <Bar dataKey="comision" name="Comisión (€)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {resultados.length === 0 ? (
              <p className="text-xs md:text-sm text-slate-400">
                Introduce los datos de la factura y pulsa{" "}
                <span className="text-emerald-300 font-semibold">
                  “Ver ofertas y comisiones”
                </span>{" "}
                para ver resultados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm text-left border-separate border-spacing-y-2">
                  <thead className="bg-slate-900/90">
                    <tr className="text-slate-200">
                      <th className="px-4 py-2 font-semibold">#</th>
                      <th className="px-4 py-2 font-semibold">
                        Compañía
                      </th>
                      <th className="px-4 py-2 font-semibold">
                        Tarifa
                      </th>
                      <th className="px-4 py-2 font-semibold text-right">
                        Coste estimado
                      </th>
                      <th className="px-4 py-2 font-semibold text-right">
                        Ahorro
                      </th>
                      <th className="px-4 py-2 font-semibold text-right">
                        Comisión
                      </th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((r, i) => (
                      <tr
                        key={r.id}
                        className="bg-slate-900/80 border border-slate-700/80 rounded-xl shadow-sm"
                      >
                        <td className="px-4 py-2 font-bold text-slate-400">
                          #{i + 1}
                        </td>
                        <td className="px-4 py-2 font-semibold text-slate-50">
                          {r.compañia}
                        </td>
                        <td className="px-4 py-2 text-slate-200">
                          {r.tarifa}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-50">
                          {r.coste.toFixed(2)} €
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="text-emerald-400 font-semibold">
                            {r.ahorro.toFixed(2)} €
                          </span>
                          <br />
                          <span className="text-amber-300 font-bold text-[11px]">
                            {r.ahorroPct.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-sky-300 font-semibold">
                          {r.comision.toFixed(2)} €
                        </td>
                        <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                          <button
                            className="mb-1 inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-semibold hover:bg-emerald-400"
                            onClick={() =>
                              alert(`Contratar ${r.compañia}`)
                            }
                          >
                            Contratar
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-800 text-slate-50 text-[11px] font-semibold hover:bg-slate-700"
                            onClick={() =>
                              alert(
                                `Descargar PDF para ${r.compañia}`
                              )
                            }
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tipoComparador === "gas" && (
        <div className="w-full max-w-3xl mx-auto mt-10 rounded-3xl bg-slate-950/90 border border-slate-800 p-8 text-center text-sm md:text-base text-slate-200 shadow-[0_0_28px_rgba(15,23,42,0.9)]">
          🔥{" "}
          <span className="font-semibold">
            Comparador de Gas disponible próximamente
          </span>
          . Lo estamos preparando con el mismo nivel de detalle y
          comisiones que luz.
        </div>
      )}

      {tipoComparador === "telefonia" && (
        <div className="w-full max-w-3xl mx-auto mt-10 rounded-3xl bg-slate-950/90 border border-slate-800 p-8 text-center text-sm md:text-base text-slate-200 shadow-[0_0_28px_rgba(15,23,42,0.9)]">
          📞{" "}
          <span className="font-semibold">
            Comparador de Telefonía disponible próximamente
          </span>
          . Podrás ver tarifas móviles, fibra y packs con comisión para
          el club y para ti.
        </div>
      )}
    </div>
  );
}
