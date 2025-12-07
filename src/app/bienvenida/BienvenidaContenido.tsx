"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ModalDatosCliente } from "./ModalDatosCliente";
import { HeroBienvenida } from "./HeroBienvenida";
import { getCardStylePorTipo } from "./helpers/getCardStylePorTipo";
import { getVisualConfigPorTipo } from "./helpers/tipoVisualConfig";


import { TipoOferta } from "./types";


interface Oferta {
  id: string;
  titulo: string;
  descripcionCorta: string;
  descripcionLarga: string;
  tipo: TipoOferta;          // 👈 ya NO `| string`
  destacada: boolean;
  activa: boolean;
  creadaEn?: string | null;
}


interface TarifaResumen {
  id: number;
  tipo: string;
  subtipo: string;
  compania: string;
  nombre: string;

  precioKwhP1: number | null;
  precioKwhP2: number | null;
  precioKwhP3: number | null;

  potenciaP1?: number | null;
  potenciaP2?: number | null;
  potenciaP3?: number | null;
  potenciaP4?: number | null;
  potenciaP5?: number | null;
  potenciaP6?: number | null;

  energiaP1?: number | null;
  energiaP2?: number | null;
  energiaP3?: number | null;
  energiaP4?: number | null;
  energiaP5?: number | null;
  energiaP6?: number | null;
}

/** Config visual por tipo de oferta (para pills y botones) */


/** Normaliza el tipo que viene de BD al enum que usamos aquí */
function normalizarTipoOferta(raw: string | undefined | null): TipoOferta {
  const v = String(raw || "").toUpperCase();

  if (v === "LUZ") return "LUZ";
  if (v === "GAS") return "GAS";
  if (v === "TELEFONIA" || v === "TELÉFONIA") return "TELEFONIA";
  if (v === "SOLAR") return "SOLAR";
  if (v === "AEROTERMIA" || v === "GEOTERMIA") return "AEROTERMIA";
  if (v === "BATERIA" || v === "BATERÍA" || v === "BATERIA IA") return "BATERIA";
  if (v === "FERRETERIA" || v === "FERRETERÍA") return "FERRETERIA";
  if (v === "INMOBILIARIA") return "INMOBILIARIA";
  if (v === "VIAJES") return "VIAJES";
  if (v === "REPUESTOS" || v === "REPUESTO") return "REPUESTOS";
  if (v === "SEGUROS" || v === "SEGURO") return "SEGUROS";
  if (v === "GANGAS") return "GANGAS";
  if (v === "HIPOTECAS" || v === "FINANCIACION" || v === "FINANCIACIÓN")
    return "HIPOTECAS";
  if (v === "PLADUR") return "PLADUR";

  // por defecto, lo consideramos LUZ
  return "LUZ";
}

/** Qué tipo de oferta corresponde a cada sección del grid de secciones */
const tipoPorSeccion: Record<string, TipoOferta | null> = {
  luz: "LUZ",
  gas: "GAS",
  telefonia: "TELEFONIA",
  solar: "SOLAR",
  aerotermia: "AEROTERMIA",
  hermes: "BATERIA",
  ferreteria: "FERRETERIA",
  inmobiliaria: "INMOBILIARIA",
  viajes: "VIAJES",
  repuestos: "REPUESTOS",
  seguros: "SEGUROS",
  gangas: "GANGAS",
  hipotecas: "HIPOTECAS",
  pladur: "PLADUR",
};

// 🔥 Mensajes afinados por sección
const DESCRIPCIONES_SECCION: Record<string, string> = {
  luz: "Ahorra cada mes en tu factura con las tarifas más competitivas del mercado. Estudio personalizado incluido.",
  gas: "Optimiza tu suministro con precios ajustados y estabilidad a largo plazo. Comparación inmediata.",
  telefonia: "Fibra, móvil y TV con las mejores compañías. Packs especiales y promociones activas.",
  solar: "Instalación de paneles solares con retorno asegurado. Ahorro real desde el primer mes.",
  aerotermia: "Reduce hasta un 70% tu gasto en calefacción y ACS con sistemas de alta eficiencia.",
  hermes: "Batería HERMES-IA: autonomía, ahorro y gestión inteligente del consumo energético.",
  ferreteria: "Miles de productos BRICOTITAN al mejor precio. Calidad profesional garantizada.",
  inmobiliaria: "Compra, vende o alquila con asesoramiento experto y análisis de mercado.",
  viajes: "Viajes únicos con VIAJANDO CON MERY. Experiencias seleccionadas y precios finales claros.",
  repuestos: "Repuestos de coche rápidos y económicos. Marcas oficiales y alternativas.",
  seguros: "Protección total en hogar, coche, salud, comercio y más. Comparativa entre varias compañías.",
  gangas: "Ofertas explosivas, últimas unidades y descuentos reales. ¡Corre antes de que vuelen!",
  hipotecas: "Mejora tu cuota, reunifica deudas o consigue la mejor hipoteca del mercado.",
  pladur: "Soluciones en pladur DICOPLAC: obra nueva, reformas y montajes profesionales.",
};

// Función helper tipada (esta es la que usaremos en el JSX)
const descripcionPorSeccion = (id: string): string =>
  DESCRIPCIONES_SECCION[id] ??
  "Ofertas especiales seleccionadas para este servicio.";

// 🔥 Métricas visuales por sección (KPIs)
type KPIMetrica = {
  label: string;
  value: string;
  hint?: string;
  icon?: string;
};

