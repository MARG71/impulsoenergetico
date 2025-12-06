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

interface TarifaResumen {
  id: number;
  tipo: string;
  subtipo: string;
  compania: string;
  nombre: string; // anexo / nombre tarifa

  // Precios de energía “clásicos” (por si tu API los usa)
  precioKwhP1: number | null;
  precioKwhP2: number | null;
  precioKwhP3: number | null;

  // Potencias P1–P6 (opcionales)
  potenciaP1?: number | null;
  potenciaP2?: number | null;
  potenciaP3?: number | null;
  potenciaP4?: number | null;
  potenciaP5?: number | null;
  potenciaP6?: number | null;

  // Energías P1–P6 (opcionales)
  energiaP1?: number | null;
  energiaP2?: number | null;
  energiaP3?: number | null;
  energiaP4?: number | null;
  energiaP5?: number | null;
  energiaP6?: number | null;
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

  // Tarifa catálogo (LUZ importada de Excel)
  const [tarifasLuz, setTarifasLuz] = useState<TarifaResumen[]>([]);
  const [loadingTarifasLuz, setLoadingTarifasLuz] = useState(false);
  const [errorTarifasLuz, setErrorTarifasLuz] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");

  const [nombre, setNombre] = useState<string | null>(null);
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);
  const [leadOK, setLeadOK] = useState(false);

  // 🔹 Estado para el modal de datos
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardarError, setMensajeGuardarError] = useState<string | null>(
    null
  );
  const [mensajeGuardarOK, setMensajeGuardarOK] = useState<string | null>(null);

  // Datos especiales de club / lugar
  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null);
  const [clubMensaje, setClubMensaje] = useState<string | null>(null);
  const [clubAportacion, setClubAportacion] = useState<number | null>(null);
  const [clubColorAcento, setClubColorAcento] = useState<string>("#22c55e");

  // Lee datos básicos y posibles params extra de club
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

    // Extra: datos de club que puedan venir por querystring
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

  // 🧭 Mantener agenteId y lugarId en la URL para no perder trazabilidad
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

  // Si tenemos lugarId, cargamos info especial REAL del lugar
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

        // Solo mostramos la tarjeta si el lugar está marcado como especial
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

  // ⚙️ Inicializar formulario con nombre + localStorage
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

  // Carga de ofertas
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

  // Cargar tarifas REALES de luz (OfertaTarifa) para mostrarlas en bienvenida
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
        console.log("PRIMERA TARIFA API", items[0]);

        const lista: TarifaResumen[] = items.map((t: any) => ({
          id: t.id,
          tipo: t.tipo,
          subtipo: t.subtipo,
          compania: t.compania,
          nombre: t.nombre,
          precioKwhP1: t.precioKwhP1 != null ? Number(t.precioKwhP1) : null,
          precioKwhP2: t.precioKwhP2 != null ? Number(t.precioKwhP2) : null,
          precioKwhP3: t.precioKwhP3 != null ? Number(t.precioKwhP3) : null,

          // 🔹 POTENCIAS P1–P6 (probamos varios nombres posibles)
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

          // Energías P1–P6. Si no vienen, usamos como mínimo P1–P3 de precioKwh
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

  // 🔍 Sugerencias para el desplegable (autocomplete)
  const sugerencias = useMemo(() => {
    const txt = busqueda.trim();
    if (txt.length < 2) return [];
    return ofertasFiltradas.slice(0, 8);
  }, [busqueda, ofertasFiltradas]);

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

  // 👉 Enviamos ofertaId + ofertaNombre + tipo al comparador
  const irAComparadorConOferta = (tipo: TipoOferta, oferta: Oferta) => {
    const extra: Record<string, string> = {
      ofertaId: String(oferta.id),
    };

    if (oferta.titulo) {
      extra.ofertaNombre = oferta.titulo;
    }

    const key = normalizarTipoOferta(tipo);
    if (key === "LUZ") extra.tipo = "luz";
    else if (key === "GAS") extra.tipo = "gas";
    else if (key === "TELEFONIA") extra.tipo = "telefonia";

    router.push(`/comparador${buildQuery(extra)}`);
  };

  // Click en una sugerencia del buscador
  const manejarClickSugerencia = (oferta: Oferta) => {
    const tipoNorm = normalizarTipoOferta(oferta.tipo as string);
    irAComparadorConOferta(tipoNorm, oferta);
    setBusqueda(""); // limpiar y cerrar desplegable
  };

  // Guardar datos del modal
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

      // Guardamos en localStorage para futuros accesos
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

  // 🔹 Config de secciones para los botones tipo tarjeta (neón)
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
      label: "Aerotermia IMPULSO",
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

    // 👉 NUEVO BOTÓN PLADUR DICOPLAC
    {
      id: "pladur",
      label: "Pladur DICOPLAC",
      icon: "🧱",
      bgClass:
        "bg-gradient-to-br from-zinc-400/35 via-zinc-400/10 to-slate-950/90",
      ringClass: "ring-zinc-300/70 group-hover:ring-zinc-100/90",
      onClick: () => router.push(`/pladur-dicoplac${buildQuery()}`),
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
  ];


  // accesos rápidos
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="w-screen px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-6 md:py-8">
        <div className="grid gap-8 md:grid-cols-[340px,1fr] lg:grid-cols-[360px,1fr] items-start">
          {/* COLUMNA IZQUIERDA (logo + bienvenida + buscador + secciones) */}
          <aside className="space-y-6">
            {/* BLOQUE SUPERIOR: logo (izquierda) + bienvenida+club (derecha) */}
            <div className="rounded-3xl bg-slate-950/95 border border-emerald-500/50 p-6 flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch shadow-xl shadow-emerald-500/30">
              {/* Columna izquierda: logo + contacto + subtítulo */}
              <div className="flex flex-col justify-between gap-4 lg:w-[280px] xl:w-[320px]">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center">
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

                  {/* Teléfono + email */}
                  <div className="space-y-1">
                    <p className="text-base md:text-lg font-bold text-slate-50">
                      Tel. 692 13 70 48
                    </p>
                    <p className="text-base md:text-lg font-bold text-slate-50">
                      E-mail:{" "}
                      <a
                        href="mailto:info@impulsoenergetico.es"
                        className="underline decoration-emerald-400/70 underline-offset-4"
                      >
                        info@impulsoenergetico.es
                      </a>
                    </p>
                  </div>
                </div>

                <div className="space-y-1 mt-2">
                  <p className="text-base md:text-lg font-bold text-slate-50">
                    Plataforma de ahorro y comisiones
                  </p>
                  <p className="text-[11px] md:text-xs tracking-[0.22em] uppercase text-emerald-300 font-semibold">
                    Servicios y ventajas para socios
                  </p>
                </div>
              </div>

              {/* Columna derecha: bienvenida + tarjeta club */}
              <div className="flex-1 rounded-2xl bg-slate-900/80 border border-slate-700/80 p-4 md:p-5 lg:p-6 shadow-[0_0_32px_rgba(15,23,42,0.9)] flex flex-col lg:flex-row gap-5 lg:gap-7 items-start justify-between">
                {/* Texto bienvenida + botones + accesos rápidos */}
                <div className="flex-1 space-y-3">
                  <div className="text-[10px] md:text-xs font-semibold tracking-[0.28em] text-emerald-300 uppercase">
                    IMPULSO ENERGÉTICO
                  </div>

                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight">
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

                  {/* Botones principales + accesos rápidos */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setModalAbierto(true)}
                        className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 font-semibold text-slate-950 shadow shadow-emerald-500/40 text-xs md:text-sm"
                      >
                        Acceder / actualizar mis datos
                      </button>
                      <button
                        onClick={() => irAComparador("LUZ")}
                        className="px-4 py-2.5 rounded-full border border-emerald-300 text-emerald-200 hover:bg-emerald-500/10 text-xs md:text-sm"
                      >
                        LUZ
                      </button>
                    </div>

                    {/* Accesos rápidos */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-slate-300">
                        ACCESOS RÁPIDOS A SECCIONES
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {accesosRapidos.map((a) => (
                          <button
                            key={a.label}
                            type="button"
                            onClick={a.onClick}
                            className="px-3 py-1.5 rounded-full border border-slate-600 text-[11px] text-slate-100 hover:bg-slate-800/80"
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta club */}
                {hayClubEspecial && (
                  <div
                    className="w-full lg:w-[260px] xl:w-[300px] relative overflow-hidden rounded-2xl bg-slate-950/80 border p-4 flex gap-4 items-center shadow-[0_0_28px_rgba(16,185,129,0.45)]"
                    style={{
                      borderColor: clubColorAcento || "#22c55e",
                      boxShadow: `0 0 32px ${
                        clubColorAcento || "rgba(34,197,94,0.55)"
                      }`,
                    }}
                  >
                    <span className="pointer-events-none absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/10 blur-xl opacity-60" />

                    <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-slate-900/90 border border-white/15 flex items-center justify-center overflow-hidden">
                      {clubLogoUrl ? (
                        <Image
                          src={clubLogoUrl}
                          alt={clubNombre || "Logo club"}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-2xl">🤝</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="text-[9px] uppercase tracking-[0.22em] text-emerald-200/90 font-semibold">
                        Club / Asociación
                      </div>
                      <div className="text-xs md:text-sm font-bold">
                        {clubNombre || "Programa solidario"}
                      </div>
                      {clubMensaje && (
                        <p className="text-[10px] md:text-xs text-slate-200/90">
                          {clubMensaje}
                        </p>
                      )}
                      {clubAportacion != null &&
                        !Number.isNaN(clubAportacion) && (
                          <div className="inline-flex items-center mt-1 rounded-full bg-black/40 px-3 py-1 text-[10px] font-semibold text-emerald-200 border border-emerald-300/50">
                            💚 Aportación acumulada:{" "}
                            <span className="ml-1">
                              {clubAportacion.toLocaleString("es-ES", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}{" "}
                              €
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* === BUSCADOR OFERTAS === */}
            <section className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 md:p-5 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-sm md:text-base font-semibold">
                  Ofertas destacadas {leadOK ? "(desbloqueadas)" : "(bloqueadas)"}
                </h2>
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

                  {/* DROPDOWN DE SUGERENCIAS */}
                  {sugerencias.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-xl max-h-72 overflow-y-auto z-20">
                      {sugerencias.map((oferta) => {
                        const tipoNorm = normalizarTipoOferta(
                          oferta.tipo as string
                        );
                        const cfg = tipoConfig[tipoNorm];

                        return (
                          <button
                            key={oferta.id}
                            type="button"
                            onClick={() => manejarClickSugerencia(oferta)}
                            className="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-slate-900/90 text-xs md:text-sm border-b border-slate-800 last:border-b-0"
                          >
                            <span
                              className={`mt-0.5 inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide ${cfg.bgPill}`}
                            >
                              {cfg.label}
                            </span>
                            <span className="flex-1">
                              <span className="block font-semibold text-slate-50">
                                {oferta.titulo}
                              </span>
                              <span className="block text-[11px] text-slate-300 line-clamp-1">
                                {oferta.descripcionCorta ||
                                  oferta.descripcionLarga}
                              </span>
                            </span>
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

            {/* SECCIONES */}
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

          {/* COLUMNA DERECHA: ofertas y catálogo */}
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
                    const tipoNorm = normalizarTipoOferta(
                      oferta.tipo as string
                    );
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
                                irAComparadorConOferta(tipoNorm, oferta)
                              }
                              className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                            >
                              Ver en comparador
                            </button>
                          ) : (
                            <button
                              onClick={() => setModalAbierto(true)}
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

            {/* TARIFAS REALES DE LUZ (catálogo Excel) — TABLA ESTILO COMPARATIVAS */}
            {!loadingTarifasLuz && !errorTarifasLuz && tarifasLuz.length > 0 && (
              <section className="space-y-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                    💡 Tarifas de luz disponibles (catálogo)
                    <span className="text-[11px] font-normal text-emerald-100/80">
                      ({tarifasLuz.length} tarifa(s) activas)
                    </span>
                  </h3>

                  <button
                    onClick={() => irAComparador("LUZ")}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow shadow-emerald-500/40"
                  >
                    Ir al comparador de luz
                  </button>
                </div>

                {/* CONTENEDOR TABLA — ajustado al ancho de pantalla */}
                <div className="mt-2 rounded-2xl border border-emerald-800/70 bg-slate-950/95">
                  {/* solo scroll vertical si hay muchas filas */}
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full table-fixed text-[11px] md:text-xs">
                      <thead>
                        <tr className="bg-emerald-500 text-slate-950 uppercase tracking-[0.14em] font-semibold">
                          <th className="px-3 py-2 text-left">Compañía</th>
                          <th className="px-3 py-2 text-left">Tarifa</th>
                          <th className="px-3 py-2 text-left">Anexo</th>
                          <th className="px-2 py-2 text-center">P.P.1</th>
                          <th className="px-2 py-2 text-center">P.P.2</th>
                          <th className="px-2 py-2 text-center">P.P.3</th>
                          <th className="px-2 py-2 text-center">P.P.4</th>
                          <th className="px-2 py-2 text-center">P.P.5</th>
                          <th className="px-2 py-2 text-center">P.P.6</th>
                          <th className="px-2 py-2 text-center">P.E.1</th>
                          <th className="px-2 py-2 text-center">P.E.2</th>
                          <th className="px-2 py-2 text-center">P.E.3</th>
                          <th className="px-2 py-2 text-center">P.E.4</th>
                          <th className="px-2 py-2 text-center">P.E.5</th>
                          <th className="px-2 py-2 text-center">P.E.6</th>
                          <th className="px-3 py-2 text-right">Acción</th>
                        </tr>
                      </thead>

                      <tbody>
                        {tarifasLuz.map((t, index) => (
                          <tr
                            key={t.id}
                            className={`${
                              index % 2 === 0
                                ? "bg-slate-950"
                                : "bg-slate-900/95"
                            } hover:bg-emerald-900/35 transition border-b border-slate-800/70 last:border-b-0`}
                          >
                            {/* COMPAÑÍA */}
                            <td className="px-3 py-2 font-semibold text-emerald-50 whitespace-nowrap overflow-hidden text-ellipsis">
                              {t.compania}
                            </td>

                            {/* TARIFA (se adapta al espacio que queda) */}
                            <td className="px-3 py-2 font-semibold text-slate-50 whitespace-nowrap overflow-hidden text-ellipsis">
                              {t.nombre}
                            </td>

                            {/* ANEXO (estrecho) */}
                            <td className="px-3 py-2 font-semibold text-emerald-100/85 whitespace-nowrap overflow-hidden text-ellipsis">
                              {t.subtipo || "-"}
                            </td>

                            {/* POTENCIAS */}
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.potenciaP1 != null ? t.potenciaP1.toFixed(5) : "-"}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.potenciaP2 != null ? t.potenciaP2.toFixed(5) : "-"}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.potenciaP3 != null ? t.potenciaP3.toFixed(5) : "-"}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.potenciaP4 != null ? t.potenciaP4.toFixed(5) : "-"}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.potenciaP5 != null ? t.potenciaP5.toFixed(5) : "-"}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.potenciaP6 != null ? t.potenciaP6.toFixed(5) : "-"}
                            </td>

                            {/* ENERGÍAS */}
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.energiaP1 != null ? t.energiaP1.toFixed(5) : "-"}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.energiaP2 != null ? t.energiaP2.toFixed(5) : "-"}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.energiaP3 != null ? t.energiaP3.toFixed(5) : "-"}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.energiaP4 != null ? t.energiaP4.toFixed(5) : "-"}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.energiaP5 != null ? t.energiaP5.toFixed(5) : "-"}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {t.energiaP6 != null ? t.energiaP6.toFixed(5) : "-"}
                            </td>

                            {/* BOTÓN */}
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => irAComparador("LUZ")}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow shadow-emerald-500/40"
                              >
                                Calcular ahorro
                              </button>
                            </td>
                          </tr>
                        ))}

                        {tarifasLuz.length === 0 && (
                          <tr>
                            <td
                              colSpan={16}
                              className="px-3 py-4 text-center text-[11px] text-slate-400"
                            >
                              No hay tarifas de luz disponibles.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* BLOQUES POR TIPO — SOLO GAS Y TELEFONÍA EN FILAS VERTICALES */}
            {!loading && !error && (
              <section className="space-y-6">
                {(["GAS", "TELEFONIA"] as TipoOferta[]).map((tipo) => {
                  const lista = ofertasPorTipo[tipo];
                  if (!lista || lista.length === 0) return null;
                  const cfg = tipoConfig[tipo];

                  const bgSection =
                    tipo === "GAS"
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

                      {/* LISTA EN FILAS CON SCROLL VERTICAL */}
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {lista.map((oferta) => (
                          <div
                            key={oferta.id}
                            className="w-full rounded-2xl bg-slate-950/80 border border-slate-700 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 mb-1">
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

                            <div className="flex flex-row md:flex-col items-end gap-2 text-[11px] text-slate-400">
                              <span className="whitespace-nowrap">
                                {formFecha(oferta.creadaEn)}
                              </span>
                              <button
                                onClick={() =>
                                  irAComparadorConOferta(tipo, oferta)
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

      {/* MODAL: Acceder / actualizar mis datos */}
      {modalAbierto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-3">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.6)] p-5 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-50">
                  Actualiza tus datos
                </h2>
                <p className="text-xs md:text-sm text-slate-300 mt-1">
                  Revisa tu nombre, email y teléfono para poder enviarte ofertas
                  y seguimiento de tus comparativas.
                </p>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-100 text-lg"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={manejarGuardarDatos} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                  required
                />
              </div>

              {mensajeGuardarError && (
                <p className="text-xs text-red-300">{mensajeGuardarError}</p>
              )}
              {mensajeGuardarOK && (
                <p className="text-xs text-emerald-300">{mensajeGuardarOK}</p>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-full border border-slate-600 text-xs md:text-sm text-slate-200 hover:bg-slate-800/70"
                >
                  Salir sin guardar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-xs md:text-sm font-semibold text-slate-950 shadow shadow-emerald-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