const metricasPorSeccion: Record<string, KPIMetrica[]> = {
  luz: [
    {
      icon: "💡",
      label: "Ahorro medio luz",
      value: "hasta 28%",
      hint: "Sobre tarifas estándar de mercado",
    },
    {
      icon: "📊",
      label: "Estudios realizados",
      value: "+3.200",
      hint: "Comparativas personalizadas de luz",
    },
    {
      icon: "⭐",
      label: "Nivel de satisfacción",
      value: "4,9 / 5",
      hint: "Valoración media de nuestros clientes",
    },
  ],
  gas: [
    {
      icon: "🔥",
      label: "Consumo optimizado",
      value: "hasta 20%",
      hint: "Ajuste de potencias y términos fijos",
    },
    {
      icon: "📆",
      label: "Estabilidad de precio",
      value: "12 meses",
      hint: "Sin sustos por cambios bruscos",
    },
    {
      icon: "🙌",
      label: "Clientes satisfechos",
      value: "+1.500",
      hint: "Gestión y seguimiento continuo",
    },
  ],
  telefonia: [
    {
      icon: "📶",
      label: "Packs fibra+móvil",
      value: "desde 29€/mes",
      hint: "Con llamadas ilimitadas incluidas",
    },
    {
      icon: "📺",
      label: "TV y plataformas",
      value: "+8 opciones",
      hint: "Configura tu paquete a medida",
    },
    {
      icon: "⚡",
      label: "Altas y cambios",
      value: "< 48h",
      hint: "Tramitación rápida con soporte",
    },
  ],
  solar: [
    {
      icon: "☀️",
      label: "Ahorro energético",
      value: "hasta 60%",
      hint: "En la factura de luz anual",
    },
    {
      icon: "⏱️",
      label: "Retorno inversión",
      value: "4–7 años",
      hint: "Según consumo y ubicación",
    },
    {
      icon: "🏡",
      label: "Instalaciones realizadas",
      value: "+250",
      hint: "Entre hogares y negocios",
    },
  ],
  aerotermia: [
    {
      icon: "🌬️",
      label: "Ahorro calefacción",
      value: "hasta 70%",
      hint: "Frente a sistemas tradicionales",
    },
    {
      icon: "🏠",
      label: "Viviendas adaptadas",
      value: "+140",
      hint: "Unidades interiores instaladas",
    },
    {
      icon: "♻️",
      label: "Eficiencia energética",
      value: "Clase A+++",
      hint: "Equipos de última generación",
    },
  ],
  hermes: [
    {
      icon: "🔋",
      label: "Autonomía media",
      value: "hasta 85%",
      hint: "Cobertura de consumos nocturnos",
    },
    {
      icon: "🤖",
      label: "Gestión inteligente",
      value: "24/7",
      hint: "Optimización automática IA",
    },
    {
      icon: "💶",
      label: "Retorno estimado",
      value: "5–8 años",
      hint: "Según perfil de consumo",
    },
  ],
  ferreteria: [
    {
      icon: "🔩",
      label: "Referencias activas",
      value: "+5.000",
      hint: "Catálogo BRICOTITAN actualizado",
    },
    {
      icon: "🚚",
      label: "Entrega media",
      value: "24–72h",
      hint: "En la mayoría de productos",
    },
    {
      icon: "🏗️",
      label: "Calidad profesional",
      value: "Garantizada",
      hint: "Materiales para uso intensivo",
    },
  ],
  inmobiliaria: [
    {
      icon: "🏡",
      label: "Operaciones gestionadas",
      value: "+380",
      hint: "Compra, venta y alquiler",
    },
    {
      icon: "📉",
      label: "Mejora cuota hipoteca",
      value: "hasta 25%",
      hint: "Media en revisiones y cambios",
    },
    {
      icon: "🧾",
      label: "Asesoramiento",
      value: "100% incluido",
      hint: "Acompañamiento en todo el proceso",
    },
  ],
  viajes: [
    {
      icon: "✈️",
      label: "Viajes organizados",
      value: "+420",
      hint: "Por VIAJANDO CON MERY",
    },
    {
      icon: "🌍",
      label: "Destinos disponibles",
      value: "+60",
      hint: "Europa, Caribe y grandes viajes",
    },
    {
      icon: "💺",
      label: "Plazas preferentes",
      value: "Limitadas",
      hint: "Reservas con mejores condiciones",
    },
  ],
  repuestos: [
    {
      icon: "🚗",
      label: "Piezas disponibles",
      value: "+12.000",
      hint: "Originales y equivalentes",
    },
    {
      icon: "⏱️",
      label: "Tiempo medio entrega",
      value: "24–48h",
      hint: "En repuestos más demandados",
    },
    {
      icon: "🛠️",
      label: "Aplicaciones",
      value: "+30 marcas",
      hint: "Turismos, furgonetas y más",
    },
  ],
  seguros: [
    {
      icon: "🛡️",
      label: "Ramos asegurados",
      value: "+10",
      hint: "Hogar, auto, salud, comercio, etc.",
    },
    {
      icon: "🏦",
      label: "Aseguradoras",
      value: "+15",
      hint: "Comparamos entre múltiples compañías",
    },
    {
      icon: "💶",
      label: "Ahorro medio póliza",
      value: "hasta 30%",
      hint: "Respecto a renovación estándar",
    },
  ],
  gangas: [
    {
      icon: "🛍️",
      label: "Descuentos activos",
      value: "hasta -70%",
      hint: "Últimas unidades y promos relámpago",
    },
    {
      icon: "⏳",
      label: "Duración ofertas",
      value: "muy limitada",
      hint: "Solo mientras haya stock",
    },
    {
      icon: "💣",
      label: "Chollos destacados",
      value: "actualizados",
      hint: "Revisa esta sección cada semana",
    },
  ],
  hipotecas: [
    {
      icon: "🏦",
      label: "Bancos analizados",
      value: "+14",
      hint: "Comparativa de condiciones completas",
    },
    {
      icon: "📉",
      label: "Reducción cuota",
      value: "hasta 35%",
      hint: "Con cambios de banco o revisión",
    },
    {
      icon: "📆",
      label: "Plazos",
      value: "hasta 30 años",
      hint: "Estudio personalizado de viabilidad",
    },
  ],
  pladur: [
    {
      icon: "🏗️",
      label: "Proyectos ejecutados",
      value: "+220",
      hint: "Obra nueva y reformas integrales",
    },
    {
      icon: "🎯",
      label: "Especialización",
      value: "DICOPLAC",
      hint: "Sistemas técnicos de alta calidad",
    },
    {
      icon: "🧱",
      label: "Soluciones",
      value: "a medida",
      hint: "Acústicas, térmicas y decorativas",
    },
  ],
};


// 📊 Mini-resumen numérico por sección (chips)
const resumenNumericoPorSeccion: Record<
  string,
  { label: string; value: string }[]
> = {
  luz: [
    { label: "Ahorro medio clientes", value: "≈ 220 €/año" },
    { label: "Descuento potencia", value: "hasta 35%" },
    { label: "Comercializadoras", value: "+25 analizadas" },
  ],
  gas: [
    { label: "Consumo optimizado", value: "hasta 20%" },
    { label: "Clientes satisfechos", value: "+1.500" },
  ],
  telefonia: [
    { label: "Packs convergentes", value: "Fibra + Móvil + TV" },
    { label: "Ahorro medio", value: "≈ 18 €/mes" },
  ],
  solar: [
    { label: "Retorno inversión", value: "5-7 años" },
    { label: "Ahorro factura", value: "hasta 60%" },
  ],
  aerotermia: [
    { label: "Ahorro calefacción", value: "hasta 70%" },
    { label: "Financiación", value: "hasta 120 meses" },
  ],
  hermes: [
    { label: "Autonomía", value: "hasta 85%" },
    { label: "Gestión IA", value: "24/7 en la nube" },
  ],
  ferreteria: [
    { label: "Productos activos", value: "+3.000" },
    { label: "Entrega", value: "24-48 h" },
  ],
  inmobiliaria: [
    { label: "Operaciones anuales", value: "+80" },
    { label: "Ahorro medio comprador", value: "≈ 9.000 €" },
  ],
  viajes: [
    { label: "Descuento socios", value: "hasta 15%" },
    { label: "Viajes organizados", value: "+40/año" },
  ],
  repuestos: [
    { label: "Disponibilidad", value: "+20.000 ref." },
    { label: "Entrega rápida", value: "24-48 h" },
  ],
  seguros: [
    { label: "Compañías", value: "+15 comparadas" },
    { label: "Ahorro pólizas", value: "hasta 30%" },
  ],
  gangas: [
    { label: "Descuentos", value: "hasta 70%" },
    { label: "Unidades limitadas", value: "stock diario" },
  ],
  hipotecas: [
    { label: "Mejora cuota", value: "hasta 40%" },
    { label: "Operaciones financiadas", value: "+200" },
  ],
  pladur: [
    { label: "Proyectos/año", value: "+120" },
    { label: "Plazos de obra", value: "desde 7 días" },
  ],
};


// 🔥 KPI por sección (números potentes)
const kpiPorSeccion: Record<
  string,
  { label: string; value: string }[]
> = {
  luz: [
    { label: "Ahorro medio", value: "32% anual" },
    { label: "Clientes felices", value: "+3.200" },
  ],
  gas: [
    { label: "Ahorro anual", value: "Hasta 148€" },
    { label: "Estabilidad", value: "Precios fijos 12 meses" },
  ],
  telefonia: [
    { label: "Fibra + Móvil", value: "desde 29,90€" },
    { label: "Cobertura", value: "Más de 99%" },
  ],
  solar: [
    { label: "Retorno", value: "3-5 años" },
    { label: "Ahorro", value: "-70% consumo" },
  ],
  aerotermia: [
    { label: "Ahorro", value: "-65%" },
    { label: "Eficiencia", value: "A+++ garantizado" },
  ],
  hermes: [
    { label: "Autonomía", value: "Hasta 48h" },
    { label: "Inteligencia IA", value: "Ahorro automático" },
  ],
  repuestos: [
    { label: "Marcas disponibles", value: "+4.000" },
    { label: "Entrega", value: "24-48h" },
  ],
  seguros: [
    { label: "Comparativa", value: "+12 compañías" },
    { label: "Precio medio", value: "Hasta -28%" },
  ],
  gangas: [
    { label: "Descuentos", value: "Hasta -80%" },
    { label: "Unidades", value: "Muy limitadas" },
  ],
  hipotecas: [
    { label: "Revisión cuota", value: "Hasta -38%" },
    { label: "Tipos fijos", value: "desde 1,69%" },
  ],
  ferreteria: [
    { label: "Productos", value: "+20.000" },
    { label: "Ofertas", value: "diarias" },
  ],
  inmobiliaria: [
    { label: "Gestiones", value: "+1.000/año" },
    { label: "Rentabilidad", value: "hasta 8%" },
  ],
  viajes: [
    { label: "Experiencias", value: "únicas" },
    { label: "Ofertas", value: "actualizadas" },
  ],
  pladur: [
    { label: "Montajes", value: "rápidos" },
    { label: "Garantía", value: "100%" },
  ],
};


/** Texto para el botón grande de cada sección en la parte de ofertas */
const textoBotonSeccion = (seccionId: string, label: string) => {
  switch (seccionId) {
    case "luz":
      return "Ir al comparador de Luz";
    case "gas":
      return "Ir al comparador de Gas";
    case "telefonia":
      return "Ir al comparador de Telefonía";
    default:
      return `Ir a ${label}`;
  }
};

export default function BienvenidaContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clubNombre = searchParams.get("club");

  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tarifasLuz, setTarifasLuz] = useState<TarifaResumen[]>([]);
  const [loadingTarifasLuz, setLoadingTarifasLuz] = useState(false);
  const [errorTarifasLuz, setErrorTarifasLuz] = useState<string | null>(null);

  // Buscador específico para el catálogo de luz
  const [busquedaTarifasLuz, setBusquedaTarifasLuz] = useState("");

  const tarifasLuzFiltradas = useMemo(() => {
    const txt = busquedaTarifasLuz.trim().toLowerCase();
    if (!txt) return tarifasLuz;

    return tarifasLuz.filter((t) => {
      const cadena =
        `${t.compania || ""} ${t.nombre || ""} ${t.subtipo || ""} ${t.tipo || ""}`.toLowerCase();
      return cadena.includes(txt);
    });
  }, [busquedaTarifasLuz, tarifasLuz]);


  const [busqueda, setBusqueda] = useState("");

  const [nombre, setNombre] = useState<string | null>(null);
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);
  const [leadOK, setLeadOK] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardarError, setMensajeGuardarError] = useState<string | null>(
    null
  );
  const [mensajeGuardarOK, setMensajeGuardarOK] = useState<string | null>(null);

  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null);
  const [clubMensaje, setClubMensaje] = useState<string | null>(null);
  const [clubAportacion, setClubAportacion] = useState<number | null>(null);
  const [clubColorAcento, setClubColorAcento] = useState<string>("#22c55e");

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

    const clubLogoParam = searchParams.get("clubLogo");
    const clubMensajeParam = searchParams.get("clubMensaje");
    const clubAportacionParam = searchParams.get("clubAportacion");
    const clubColorParam = searchParams.get("clubColor");

    if (clubLogoParam) {
      try {
        setClubLogoUrl(decodeURIComponent(clubLogoParam));
      } catch {
        setClubLogoUrl(clubLogoParam);
      }
    }
    if (clubMensajeParam) setClubMensaje(clubMensajeParam);
    if (clubAportacionParam) {
      const num = Number(clubAportacionParam);
      if (!Number.isNaN(num)) setClubAportacion(num);
    }
    if (clubColorParam) setClubColorAcento(clubColorParam);
  }, [searchParams]);

  useEffect(() => {
    if (!agenteId && !lugarId) return;

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    let changed = false;

    if (agenteId && !params.get("agenteId")) {
      params.set("agenteId", agenteId);
      changed = true;
    }

    if (lugarId && !params.get("lugarId")) {
      params.set("lugarId", lugarId);
      changed = true;
    }

    if (changed) {
      const qs = params.toString();
      router.replace(`/bienvenida${qs ? `?${qs}` : ""}`);
    }
  }, [agenteId, lugarId, router, searchParams]);

  useEffect(() => {
    if (!lugarId) return;

    const cargarLugar = async () => {
      try {
        const res = await fetch(`/api/lugares/${lugarId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data = await res.json();
        const lugar = (data && (data.lugar || data)) || null;
        if (!lugar) return;

        if (lugar.especial === false) return;

        const posibleLogo: string | null = lugar.especialLogoUrl ?? null;
        const posibleMensaje: string | null = lugar.especialMensaje ?? null;

        let posibleAportacion: number | null = null;
        if (typeof lugar.aportacionAcumulada === "number") {
          posibleAportacion = lugar.aportacionAcumulada;
        } else if (typeof lugar.aportacionAcumulada === "string") {
          const n = Number(lugar.aportacionAcumulada);
          posibleAportacion = Number.isNaN(n) ? null : n;
        }

        const posibleColor: string | null = lugar.especialColor ?? null;

        if (posibleLogo && !clubLogoUrl) setClubLogoUrl(posibleLogo);
        if (posibleMensaje && !clubMensaje) setClubMensaje(posibleMensaje);
        if (
          posibleAportacion != null &&
          !Number.isNaN(posibleAportacion) &&
          clubAportacion == null
        ) {
          setClubAportacion(posibleAportacion);
        }
        if (posibleColor && !searchParams.get("clubColor")) {
          setClubColorAcento(posibleColor);
        }
      } catch (err) {
        console.error("Error cargando lugar especial", err);
      }
    };

    cargarLugar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lugarId]);

  useEffect(() => {
    setFormNombre(nombre || "");

    try {
      const storedNombre = localStorage.getItem("clienteNombre");
      const storedEmail = localStorage.getItem("clienteEmail");
      const storedTel = localStorage.getItem("clienteTelefono");

      if (storedNombre) setFormNombre(storedNombre);
      if (storedEmail) setFormEmail(storedEmail);
      if (storedTel) setFormTelefono(storedTel);
    } catch {
      // ignore
    }
  }, [nombre]);

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

  useEffect(() => {
    const cargarTarifasLuz = async () => {
      try {
        setLoadingTarifasLuz(true);
        setErrorTarifasLuz(null);

        const res = await fetch("/api/ofertas-tarifas?tipo=LUZ&activa=true", {
          cache: "no-store",
        });
        if (!res.ok)
          throw new Error("No se pudieron cargar las tarifas de luz");

        const data = await res.json();
        const items = data.items || [];

        const lista: TarifaResumen[] = items.map((t: any) => ({
          id: t.id,
          tipo: t.tipo,
          subtipo: t.subtipo,
          compania: t.compania,
          nombre: t.nombre,
          precioKwhP1: t.precioKwhP1 != null ? Number(t.precioKwhP1) : null,
          precioKwhP2: t.precioKwhP2 != null ? Number(t.precioKwhP2) : null,
          precioKwhP3: t.precioKwhP3 != null ? Number(t.precioKwhP3) : null,
          potenciaP1:
            t.potenciaP1 != null
              ? Number(t.potenciaP1)
              : t.potencia_p1 != null
              ? Number(t.potencia_p1)
              : t.precioPotenciaP1 != null
              ? Number(t.precioPotenciaP1)
              : null,
          potenciaP2:
            t.potenciaP2 != null
              ? Number(t.potenciaP2)
              : t.potencia_p2 != null
              ? Number(t.potencia_p2)
              : t.precioPotenciaP2 != null
              ? Number(t.precioPotenciaP2)
              : null,
          potenciaP3:
            t.potenciaP3 != null
              ? Number(t.potenciaP3)
              : t.potencia_p3 != null
              ? Number(t.potencia_p3)
              : t.precioPotenciaP3 != null
              ? Number(t.precioPotenciaP3)
              : null,
          potenciaP4:
            t.potenciaP4 != null
              ? Number(t.potenciaP4)
              : t.potencia_p4 != null
              ? Number(t.potencia_p4)
              : t.precioPotenciaP4 != null
              ? Number(t.precioPotenciaP4)
              : null,
          potenciaP5:
            t.potenciaP5 != null
              ? Number(t.potenciaP5)
              : t.potencia_p5 != null
              ? Number(t.potencia_p5)
              : t.precioPotenciaP5 != null
              ? Number(t.precioPotenciaP5)
              : null,
          potenciaP6:
            t.potenciaP6 != null
              ? Number(t.potenciaP6)
              : t.potencia_p6 != null
              ? Number(t.potencia_p6)
              : t.precioPotenciaP6 != null
              ? Number(t.precioPotenciaP6)
              : null,
          energiaP1:
            t.energiaP1 != null
              ? Number(t.energiaP1)
              : t.energia_p1 != null
              ? Number(t.energia_p1)
              : t.precioKwhP1 != null
              ? Number(t.precioKwhP1)
              : null,
          energiaP2:
            t.energiaP2 != null
              ? Number(t.energiaP2)
              : t.energia_p2 != null
              ? Number(t.energia_p2)
              : t.precioKwhP2 != null
              ? Number(t.precioKwhP2)
              : null,
          energiaP3:
            t.energiaP3 != null
              ? Number(t.energiaP3)
              : t.energia_p3 != null
              ? Number(t.energia_p3)
              : t.precioKwhP3 != null
              ? Number(t.precioKwhP3)
              : null,
          energiaP4:
            t.energiaP4 != null
              ? Number(t.energiaP4)
              : t.energia_p4 != null
              ? Number(t.energia_p4)
              : null,
          energiaP5:
            t.energiaP5 != null
              ? Number(t.energiaP5)
              : t.energia_p5 != null
              ? Number(t.energia_p5)
              : null,
          energiaP6:
            t.energiaP6 != null
              ? Number(t.energiaP6)
              : t.energia_p6 != null
              ? Number(t.energia_p6)
              : null,
        }));

        setTarifasLuz(lista);
      } catch (err: any) {
        setErrorTarifasLuz(
          err?.message || "Error al cargar las tarifas de luz"
        );
      } finally {
        setLoadingTarifasLuz(false);
      }
    };

    cargarTarifasLuz();
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

  const sugerencias = useMemo(() => {
    const txt = busqueda.trim();
    if (txt.length < 2) return [];
    return ofertasFiltradas.slice(0, 8);
  }, [busqueda, ofertasFiltradas]);

    const totalNuevasGlobal = useMemo(
      () => ofertasFiltradas.filter((o) => esOfertaNueva(o)).length,
      [ofertasFiltradas]
    );


  // 🔔 Cuántos días consideramos que una oferta es "NUEVA"
  const DIAS_OFERTA_NUEVA = 15;

  /** Devuelve true si la oferta es reciente (NUEVA) */
  function esOfertaNueva(oferta: Oferta): boolean {
    if (!oferta.creadaEn) return false;

    const fecha = new Date(oferta.creadaEn);
    if (Number.isNaN(fecha.getTime())) return false;

    const ahora = new Date();
    const haceNDias = new Date();
    haceNDias.setDate(ahora.getDate() - DIAS_OFERTA_NUEVA);

    return fecha >= haceNDias;
  }



  const formFecha = (f?: string | null) =>
    !f
      ? ""
      : new Date(f).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

  const irAComparador = (tipo?: TipoOferta) => {
    if (tipo === "LUZ")
      router.push(`/comparador${buildQuery({ tipo: "luz" })}`);
    else if (tipo === "GAS")
      router.push(`/comparador${buildQuery({ tipo: "gas" })}`);
    else if (tipo === "TELEFONIA")
      router.push(`/comparador${buildQuery({ tipo: "telefonia" })}`);
    else router.push(`/comparador${buildQuery()}`);
  };

  const irAComparadorConOferta = (tipo: TipoOferta, oferta: Oferta) => {
    const extra: Record<string, string> = {
      ofertaId: String(oferta.id),
    };

    if (oferta.titulo) {
      extra.ofertaNombre = oferta.titulo;
    }

    const key = normalizarTipoOferta(tipo as string);
    if (key === "LUZ") extra.tipo = "luz";
    else if (key === "GAS") extra.tipo = "gas";
    else if (key === "TELEFONIA") extra.tipo = "telefonia";

    router.push(`/comparador${buildQuery(extra)}`);
  };

  const manejarClickSugerencia = (oferta: Oferta) => {
    const tipoNorm = oferta.tipo;  // ya es TipoOferta
    irAComparadorConOferta(tipoNorm, oferta);
    setBusqueda("");
  };


  const manejarGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeGuardarError(null);
    setMensajeGuardarOK(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formNombre,
          email: formEmail,
          telefono: formTelefono,
          agenteId,
          lugarId,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudieron guardar los datos");
      }

      try {
        localStorage.setItem("clienteNombre", formNombre);
        localStorage.setItem("clienteEmail", formEmail);
        localStorage.setItem("clienteTelefono", formTelefono);
        localStorage.setItem("leadOK", "1");
      } catch {
        // ignore
      }

      setLeadOK(true);
      setMensajeGuardarOK("Datos guardados correctamente.");
    } catch (err: any) {
      setMensajeGuardarError(
        err?.message || "Ha ocurrido un error al guardar los datos."
      );
    } finally {
      setGuardando(false);
    }
  };

  /** GRID de secciones (botones grandes de la izquierda) */
  const secciones = [
    {
      id: "luz",
      label: "Luz IMPULSO",
      icon: "💡",
      bgClass:
        "bg-gradient-to-br from-emerald-500/30 via-emerald-500/10 to-slate-950/90",
      ringClass: "ring-emerald-400/70 group-hover:ring-emerald-200/90",
      onClick: () => irAComparador("LUZ" as TipoOferta),
    },
    {
      id: "gas",
      label: "Gas IMPULSO",
      icon: "🔥",
      bgClass:
        "bg-gradient-to-br from-orange-500/30 via-orange-500/10 to-slate-950/90",
      ringClass: "ring-orange-400/70 group-hover:ring-orange-200/90",
      onClick: () => irAComparador("GAS" as TipoOferta),
    },
    {
      id: "telefonia",
      label: "Telefonía IMPULSO",
      icon: "📶",
      bgClass:
        "bg-gradient-to-br from-sky-500/30 via-sky-500/10 to-slate-950/90",
      ringClass: "ring-sky-400/70 group-hover:ring-sky-200/90",
      onClick: () => irAComparador("TELEFONIA" as TipoOferta),
    },
    {
      id: "solar",
      label: "Solar IMPULSO",
      icon: "☀️",
      bgClass:
        "bg-gradient-to-br from-amber-400/35 via-amber-400/10 to-slate-950/90",
      ringClass: "ring-amber-300/70 group-hover:ring-amber-100/90",
      onClick: () => router.push(`/solar${buildQuery()}`),
    },
    {
      id: "aerotermia",
      label: "Aerotermia y Geotermia IMPULSO",
      icon: "🌬️",
      bgClass:
        "bg-gradient-to-br from-cyan-400/30 via-cyan-400/10 to-slate-950/90",
      ringClass: "ring-cyan-300/70 group-hover:ring-cyan-100/90",
      onClick: () => router.push(`/aerotermia${buildQuery()}`),
    },
    {
      id: "hermes",
      label: "Batería IA",
      icon: "🔋",
      bgClass:
        "bg-gradient-to-br from-purple-500/35 via-purple-500/10 to-slate-950/90",
      ringClass: "ring-purple-400/70 group-hover:ring-purple-200/90",
      onClick: () => router.push(`/bateria-hermes${buildQuery()}`),
    },
    {
      id: "ferreteria",
      label: "Ferretería BRICOTITAN",
      icon: "🔩",
      bgClass:
        "bg-gradient-to-br from-lime-400/35 via-lime-400/10 to-slate-950/90",
      ringClass: "ring-lime-300/70 group-hover:ring-lime-100/90",
      onClick: () => router.push(`/ferreteria${buildQuery()}`),
    },
    {
      id: "inmobiliaria",
      label: "Inmobiliaria IMPULSO",
      icon: "🏡",
      bgClass:
        "bg-gradient-to-br from-rose-500/35 via-rose-500/10 to-slate-950/90",
      ringClass: "ring-rose-400/70 group-hover:ring-rose-200/90",
      onClick: () => router.push(`/inmobiliaria${buildQuery()}`),
    },
    {
      id: "viajes",
      label: "Viajes VIAJANDO CON MERY",
      icon: "✈️",
      bgClass:
        "bg-gradient-to-br from-indigo-500/35 via-indigo-500/10 to-slate-950/90",
      ringClass: "ring-indigo-400/70 group-hover:ring-indigo-200/90",
      onClick: () => router.push(`/viajes${buildQuery()}`),
    },
    {
      id: "repuestos",
      label: "Repuestos RAPID",
      icon: "🚗",
      bgClass:
        "bg-gradient-to-br from-orange-400/35 via-orange-400/10 to-slate-950/90",
      ringClass: "ring-orange-300/70 group-hover:ring-orange-100/90",
      onClick: () => router.push(`/repuestos${buildQuery()}`),
    },
    {
      id: "seguros",
      label: "Seguros IMPULSO",
      icon: "🛡️",
      bgClass:
        "bg-gradient-to-br from-slate-400/35 via-slate-400/10 to-slate-950/90",
      ringClass: "ring-slate-300/70 group-hover:ring-slate-100/90",
      onClick: () => router.push(`/seguros${buildQuery()}`),
    },
    {
      id: "gangas",
      label: "La Tienda de las Gangas",
      icon: "🛍️",
      bgClass:
        "bg-gradient-to-br from-pink-500/35 via-pink-500/10 to-slate-950/90",
      ringClass: "ring-pink-300/70 group-hover:ring-pink-100/90",
      onClick: () => router.push(`/gangas${buildQuery()}`),
    },
    {
      id: "hipotecas",
      label: "Hipotecas y Financiación IMPULSO",
      icon: "🏦",
      bgClass:
        "bg-gradient-to-br from-emerald-500/35 via-emerald-500/10 to-slate-950/90",
      ringClass: "ring-emerald-300/70 group-hover:ring-emerald-100/90",
      onClick: () => router.push(`/hipotecas-financiacion${buildQuery()}`),
    },
    {
      id: "pladur",
      label: "Pladur DICOPLAC",
      icon: "🏗️",
      bgClass:
        "bg-gradient-to-br from-zinc-400/35 via-zinc-400/10 to-slate-950/90",
      ringClass: "ring-zinc-300/70 group-hover:ring-zinc-100/90",
      onClick: () => router.push(`/pladur-dicoplac${buildQuery()}`),
    },
  ];

  const accesosRapidos = [
    { label: "Gas", onClick: () => irAComparador("GAS") },
    { label: "Telefonía", onClick: () => irAComparador("TELEFONIA") },
    {
      label: "Ferretería",
      onClick: () => router.push(`/ferreteria${buildQuery()}`),
    },
    { label: "Viajes", onClick: () => router.push(`/viajes${buildQuery()}`) },
    {
      label: "Repuestos",
      onClick: () => router.push(`/repuestos${buildQuery()}`),
    },
    { label: "Seguros", onClick: () => router.push(`/seguros${buildQuery()}`) },
  ];

  const hayClubEspecial =
    !!clubLogoUrl || !!clubMensaje || !!clubNombre || clubAportacion !== null;
  
  // Filtro activo por sección del carrusel: "todas" | "destacadas" | "recientes"
  const [filtrosSeccion, setFiltrosSeccion] =
    useState<Record<string, "todas" | "destacadas" | "recientes">>({});
  
  
  // Refs para cada carrusel por sección
  const carruselRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Desplazamiento manual con flechas
  const scrollSeccion = (id: string, direccion: "left" | "right") => {
    const cont = carruselRefs.current[id];
    if (!cont) return;

    const cardWidth = 280; // mismo ancho que el auto-scroll
    const maxScroll = cont.scrollWidth - cont.clientWidth;

    if (direccion === "right") {
      const next = cont.scrollLeft + cardWidth;
      cont.scrollTo({
        left: next >= maxScroll ? maxScroll : next,
        behavior: "smooth",
      });
    } else {
      const prev = cont.scrollLeft - cardWidth;
      cont.scrollTo({
        left: prev <= 0 ? 0 : prev,
        behavior: "smooth",
      });
    }
  };


  // Auto-scroll suave cada 6 segundos en todos los carruseles
  useEffect(() => {
    const intervalo = setInterval(() => {
      const refs = carruselRefs.current;

      Object.values(refs).forEach((el) => {
        if (!el) return;
        if (el.scrollWidth <= el.clientWidth) return; // no hace falta scroll

        const cardWidth = 280; // px aproximados de cada tarjeta
        const maxScroll = el.scrollWidth - el.clientWidth;
        const next = el.scrollLeft + cardWidth;

        el.scrollTo({
          left: next >= maxScroll ? 0 : next,
          behavior: "smooth",
        });
      });
    }, 6000); // ⏱️ cada 6 segundos

    return () => clearInterval(intervalo);
  }, []);

  

  /** Ofertas asociadas a una sección concreta del grid */
  const obtenerOfertasDeSeccion = (seccionId: string): Oferta[] => {
    const tipo = tipoPorSeccion[seccionId];
    if (!tipo) return [];
    return ofertasFiltradas.filter(
      (o) => o.activa && o.tipo === tipo   // antes normalizarTipoOferta(...)
    );
  };


return (
  <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
    <div className="w-screen px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-6 md:py-8">
      <div className="grid gap-8 md:grid-cols-[340px,1fr] lg:grid-cols-[360px,1fr] items-start">
        {/* COLUMNA IZQUIERDA */}
        <aside className="space-y-6">
          {/* BLOQUE SUPERIOR: logo + bienvenida + club */}
          <HeroBienvenida
            nombre={nombre}
            agenteId={agenteId}
            lugarId={lugarId}
            accesosRapidos={accesosRapidos}
            hayClubEspecial={hayClubEspecial}
            clubLogoUrl={clubLogoUrl}
            clubNombre={clubNombre}
            clubMensaje={clubMensaje}
            clubAportacion={clubAportacion}
            clubColorAcento={clubColorAcento}
            onAbrirModal={() => setModalAbierto(true)}
            onIrALuz={() => irAComparador("LUZ")}
          />


          {/* BUSCADOR OFERTAS */}
          <section className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 md:p-5 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Título + contador de nuevas */}
              <div className="flex flex-col gap-1">
                <h2 className="text-sm md:text-base font-semibold">
                  Ofertas destacadas {leadOK ? "(desbloqueadas)" : "(bloqueadas)"}
                </h2>

                {totalNuevasGlobal > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-lime-400/15 text-lime-200 border border-lime-400/40 w-fit">
                    {totalNuevasGlobal} oferta(s) NUEVA(s) en los últimos {DIAS_OFERTA_NUEVA} días
                  </span>
                )}
              </div>

              {/* Input + sugerencias */}
              <div className="relative w-full">
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar ofertas por nombre, tipo o texto..."
                  className="w-full rounded-full bg-slate-900/70 border border-emerald-500/70 px-4 py-2 pr-9 text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  🔍
                </span>

                {sugerencias.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-xl max-h-72 overflow-y-auto z-20">
                    {sugerencias.map((oferta) => {
                      const tipoNorm = oferta.tipo; // TipoOferta
                      const cfg = getVisualConfigPorTipo(tipoNorm);

                      const pillClass =
                        cfg?.bgPill ??
                        "bg-slate-800 text-slate-100 border border-slate-600";

                      const esNueva = esOfertaNueva(oferta);

                      return (
                        <button
                          key={oferta.id}
                          type="button"
                          onClick={() => manejarClickSugerencia(oferta)}
                          className="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-slate-900/90 text-xs md:text-sm border-b border-slate-800 last:border-b-0"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`mt-0.5 inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide ${pillClass}`}
                              >
                                {cfg?.label ?? tipoNorm}
                              </span>
                              {esNueva && (
                                <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide bg-lime-400 text-slate-950">
                                  NUEVA
                                </span>
                              )}
                            </div>
                            <span className="block font-semibold text-slate-50">
                              {oferta.titulo}
                            </span>
                            <span className="block text-[11px] text-slate-300 line-clamp-1">
                              {oferta.descripcionCorta || oferta.descripcionLarga}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
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


          {/* SECCIONES (botones de la izquierda) */}
          <nav className="rounded-3xl bg-slate-900/80 border border-slate-600/70 p-5 shadow-[0_0_40px_rgba(15,23,42,0.75)] space-y-4">
            <p className="text-base md:text-xl font-extrabold text-slate-50 uppercase tracking-[0.22em] flex items-center gap-3">
              <span className="h-[2px] w-6 bg-emerald-400 rounded-full shadow-[0_0_16px_rgba(16,185,129,0.9)]" />
              Secciones
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {secciones.map((s) => (
                <button
                  key={s.id}
                  onClick={s.onClick}
                  className={`group relative overflow-hidden rounded-3xl px-4 py-4 md:px-5 md:py-5 text-left text-sm md:text-base font-semibold text-slate-50 shadow-lg shadow-black/40 ring-1 transition 
                      ${s.bgClass} ${s.ringClass}
                      hover:translate-y-[-1px] hover:shadow-[0_0_26px_rgba(15,23,42,0.9)]`}
                >
                  <span className="pointer-events-none absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition" />
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 text-xl shadow-[0_0_22px_rgba(255,255,255,0.25)]">
                      {s.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-slate-200/80">
                        Servicio
                      </span>
                      <span className="text-sm md:text-base font-bold leading-snug">
                        {s.label}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* COLUMNA DERECHA */}
        <main className="space-y-8 md:space-y-10">
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
                  const esNueva = esOfertaNueva(oferta);

                  const tipoNorm = oferta.tipo; // TipoOferta
                  const cfg = getVisualConfigPorTipo(tipoNorm);
                  const { gradient: cardGradient, glow: cardGlow } =
                    getCardStylePorTipo(tipoNorm);

                  const borderClass = cfg?.border ?? "border-slate-700";
                  const pillClass =
                    cfg?.bgPill ??
                    "bg-slate-800 text-slate-100 border border-slate-600";

                  // Texto que mostramos en la pill de tipo
                  const labelTipo =
                    cfg?.label ??
                    (tipoNorm === "LUZ"
                      ? "Luz IMPULSO"
                      : tipoNorm === "GAS"
                      ? "Gas IMPULSO"
                      : tipoNorm === "TELEFONIA"
                      ? "Telefonía IMPULSO"
                      : tipoNorm);

                  return (
                    <div
                      key={oferta.id}
                      className={`
                        relative overflow-hidden
                        min-w-[260px] max-w-xs
                        rounded-2xl border ${borderClass}
                        bg-gradient-to-br ${cardGradient}
                        ${cardGlow}
                        p-4 flex flex-col justify-between
                      `}
                    >
                      <span className="pointer-events-none absolute -right-8 -top-8 h-16 w-16 rounded-full bg-white/10 blur-xl opacity-40" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${pillClass}`}
                            >
                              {labelTipo}
                            </span>

                            {esNueva && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wide bg-lime-400 text-slate-950">
                                NUEVA
                              </span>
                            )}
                          </div>

                          {oferta.destacada && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-yellow-400/15 text-yellow-300 border border-yellow-400/30">
                              Destacada
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm md:text-base font-semibold text-slate-50">
                          {oferta.titulo}
                        </h4>
                        <p className="text-xs md:text-sm text-slate-100/90">
                          {oferta.descripcionCorta}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-100">
                        <span>
                          {formFecha(oferta.creadaEn)
                            ? `Actualizada: ${formFecha(oferta.creadaEn)}`
                            : ""}
                        </span>
                        {leadOK ? (
                          <button
                            onClick={() => irAComparadorConOferta(tipoNorm, oferta)}
                            className="px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                          >
                            Ver en comparador
                          </button>
                        ) : (
                          <button
                            onClick={() => setModalAbierto(true)}
                            className="px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
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

       

          {/* 🔥 BLOQUE: CARRUSEL DE OFERTAS POR CADA SECCIÓN DEL MENÚ */}
          {!loading && !error && (
            <section className="space-y-6">
              {secciones.map((sec) => {
                // Todas las ofertas activas de la sección
                let ofertasSeccion = obtenerOfertasDeSeccion(sec.id);
                const tipoSec = tipoPorSeccion[sec.id];

                
                const totalSeccion = ofertasSeccion.length;

                // Filtro actual de esa sección
                const filtroActual = filtrosSeccion[sec.id] ?? "todas";

                // Filtrado según "todas" | "destacadas" | "recientes"
                if (filtroActual === "destacadas") {
                  ofertasSeccion = ofertasSeccion.filter(
                    (o) => o.destacada
                  );
                } else if (filtroActual === "recientes") {
                  const ahora = new Date();
                  const hace30 = new Date();
                  hace30.setDate(ahora.getDate() - 30);
                  ofertasSeccion = ofertasSeccion.filter((o) => {
                    if (!o.creadaEn) return false;
                    const f = new Date(o.creadaEn);
                    return f >= hace30;
                  });
                }

                const sinOfertas = ofertasSeccion.length === 0;

                // 🎨 Colores de fondo para la banda de la sección
                let bgSection = "bg-slate-950/60 border-slate-800/80";
                if (tipoSec === "GAS")
                  bgSection =
                    "bg-orange-950/40 border-orange-800/70";
                else if (tipoSec === "TELEFONIA")
                  bgSection = "bg-sky-950/50 border-sky-800/70";
                else if (tipoSec === "LUZ")
                  bgSection =
                    "bg-emerald-950/40 border-emerald-800/70";

                const cfg = getVisualConfigPorTipo(tipoSec);
                const pillClass =
                  cfg?.bgPill ||
                  "bg-slate-800 text-slate-100 border border-slate-600";
                const btnClass =
                  cfg?.btn || "bg-emerald-500 hover:bg-emerald-400";


                // 🎇 Fondo y glow neon por tipo para cada TARJETA
                const { gradient: cardGradient, glow: cardGlow } = getCardStylePorTipo(tipoSec);

                const metricas = metricasPorSeccion[sec.id] ?? [];

                return (
                  <div
                    key={sec.id}
                    className={`rounded-2xl border p-5 md:p-6 ${bgSection} shadow-[0_0_30px_rgba(15,23,42,0.9)]`}
                  >
                    {/* Cabecera de la sección */}
                    <div className="flex flex-col gap-3 mb-3 md:flex-row md:items-center md:justify-between">
                      {/* Lado izquierdo: título + descripción + KPIs */}
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-200/85">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-600/80">
                            <span className="text-base">
                              {sec.icon}
                            </span>
                            <span className="font-semibold uppercase tracking-wide">
                              {sec.label}
                            </span>
                          </span>
                          {(() => {
                            const nuevasEnSeccion = ofertasSeccion.filter((o) => esOfertaNueva(o)).length;

                            if (totalSeccion === 0) {
                              return (
                                <span className="text-[11px] opacity-80">
                                  Sin ofertas para esta sección
                                </span>
                              );
                            }

                            return (
                              <span className="text-[11px] opacity-80">
                                {totalSeccion} oferta(s) totales · Mostrando {ofertasSeccion.length} ({filtroActual})
                                {nuevasEnSeccion > 0 && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-lime-400/20 text-lime-200 border border-lime-400/50">
                                    {nuevasEnSeccion} NUEVA(s)
                                  </span>
                                )}
                              </span>
                            );
                          })()}

                        </div>

                        {/* Título grande de sección */}
                        <h3 className="text-xl md:text-2xl font-extrabold text-slate-50 tracking-tight drop-shadow-[0_0_16px_rgba(15,23,42,0.9)]">
                          {sec.label}
                        </h3>

                        {/* Descripción con efecto destacado */}
                        <p className="text-sm md:text-base font-semibold text-slate-100 leading-snug">
                          <span className="bg-gradient-to-r from-emerald-300 via-emerald-100 to-slate-100 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(16,185,129,0.55)]">
                            {descripcionPorSeccion(sec.id)}
                          </span>
                        </p>

                        {/* Banda de KPIs */}
                        {metricas.length > 0 && (
                          <div className="mt-2 grid gap-2 md:grid-cols-3">
                            {metricas.map((m, idx) => (
                              <div
                                key={idx}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2.5 md:px-4 md:py-3 shadow-[0_0_20px_rgba(15,23,42,0.8)]"
                              >
                                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="flex items-baseline justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-slate-300">
                                    {m.icon && (
                                      <span className="text-sm md:text-base">
                                        {m.icon}
                                      </span>
                                    )}
                                    <span>{m.label}</span>
                                  </div>
                                  <div className="text-sm md:text-lg font-extrabold text-emerald-200 drop-shadow-[0_0_14px_rgba(16,185,129,0.9)]">
                                    {m.value}
                                  </div>
                                </div>

                                {m.hint && (
                                  <p className="mt-1 text-[10px] md:text-[11px] text-slate-300/85">
                                    {m.hint}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Lado derecho: filtros + CTA */}
                      <div className="flex flex-col items-stretch gap-2 md:items-end">
                        {/* Filtros */}
                        <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700 px-1 py-1 shadow-[0_0_18px_rgba(15,23,42,0.9)]">
                          {[
                            { id: "todas", label: "Todas" },
                            { id: "destacadas", label: "Destacadas" },
                            { id: "recientes", label: "Recientes" },
                          ].map((f) => {
                            const activo = filtroActual === f.id;
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() =>
                                  setFiltrosSeccion((prev) => ({
                                    ...prev,
                                    [sec.id]:
                                      f.id as
                                        | "todas"
                                        | "destacadas"
                                        | "recientes",
                                  }))
                                }
                                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                                  activo
                                    ? "bg-emerald-500 text-slate-950 shadow-[0_0_14px_rgba(16,185,129,0.9)]"
                                    : "text-slate-200 hover:bg-slate-800/80"
                                }`}
                              >
                                {f.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* CTA grande */}
                        <button
                          onClick={sec.onClick}
                          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold text-white ${btnClass} shadow-md shadow-slate-950/80 hover:-translate-y-[1px] transition-transform`}
                        >
                          {textoBotonSeccion(sec.id, sec.label)}
                        </button>
                      </div>
                    </div>

                    {/* 1) Mensaje cuando no hay ofertas */}
                    {sinOfertas && (
                      <p className="text-[12px] md:text-sm text-slate-200/85 mt-1">
                        En cuanto haya una oferta interesante para{" "}
                        {sec.label}, la verás aquí.
                      </p>
                    )}

                    {/* 2) Catálogo de luz unificado dentro de Luz IMPULSO */}
                    {sec.id === "luz" && (
                      <div className="mt-5 space-y-3 rounded-2xl bg-slate-950/90 border border-emerald-800/80 p-4 md:p-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <h4 className="text-sm md:text-base font-semibold flex items-center gap-2">
                            💡 Tarifas de luz disponibles (catálogo)
                            <span className="text-[11px] font-normal text-emerald-100/80">
                              ({tarifasLuzFiltradas.length} tarifa(s)
                              activas)
                            </span>
                          </h4>

                          <button
                            onClick={() => irAComparador("LUZ")}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow shadow-emerald-500/40"
                          >
                            Ir al comparador de luz
                          </button>
                        </div>

                        {/* Buscador catálogo luz */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <input
                            value={busquedaTarifasLuz}
                            onChange={(e) =>
                              setBusquedaTarifasLuz(e.target.value)
                            }
                            placeholder="Buscar por compañía, tarifa, anexo, tipo..."
                            className="w-full md:max-w-sm rounded-full bg-slate-900/80 border border-emerald-500/70 px-4 py-2 text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                          />
                          <p className="text-[11px] text-slate-300/80">
                            {loadingTarifasLuz
                              ? "Cargando catálogo de luz…"
                              : errorTarifasLuz
                              ? `Error al cargar: ${errorTarifasLuz}`
                              : tarifasLuzFiltradas.length === 0
                              ? "No hay tarifas que coincidan con tu búsqueda."
                              : `${tarifasLuzFiltradas.length} tarifa(s) coinciden con tu búsqueda.`}
                          </p>
                        </div>

                        {!loadingTarifasLuz &&
                          !errorTarifasLuz &&
                          tarifasLuzFiltradas.length > 0 && (
                            <div className="mt-2 rounded-2xl border border-emerald-800/70 bg-slate-950/95">
                              <div className="max-h-[420px] overflow-y-auto">
                                <table className="w-full table-fixed text-[11px] md:text-xs">
                                  <thead>
                                    <tr className="bg-emerald-500 text-slate-950 uppercase tracking-[0.14em] font-semibold">
                                      <th className="px-3 py-2 text-left">
                                        Compañía
                                      </th>
                                      <th className="px-3 py-2 text-left">
                                        Tarifa
                                      </th>
                                      <th className="px-3 py-2 text-left">
                                        Anexo
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.P.1
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.P.2
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.P.3
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.P.4
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.P.5
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.P.6
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.E.1
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.E.2
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.E.3
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.E.4
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.E.5
                                      </th>
                                      <th className="px-2 py-2 text-center">
                                        P.E.6
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Acción
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tarifasLuzFiltradas.map(
                                      (t, index) => (
                                        <tr
                                          key={t.id}
                                          className={`${
                                            index % 2 === 0
                                              ? "bg-slate-950"
                                              : "bg-slate-900/95"
                                          } hover:bg-emerald-900/35 transition border-b border-slate-800/70 last:border-b-0`}
                                        >
                                          <td className="px-3 py-2 font-semibold text-emerald-50 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {t.compania}
                                          </td>
                                          <td className="px-3 py-2 font-semibold text-slate-50 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {t.nombre}
                                          </td>
                                          <td className="px-3 py-2 font-semibold text-emerald-100/85 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {t.subtipo || "-"}
                                          </td>

                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.potenciaP1 != null
                                              ? t.potenciaP1.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.potenciaP2 != null
                                              ? t.potenciaP2.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.potenciaP3 != null
                                              ? t.potenciaP3.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.potenciaP4 != null
                                              ? t.potenciaP4.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.potenciaP5 != null
                                              ? t.potenciaP5.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.potenciaP6 != null
                                              ? t.potenciaP6.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>

                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.energiaP1 != null
                                              ? t.energiaP1.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.energiaP2 != null
                                              ? t.energiaP2.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.energiaP3 != null
                                              ? t.energiaP3.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.energiaP4 != null
                                              ? t.energiaP4.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.energiaP5 != null
                                              ? t.energiaP5.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>
                                          <td className="px-2 py-2 text-right font-semibold">
                                            {t.energiaP6 != null
                                              ? t.energiaP6.toFixed(
                                                  5
                                                )
                                              : "-"}
                                          </td>

                                          <td className="px-3 py-2 text-right">
                                            <button
                                              onClick={() =>
                                                irAComparador("LUZ")
                                              }
                                              className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow shadow-emerald-500/40"
                                            >
                                              Calcular ahorro
                                            </button>
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* 3) Carrusel de ofertas (solo si hay ofertas) */}
                    {!sinOfertas && (
                      <div className="relative mt-4 pb-4">
                        {/* FLECHA IZQUIERDA */}
                        <button
                          onClick={() =>
                            scrollSeccion(sec.id, "left")
                          }
                          className="
                              absolute left-2 top-1/2 -translate-y-1/2 z-20
                              bg-slate-950/90 backdrop-blur-sm border border-slate-600
                              hover:bg-slate-800 text-slate-100
                              w-9 h-9 rounded-full flex items-center justify-center
                              shadow-[0_0_16px_rgba(0,0,0,0.8)]
                            "
                        >
                          ◀
                        </button>

                        {/* FLECHA DERECHA */}
                        <button
                          onClick={() =>
                            scrollSeccion(sec.id, "right")
                          }
                          className="
                              absolute right-2 top-1/2 -translate-y-1/2 z-20
                              bg-slate-950/90 backdrop-blur-sm border border-slate-600
                              hover:bg-slate-800 text-slate-100
                              w-9 h-9 rounded-full flex items-center justify-center
                              shadow-[0_0_16px_rgba(0,0,0,0.8)]
                            "
                        >
                          ▶
                        </button>

                        {/* CARRUSEL */}
                        <div
                          className="overflow-x-auto px-10"
                          ref={(el) => {
                            carruselRefs.current[sec.id] = el;
                          }}
                        >
                          <div className="flex gap-4 min-w-full pb-1">
                            {ofertasSeccion.map((oferta) => {
                              const esNueva = esOfertaNueva(oferta);

                              return (
                                <div
                                  key={oferta.id}
                                  className={`
                                    relative overflow-hidden
                                    min-w-[280px] max-w-xs
                                    rounded-2xl border ${cfg?.border ?? "border-slate-700"}
                                    bg-gradient-to-br ${cardGradient}
                                    ${cardGlow}
                                    px-4 py-3
                                    flex flex-col justify-between
                                    transition-transform duration-300
                                    hover:-translate-y-1
                                  `}
                                >
                                  <span className="pointer-events-none absolute -right-8 -top-8 h-16 w-16 rounded-full bg-white/10 blur-xl opacity-40" />

                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${pillClass}`}
                                        >
                                          {cfg?.label || sec.label}
                                        </span>

                                        {oferta.destacada && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-yellow-50/10 text-yellow-200 border border-yellow-200/40">
                                            Destacada
                                          </span>
                                        )}

                                        {esNueva && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wide bg-lime-400 text-slate-950">
                                            NUEVA
                                          </span>
                                        )}
                                      </div>

                                      <span className="text-[10px] text-slate-100/80 whitespace-nowrap">
                                        {formFecha(oferta.creadaEn)}
                                      </span>
                                    </div>

                                    <h4 className="text-base md:text-lg font-bold text-slate-50">
                                      {oferta.titulo}
                                    </h4>
                                    <p className="text-sm md:text-base text-slate-100/90">
                                      {oferta.descripcionCorta}
                                    </p>
                                  </div>

                                  <div className="mt-3 flex items-center justify-end text-[11px] text-slate-100">
                                    {tipoSec === "LUZ" || tipoSec === "GAS" || tipoSec === "TELEFONIA" ? (
                                      <button
                                        onClick={() =>
                                          irAComparadorConOferta(tipoSec as TipoOferta, oferta)
                                        }
                                        className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold text-white ${btnClass}`}
                                      >
                                        Ver en comparador
                                      </button>
                                    ) : (
                                      <button
                                        onClick={sec.onClick}
                                        className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold text-white ${btnClass}`}
                                      >
                                        Ir a {sec.label}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

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

    <ModalDatosCliente
    abierto={modalAbierto}
    onClose={() => setModalAbierto(false)}
    onSubmit={manejarGuardarDatos}
    formNombre={formNombre}
    formEmail={formEmail}
    formTelefono={formTelefono}
    setFormNombre={setFormNombre}
    setFormEmail={setFormEmail}
    setFormTelefono={setFormTelefono}
    guardando={guardando}
    mensajeGuardarError={mensajeGuardarError}
    mensajeGuardarOK={mensajeGuardarOK}
  />


  </div>
);
}